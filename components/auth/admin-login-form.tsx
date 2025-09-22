"use client"

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { LoginSchema } from '@/contexts/unified-auth-context'
import { getAuthErrorMessage, getSafeRedirectUrl } from '@/utils/auth-helpers'
import { Eye, EyeOff, Shield, Loader2 } from 'lucide-react'

interface AdminLoginFormProps {
  onSuccess?: () => void
  embedded?: boolean
  className?: string
}

export function AdminLoginForm({ onSuccess, embedded = false, className }: AdminLoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { signIn, isAuthenticated } = useAdminAuth()

  // Se já está autenticado, não mostrar o formulário
  if (isAuthenticated && !embedded) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Validar dados do formulário
      const validatedData = LoginSchema.parse({ email, password })
      
      // Tentar fazer login
      const result = await signIn(validatedData)
      
      if (result.error) {
        setError(getAuthErrorMessage(result.error))
        return
      }

      // Sucesso no login
      toast({
        title: 'Login realizado com sucesso',
        description: 'Bem-vindo de volta, administrador!',
      })

      // Executar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess()
      } else {
        // Redirecionar para a página desejada ou dashboard admin
        const redirectTo = getSafeRedirectUrl(
          searchParams.get('redirect'),
          '/admin/dashboard'
        )
        router.push(redirectTo)
      }

      // Limpar formulário
      setEmail('')
      setPassword('')
    } catch (error: any) {
      if (error.name === 'ZodError') {
        setError(error.errors[0]?.message || 'Dados inválidos')
      } else {
        setError(getAuthErrorMessage(error))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const content = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="admin-email">Email</Label>
        <Input
          id="admin-email"
          type="email"
          placeholder="admin@corretoria.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="h-10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-password">Senha</Label>
        <div className="relative">
          <Input
            id="admin-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-10 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !email || !password}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Entrar como Admin
          </>
        )}
      </Button>

      <div className="text-sm text-muted-foreground text-center">
        Acesso restrito para administradores
      </div>
    </form>
  )

  if (embedded) {
    return <div className={className}>{content}</div>
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className || ''}`}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="h-5 w-5" />
            Acesso Administrativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Componente simplificado para login admin inline
 */
export function AdminLoginInline() {
  const { isAuthenticated } = useAdminAuth()

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-[100] w-full max-w-sm">
      <AdminLoginForm embedded />
    </div>
  )
}