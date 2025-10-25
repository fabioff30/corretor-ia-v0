'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const profileSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome muito longo'),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfileEditForm() {
  const { profile, updateProfile } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true)
    setSuccess(false)

    try {
      const { data: updatedProfile, error } = await updateProfile({ full_name: data.full_name })

      if (error) {
        toast({
          title: 'Erro ao atualizar perfil',
          description: error,
          variant: 'destructive',
        })
        return
      }

      setSuccess(true)
      if (updatedProfile) {
        reset({ full_name: updatedProfile.full_name || data.full_name })
      }
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
      })

      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao atualizar seu perfil. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    reset({ full_name: profile?.full_name || '' })
  }, [profile?.full_name, reset])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Pessoais</CardTitle>
        <CardDescription>Atualize seu nome e informações de perfil</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome Completo */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              placeholder="Seu nome completo"
              {...register('full_name')}
              disabled={isSubmitting}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email (somente leitura) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ''}
              disabled
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado. Entre em contato com o suporte se precisar mudá-lo.
            </p>
          </div>

          {/* Plano (somente leitura) */}
          <div className="space-y-2">
            <Label htmlFor="plan">Plano Atual</Label>
            <Input
              id="plan"
              value={
                profile?.plan_type === 'pro'
                  ? 'Premium'
                  : profile?.plan_type === 'admin'
                    ? 'Administrador'
                    : 'Gratuito'
              }
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>

          {/* Mensagem de Sucesso */}
          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Perfil atualizado com sucesso!
              </AlertDescription>
            </Alert>
          )}

          {/* Botão de Salvar */}
          <div className="flex justify-end">
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
