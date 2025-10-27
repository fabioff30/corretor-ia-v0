"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase, User, UserWithSubscription } from '@/lib/supabase'
import { sendGTMEvent } from '@/utils/gtm-helper'

interface AuthContextType {
  user: UserWithSubscription | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<{ error: Error | null }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithSubscription | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

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
      
      return data as UserWithSubscription
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error)
      return null
    }
  }

  // Função para atualizar dados do usuário
  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const userData = await fetchUserWithSubscription(session.user)
        setUser(userData)
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error)
    }
  }

  useEffect(() => {
    const initSupabaseAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erro ao obter sessão:', error)
        }

        setSession(session)

        if (session?.user) {
          const userData = await fetchUserWithSubscription(session.user)
          setUser(userData)
        }
      } catch (error) {
        console.error('Erro na inicialização da autenticação:', error)
      } finally {
        setLoading(false)
      }
    }

    initSupabaseAuth()

    // Escutar mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
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
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)

    // Track logout before clearing session
    sendGTMEvent('logout', {
      method: 'manual',
      user_id: user?.id,
    })

    try {
      // Try to sign out from Supabase
      const { error } = await supabase.auth.signOut()

      // Ignore "session_not_found" errors - session might already be expired/deleted
      if (error && error.message !== 'Session from session_id claim in JWT does not exist') {
        console.error('Erro ao fazer logout:', error)
      }
    } catch (error) {
      // Ignore any errors - we'll clear local state anyway
      console.warn('Erro ignorado durante logout:', error)
    }

    // Always clear local state regardless of API result
    setUser(null)
    setSession(null)
    setLoading(false)

    // Call server-side logout to ensure cookies are cleared
    try {
      await fetch('/api/logout', { method: 'POST' })
    } catch (error) {
      console.warn('Erro ao limpar cookies do servidor:', error)
    }
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