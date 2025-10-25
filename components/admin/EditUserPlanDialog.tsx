'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  full_name: string | null
  plan_type: 'free' | 'pro' | 'admin'
  subscription_status: 'active' | 'inactive' | 'past_due' | 'cancelled'
}

interface EditUserPlanDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditUserPlanDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: EditUserPlanDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'admin'>(
    user?.plan_type || 'free'
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Update selected plan when user changes
  useEffect(() => {
    if (user) {
      setSelectedPlan(user.plan_type)
    } else {
      setSelectedPlan('free')
    }
  }, [user])

  const handleSubmit = async () => {
    if (!user) return

    if (selectedPlan === user.plan_type) {
      toast({
        title: 'Nenhuma alteração',
        description: 'O plano selecionado é o mesmo do usuário.',
        variant: 'default',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_type: selectedPlan }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar plano')
      }

      toast({
        title: 'Plano atualizado',
        description: `O plano de ${user.full_name || user.email} foi atualizado para ${
          selectedPlan === 'free'
            ? 'Gratuito'
            : selectedPlan === 'pro'
              ? 'Premium'
              : 'Administrador'
        }.`,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar o plano.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'free':
        return 'Gratuito'
      case 'pro':
        return 'Premium'
      case 'admin':
        return 'Administrador'
      default:
        return plan
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Plano do Usuário</DialogTitle>
          <DialogDescription>
            Altere o plano de acesso de {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Info */}
          <div className="space-y-1">
            <p className="text-sm font-medium">Usuário</p>
            <p className="text-sm text-muted-foreground">
              {user.full_name || 'Sem nome'} ({user.email})
            </p>
          </div>

          {/* Current Plan */}
          <div className="space-y-1">
            <p className="text-sm font-medium">Plano Atual</p>
            <p className="text-sm text-muted-foreground">{getPlanLabel(user.plan_type)}</p>
          </div>

          {/* New Plan Selection */}
          <div className="space-y-2">
            <Label htmlFor="plan">Novo Plano</Label>
            <Select value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as typeof selectedPlan)}>
              <SelectTrigger id="plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="pro">Premium</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Warning for Downgrade */}
          {user.plan_type === 'pro' && selectedPlan === 'free' && (
            <Alert className="border-orange-500 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Ao downgrade para Gratuito, o usuário perderá acesso aos recursos premium imediatamente.
              </AlertDescription>
            </Alert>
          )}

          {/* Warning for Admin */}
          {selectedPlan === 'admin' && user.plan_type !== 'admin' && (
            <Alert className="border-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Administradores têm acesso total ao sistema. Conceda este acesso apenas a pessoas de confiança.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || selectedPlan === user.plan_type}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
