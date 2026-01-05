"use client"

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { User as SupabaseUser, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase, User, UserWithSubscription } from '@/lib/supabase'
import { sendGTMEvent } from '@/utils/gtm-helper'

interface AuthContextType {
  user: UserWithSubscription | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<{ error: Error | null }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithSubscription | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const lastAuthEventRef = useRef<{ event: AuthChangeEvent; sessionId: string | null } | null>(null)
  const signInInProgressRef = useRef(false)
  const lastSignInAttemptRef = useRef<number>(0)

  // Função para buscar dados completos do usuário
  const fetchUserWithSubscription = async (supabaseUser: SupabaseUser): Promise<UserWithSubscription | null> => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_with_subscription', { user_uuid: supabaseUser.id })
      
      if (error) throw error
      
      // Se o usuário não existe no banco, criar automaticamente
      if (!data) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: supabaseUser.id,
              email: supabaseUser.email!,
              name: supabaseUser.user_metadata?.name || '',
            },
          ])

        if (insertError && insertError.code !== '23505') {
          console.error('Erro ao criar entrada do usuário:', insertError)
        }

        // Retornar dados básicos do usuário recém-criado
        return {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name,
          created_at: supabaseUser.created_at,
          updated_at: new Date().toISOString(),
          subscription: {
            id: 'free',
            user_id: supabaseUser.id,
            status: 'active',
            plan: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }
      
      return data as unknown as UserWithSubscription
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error)
      return null
    }
  }

  // Função para atualizar dados do usuário
  const refreshUser = async () => {
    try {
      // ✅ Use getUser() instead of getSession() for server-side security
      const { data: { user: authUser }, error } = await supabase.auth.getUser()

      if (error) {
        console.error('[Auth] Error refreshing user:', error)
        return
      }

      if (authUser) {
        const userData = await fetchUserWithSubscription(authUser)
        setUser(userData)
      }
    } catch (error) {
      console.error('[Auth] Erro ao atualizar dados do usuário:', error)
    }
  }

  useEffect(() => {
    const initSupabaseAuth = async () => {
      try {
        // ✅ Use getUser() instead of getSession() for security
        // getUser() revalidates with Supabase server
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.error('[Auth] Error getting user:', userError)
        }

        // Get session for onAuthStateChange listener
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.warn('[Auth] Error getting session:', sessionError)
        }

        setSession(session)

        if (authUser) {
          const userData = await fetchUserWithSubscription(authUser)
          setUser(userData)
        }
      } catch (error) {
        console.error('[Auth] Erro na inicialização da autenticação:', error)
      } finally {
        setLoading(false)
      }
    }

    initSupabaseAuth()

    // Escutar mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sessionIdentifier = session?.access_token ?? session?.refresh_token ?? null
      const lastEvent = lastAuthEventRef.current

      if (lastEvent && lastEvent.event === event && lastEvent.sessionId === sessionIdentifier) {
        console.debug('[Auth] Ignoring duplicate auth event:', event)
        return
      }

      lastAuthEventRef.current = { event, sessionId: sessionIdentifier }
      console.log('Auth state changed:', event, session?.user?.email)

      // Track login event
      if (event === 'SIGNED_IN' && session?.user) {
        sendGTMEvent('login', {
          method: session.user.app_metadata?.provider || 'unknown',
          user_id: session.user.id,
        })
      }

      // Track logout event
      if (event === 'SIGNED_OUT') {
        sendGTMEvent('logout', {
          method: 'manual',
        })
      }

      setSession(session)
      setLoading(true)

      if (session?.user) {
        const userData = await fetchUserWithSubscription(session.user)
        setUser(userData)

        // After successful login/signup, try to link any pending guest payments (PIX + Stripe)
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          // Retry logic with exponential backoff
          const linkGuestPayments = async (attempt = 1, maxAttempts = 3): Promise<void> => {
            try {
              console.log(`[Auth] Attempting to link guest payments (attempt ${attempt}/${maxAttempts})`)

              const response = await fetch('/api/link-guest-payments', {
                method: 'POST',
                credentials: "include",
              })

              if (response.ok) {
                const data = await response.json()

                if (data.linked && data.items?.length > 0) {
                  console.log('[Auth] Guest payment(s) linked successfully:', data.items)

                  // Refresh user data to get updated subscription status
                  const updatedUserData = await fetchUserWithSubscription(session.user)
                  setUser(updatedUserData)

                  console.log('[Auth] Premium subscription activated from guest payment!')
                  return // Success, exit retry loop
                } else {
                  console.log('[Auth] No guest payments to link')
                  return // No payments to link, exit
                }
              }

              // If response not ok, check if we should retry
              if (attempt < maxAttempts) {
                const delay = Math.pow(2, attempt) * 1000 // Exponential backoff: 2s, 4s, 8s
                console.warn(`[Auth] Link guest payments failed (status ${response.status}), retrying in ${delay}ms...`)
                await new Promise(resolve => setTimeout(resolve, delay))
                return linkGuestPayments(attempt + 1, maxAttempts)
              } else {
                console.error('[Auth] Failed to link guest payments after', maxAttempts, 'attempts')
              }
            } catch (error) {
              console.error(`[Auth] Error linking guest payments (attempt ${attempt}/${maxAttempts}):`, error)

              // Retry on network errors
              if (attempt < maxAttempts) {
                const delay = Math.pow(2, attempt) * 1000
                console.warn(`[Auth] Retrying in ${delay}ms...`)
                await new Promise(resolve => setTimeout(resolve, delay))
                return linkGuestPayments(attempt + 1, maxAttempts)
              }

              // Don't block login if linking fails after all retries
              console.error('[Auth] Failed to link guest payments after all retries, continuing with login')
            }
          }

          // Start linking process (non-blocking)
          void linkGuestPayments()
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => {
      if (authListener.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [])

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true)

      // Registrar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || '',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // Track signup event
      if (data.user) {
        sendGTMEvent('sign_up', {
          method: 'email',
          user_id: data.user.id,
        })

        // NOTE: Profile is now created automatically via database trigger (on_auth_user_created)
        // No need to manually insert into users/profiles table
        console.log('[Auth] User profile will be created automatically via trigger', { userId: data.user.id })
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    // Verificar se já há uma tentativa em andamento
    if (signInInProgressRef.current) {
      return { error: new Error('Uma tentativa de login já está em andamento. Aguarde um instante e tente novamente.') }
    }

    // Verificar cooldown (3 segundos entre tentativas para evitar rate limit)
    const now = Date.now()
    const lastAttempt = lastSignInAttemptRef.current
    const cooldownMs = 3000 // 3 segundos

    if (lastAttempt && (now - lastAttempt) < cooldownMs) {
      const remainingMs = cooldownMs - (now - lastAttempt)
      const remainingSeconds = Math.ceil(remainingMs / 1000)
      return {
        error: new Error(`Por favor, aguarde ${remainingSeconds} segundo(s) antes de tentar novamente.`)
      }
    }

    signInInProgressRef.current = true
    lastSignInAttemptRef.current = now

    try {
      setLoading(true)

      // Fazer apenas UMA tentativa (sem retry automático para evitar rate limit)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Mensagem específica para rate limit
        if (error.message === 'Request rate limit reached') {
          throw new Error('Você fez muitas tentativas de login em sequência. Por favor, aguarde alguns minutos e tente novamente.')
        }

        // Mensagem específica para credenciais inválidas
        if (error.message === 'Invalid login credentials') {
          throw new Error('Email ou senha incorretos. Verifique suas credenciais e tente novamente.')
        }

        throw error
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    } finally {
      signInInProgressRef.current = false
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      })

      if (error) {
        console.error('[Auth] Google sign-in error:', error)
        throw error
      }

      console.log('[Auth] Google sign-in initiated', {
        url: data.url,
        provider: data.provider,
      })

      // Track Google sign-in initiation
      sendGTMEvent('login_initiated', {
        method: 'google',
      })

      return { error: null }
    } catch (error) {
      console.error('[Auth] signInWithGoogle failed:', error)
      setLoading(false)
      return { error: error as Error }
    } finally {
      // Note: Don't set loading to false if redirect is successful
      // The page will redirect before this runs
    }
  }

  const signOut = async () => {
    setLoading(true)

    console.log('[Auth] Signing out user...')

    // Track logout before clearing session
    sendGTMEvent('logout', {
      method: 'manual',
      user_id: user?.id,
    })

    // ✅ Call server-side logout FIRST to clear cookies properly
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies in request
      })

      if (!response.ok) {
        console.warn('[Auth] Server logout returned non-OK status:', response.status)
      }

      console.log('[Auth] Server-side logout completed')
    } catch (error) {
      console.error('[Auth] Error during server-side logout:', error)
      // Continue with client-side cleanup anyway
    }

    // Clear client-side state
    try {
      // This may fail if session doesn't exist, which is fine
      await supabase.auth.signOut({ scope: 'local' })
    } catch (error) {
      console.warn('[Auth] Client signOut error (ignoring):', error)
    }

    // Always clear local state regardless of API result
    setUser(null)
    setSession(null)
    setLoading(false)

    console.log('[Auth] Logout complete, redirecting to home...')

    // ✅ Redirect to home page after logout
    window.location.href = '/'
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('users')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      // Atualizar estado local
      setUser({ ...user, ...data, updated_at: new Date().toISOString() })
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
