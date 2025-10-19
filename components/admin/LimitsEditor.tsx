'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, Save, AlertCircle, CheckCircle2, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PlanLimits {
  id: string
  plan_type: 'free' | 'pro'
  max_characters: number
  corrections_per_day: number
  rewrites_per_day: number
  ai_analyses_per_day: number
  show_ads: boolean
}

interface LimitsEditorProps {
  limits: PlanLimits[]
  onUpdate: () => void
}

const limitsSchema = z.object({
  max_characters: z
    .number()
    .max(50000, 'Máximo 50.000 caracteres')
    .refine((value) => value === -1 || value >= 100, {
      message: 'Use -1 para ilimitado ou mínimo de 100 caracteres',
    }),
  corrections_per_day: z.number().min(-1, 'Use -1 para ilimitado').max(1000, 'Máximo 1000 por dia'),
  rewrites_per_day: z.number().min(-1, 'Use -1 para ilimitado').max(1000, 'Máximo 1000 por dia'),
  ai_analyses_per_day: z.number().min(-1, 'Use -1 para ilimitado').max(100, 'Máximo 100 por dia'),
  show_ads: z.boolean(),
})

type LimitsFormData = z.infer<typeof limitsSchema>

export function LimitsEditor({ limits, onUpdate }: LimitsEditorProps) {
  const [activeTab, setActiveTab] = useState<'free' | 'pro'>('free')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingData, setPendingData] = useState<LimitsFormData | null>(null)
  const { toast } = useToast()

  const currentLimits = limits.find((l) => l.plan_type === activeTab)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<LimitsFormData>({
    resolver: zodResolver(limitsSchema),
    defaultValues: currentLimits
      ? {
          max_characters: currentLimits.max_characters,
          corrections_per_day: currentLimits.corrections_per_day,
          rewrites_per_day: currentLimits.rewrites_per_day,
          ai_analyses_per_day: currentLimits.ai_analyses_per_day,
          show_ads: currentLimits.show_ads,
        }
      : undefined,
  })

  // Update form when tab changes
  useState(() => {
    if (currentLimits) {
      setValue('max_characters', currentLimits.max_characters)
      setValue('corrections_per_day', currentLimits.corrections_per_day)
      setValue('rewrites_per_day', currentLimits.rewrites_per_day)
      setValue('ai_analyses_per_day', currentLimits.ai_analyses_per_day)
      setValue('show_ads', currentLimits.show_ads)
    }
  })

  const onSubmit = (data: LimitsFormData) => {
    setPendingData(data)
    setConfirmDialogOpen(true)
  }

  const handleConfirmedSubmit = async () => {
    if (!pendingData) return

    setIsSubmitting(true)
    setConfirmDialogOpen(false)

    try {
      const response = await fetch('/api/admin/limites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_type: activeTab,
          ...pendingData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar limites')
      }

      toast({
        title: 'Limites atualizados',
        description: `Os limites do plano ${activeTab === 'free' ? 'Gratuito' : 'Premium'} foram atualizados com sucesso.`,
      })

      onUpdate()
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar os limites.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
      setPendingData(null)
    }
  }

  const formatValue = (value: number) => {
    return value === -1 ? 'Ilimitado' : value.toLocaleString('pt-BR')
  }

  const showAds = watch('show_ads')

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Editor de Limites
          </CardTitle>
          <CardDescription>
            Configure os limites de uso para cada plano. Use -1 para valores ilimitados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'free' | 'pro')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="free">Plano Gratuito</TabsTrigger>
              <TabsTrigger value="pro">Plano Premium</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit(onSubmit)}>
              <TabsContent value={activeTab} className="space-y-6 mt-6">
                {/* Character Limits */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Limite de Caracteres</h3>
                  <div className="space-y-2">
                    <Label htmlFor="max_characters">Máximo de Caracteres por Operação</Label>
                    <Input
                      id="max_characters"
                      type="number"
                      {...register('max_characters', { valueAsNumber: true })}
                      disabled={isSubmitting}
                    />
                    {errors.max_characters && (
                      <p className="text-sm text-destructive">{errors.max_characters.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Limite máximo de caracteres por operação. Use -1 para ilimitado.
                    </p>
                  </div>
                </div>

                {/* Daily Limits */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Limites Diários</h3>

                  <div className="space-y-2">
                    <Label htmlFor="corrections_per_day">Correções por Dia</Label>
                    <Input
                      id="corrections_per_day"
                      type="number"
                      {...register('corrections_per_day', { valueAsNumber: true })}
                      disabled={isSubmitting}
                    />
                    {errors.corrections_per_day && (
                      <p className="text-sm text-destructive">{errors.corrections_per_day.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Use -1 para ilimitado</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rewrites_per_day">Reescritas por Dia</Label>
                    <Input
                      id="rewrites_per_day"
                      type="number"
                      {...register('rewrites_per_day', { valueAsNumber: true })}
                      disabled={isSubmitting}
                    />
                    {errors.rewrites_per_day && (
                      <p className="text-sm text-destructive">{errors.rewrites_per_day.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Use -1 para ilimitado</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai_analyses_per_day">Análises de IA por Dia</Label>
                    <Input
                      id="ai_analyses_per_day"
                      type="number"
                      {...register('ai_analyses_per_day', { valueAsNumber: true })}
                      disabled={isSubmitting}
                    />
                    {errors.ai_analyses_per_day && (
                      <p className="text-sm text-destructive">{errors.ai_analyses_per_day.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Use -1 para ilimitado</p>
                  </div>
                </div>

                {/* Ad Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Configurações de Anúncios</h3>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="show_ads">Exibir Anúncios</Label>
                      <p className="text-xs text-muted-foreground">
                        Mostrar anúncios para usuários deste plano
                      </p>
                    </div>
                    <Switch
                      id="show_ads"
                      checked={showAds}
                      onCheckedChange={(checked) => setValue('show_ads', checked, { shouldDirty: true })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Warning */}
                <Alert className="border-orange-500 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    As mudanças serão aplicadas imediatamente para todos os usuários do plano{' '}
                    {activeTab === 'free' ? 'Gratuito' : 'Premium'}.
                  </AlertDescription>
                </Alert>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button type="submit" disabled={!isDirty || isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </TabsContent>
            </form>
          </Tabs>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja atualizar os limites do plano{' '}
              {activeTab === 'free' ? 'Gratuito' : 'Premium'}? As mudanças serão aplicadas imediatamente
              para todos os usuários.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSubmit}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
