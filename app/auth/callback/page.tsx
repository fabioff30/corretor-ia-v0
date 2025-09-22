"use client"

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { getSafeRedirectUrl } from '@/utils/auth-helpers'

// Force dynamic rendering for this page since it uses searchParams
export const dynamic = 'force-dynamic'

/**
 * Componente interno que usa useSearchParams
 */
function AuthCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Obter parâmetros da URL para processar o callback
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // Se houve erro no provider
        if (error) {
          setStatus('error')
          setMessage(errorDescription || 'Erro na autenticação social')
          
          // Redirecionar para login após alguns segundos
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
          return
        }

        // Se não há código, tentar processar hash fragment (para alguns providers)
        if (!code) {
          const { data, error: supabaseError } = await supabase.auth.getSession()
          
          if (supabaseError) {
            console.error('Erro ao processar callback:', supabaseError)
            setStatus('error')
            setMessage('Erro ao processar autenticação')
            
            setTimeout(() => {
              router.push('/auth/login')
            }, 3000)
            return
          }

          if (data.session) {
            setStatus('success')
            setMessage('Login realizado com sucesso!')
            
            // Redirecionar após sucesso
            const redirectTo = getSafeRedirectUrl(searchParams.get('redirect'), '/')
            setTimeout(() => {
              router.push(redirectTo)
            }, 1500)
            return
          }
        }

        // Processar código de autorização
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code!)
        
        if (exchangeError) {
          console.error('Erro ao trocar código por sessão:', exchangeError)
          setStatus('error')
          setMessage('Erro ao completar autenticação')
          
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
          return
        }

        if (data.session) {
          setStatus('success')
          setMessage('Login realizado com sucesso!')
          
          // Criar entrada na tabela users se não existir
          try {
            const { error: insertError } = await supabase
              .from('users')
              .insert([
                {
                  id: data.session.user.id,
                  email: data.session.user.email!,
                  name: data.session.user.user_metadata?.name || 
                        data.session.user.user_metadata?.full_name || '',
                },
              ])

            // Ignorar erro de duplicata (usuário já existe)
            if (insertError && insertError.code !== '23505') {
              console.error('Erro ao criar entrada do usuário:', insertError)
            }
          } catch (error) {
            console.error('Erro ao processar dados do usuário:', error)
          }
          
          // Redirecionar após sucesso
          const redirectTo = getSafeRedirectUrl(searchParams.get('redirect'), '/')
          setTimeout(() => {
            router.push(redirectTo)
          }, 1500)
        } else {
          setStatus('error')
          setMessage('Não foi possível criar a sessão')
          
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
        }
      } catch (error) {
        console.error('Erro no callback de autenticação:', error)
        setStatus('error')
        setMessage('Erro inesperado na autenticação')
        
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            
            {status === 'loading' && 'Processando Login...'}
            {status === 'success' && 'Login Realizado!'}
            {status === 'error' && 'Erro no Login'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            {message || 'Aguarde enquanto processamos seu login...'}
          </p>
          
          {status === 'success' && (
            <p className="text-sm text-muted-foreground mt-2">
              Redirecionando...
            </p>
          )}
          
          {status === 'error' && (
            <p className="text-sm text-muted-foreground mt-2">
              Redirecionando para a página de login...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Loading fallback component
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando...
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Processando autenticação...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Página de callback para autenticação OAuth (Google, GitHub, etc.)
 * Processa o retorno do provider e redireciona adequadamente
 */
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  )
}