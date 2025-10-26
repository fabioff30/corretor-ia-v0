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
          try {
            const response = await fetch('/api/link-guest-payments', {
              method: 'POST',
            })

            if (response.ok) {
              const data = await response.json()

              if (data.linked && data.items?.length > 0) {
                console.log('[Auth] Guest payment(s) linked successfully:', data.items)

                // Refresh user data to get updated subscription status
                const updatedUserData = await fetchUserWithSubscription(session.user)
                setUser(updatedUserData)

                // Optionally show a toast notification (would need to be passed from provider)
                console.log('[Auth] Premium subscription activated from guest payment!')
              }
            }
          } catch (error) {
            console.error('[Auth] Error linking guest payments:', error)
            // Don't block login if linking fails
          }
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
        },
      })

      if (error) throw error

      // Track signup event
      if (data.user) {
        sendGTMEvent('sign_up', {
          method: 'email',
          user_id: data.user.id,
        })

        // Se o usuário foi criado, também criar entrada na tabela users
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email!,
              name: name || '',
            },
          ])

        if (insertError && insertError.code !== '23505') { // 23505 = unique constraint violation
          console.error('Erro ao criar entrada do usuário:', insertError)
        }
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

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Erro ao fazer logout:', error)
    }
    setUser(null)
    setSession(null)
    setLoading(false)
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