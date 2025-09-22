"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase, User, UserWithSubscription } from '@/lib/supabase'
import { AdminAuth, AdminUser } from '@/lib/supabase-admin'
import { z } from 'zod'

// Tipos de usuário
export type UserType = 'user' | 'admin' | null

// Tipos para o contexto
export interface AuthUser extends UserWithSubscription {
  userType: 'user'
}

export interface AuthAdmin extends AdminUser {
  userType: 'admin'
}

export type AuthenticatedUser = AuthUser | AuthAdmin | null

// Schema de validação para formulários
export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  name: z.string().min(1, 'Nome é obrigatório'),
})

export type LoginData = z.infer<typeof LoginSchema>
export type RegisterData = z.infer<typeof RegisterSchema>

// Interface do contexto
interface UnifiedAuthContextType {
  // Estado
  user: AuthenticatedUser
  session: Session | null
  loading: boolean
  userType: UserType
  
  // Métodos para usuários normais
  signUp: (data: RegisterData) => Promise<{ error: Error | null }>
  signInUser: (data: LoginData) => Promise<{ error: Error | null }>
  signInWithProvider: (provider: 'google' | 'github') => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updateUserProfile: (data: Partial<User>) => Promise<{ error: Error | null }>
  refreshUser: () => Promise<void>
  
  // Métodos para administradores
  signInAdmin: (data: LoginData) => Promise<{ error: Error | null }>
  
  // Métodos comuns
  signOut: () => Promise<void>
  
  // Verificações de permissão
  isAdmin: () => boolean
  isUser: () => boolean
  isAuthenticated: () => boolean
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined)

export function UnifiedAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<UserType>(null)

  // Helper para buscar dados completos do usuário normal
  const fetchUserWithSubscription = useCallback(async (supabaseUser: SupabaseUser): Promise<UserWithSubscription | null> => {
    try {
      const loginMethod = supabaseUser.app_metadata?.provider || 'email'
      const isOAuthLogin = loginMethod !== 'email'

      console.log('🔍 [AUTH DEBUG] Fetching user data for:', {
        userId: supabaseUser.id,
        email: supabaseUser.email,
        loginMethod,
        isOAuthLogin,
        appMetadata: supabaseUser.app_metadata,
        userMetadata: supabaseUser.user_metadata
      })

      const { data, error } = await supabase
        .rpc('get_user_with_subscription', { user_uuid: supabaseUser.id })

      console.log('📋 [AUTH DEBUG] RPC response for', loginMethod, ':', { data, error })

      if (error) {
        console.error('❌ [AUTH DEBUG] RPC error for', loginMethod, ':', error)
        throw error
      }

      // Handle the response structure - RPC can return different formats
      let userData = data

      console.log('📋 [AUTH DEBUG] Raw RPC response structure:', {
        isArray: Array.isArray(data),
        dataType: typeof data,
        dataLength: Array.isArray(data) ? data.length : 'not array',
        firstItem: Array.isArray(data) && data.length > 0 ? data[0] : 'no first item',
        hasWrappedProperty: Array.isArray(data) && data.length > 0 && data[0]?.get_user_with_subscription ? 'yes' : 'no'
      })

      // Handle different response formats from Supabase RPC
      if (Array.isArray(data) && data.length > 0) {
        if (data[0]?.get_user_with_subscription) {
          userData = data[0].get_user_with_subscription
          console.log('📋 [AUTH DEBUG] Extracted from wrapped array structure:', userData)
        } else if (typeof data[0] === 'object' && data[0] !== null) {
          // Direct object in array (older format)
          userData = data[0]
          console.log('📋 [AUTH DEBUG] Extracted direct object from array:', userData)
        }
      } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        // Direct object response (newer format with SECURITY DEFINER)
        userData = data
        console.log('📋 [AUTH DEBUG] Using direct object response:', userData)
      }

      // Se o usuário não existe no banco, criar automaticamente
      if (!userData) {
        console.log('⚠️ [AUTH DEBUG] No user data returned for', loginMethod, ', creating new user')

        // Para OAuth, verificar se já existe um usuário com o mesmo email
        if (isOAuthLogin && supabaseUser.email) {
          console.log('🔍 [AUTH DEBUG] OAuth user not found, checking for existing user with same email:', supabaseUser.email)

          try {
            const { data: existingUser } = await supabase
              .from('users')
              .select('id, email, name')
              .eq('email', supabaseUser.email)
              .single()

            if (existingUser) {
              console.log('⚠️ [AUTH DEBUG] Found existing user with same email but different UUID:', {
                oauthUserId: supabaseUser.id,
                existingUserId: existingUser.id,
                email: supabaseUser.email
              })
            }
          } catch (err) {
            console.log('ℹ️ [AUTH DEBUG] No existing user found with email:', supabaseUser.email)
          }
        }

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
        const fallbackData = {
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

        console.log('🆕 [AUTH DEBUG] Returning fallback user data:', fallbackData)
        return fallbackData
      }

      // Return the properly extracted user data
      console.log('✅ [AUTH DEBUG] Returning user data from RPC:', userData)
      console.log('✅ [AUTH DEBUG] Subscription details:', {
        hasSubscription: !!userData?.subscription,
        plan: userData?.subscription?.plan,
        status: userData?.subscription?.status,
        id: userData?.subscription?.id,
        current_period_end: userData?.subscription?.current_period_end
      })
      return userData as UserWithSubscription
    } catch (error) {
      console.error('💥 [AUTH DEBUG] Error in fetchUserWithSubscription:', error)
      return null
    }
  }, [])

  // Função para atualizar dados do usuário normal
  const refreshUser = useCallback(async () => {
    try {
      console.log('🔄 [AUTH DEBUG] refreshUser called, userType:', userType)

      if (userType === 'user') {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('🔄 [AUTH DEBUG] refreshUser - fetching updated data for:', session.user.email)

          const userData = await fetchUserWithSubscription(session.user)
          if (userData) {
            console.log('🔄 [AUTH DEBUG] refreshUser - updating user data:', {
              userId: userData.id,
              email: userData.email,
              subscriptionPlan: userData.subscription?.plan,
              subscriptionStatus: userData.subscription?.status
            })
            setUser({ ...userData, userType: 'user' } as AuthUser)
          } else {
            console.error('❌ [AUTH DEBUG] refreshUser - failed to get updated user data')
          }
        } else {
          console.log('⚠️ [AUTH DEBUG] refreshUser - no session found')
        }
      } else {
        console.log('⚠️ [AUTH DEBUG] refreshUser - userType is not "user":', userType)
      }
    } catch (error) {
      console.error('💥 [AUTH DEBUG] Error in refreshUser:', error)
    }
  }, [userType, fetchUserWithSubscription])

  // Listener para invalidação de cache de subscription
  useEffect(() => {
    const handleSubscriptionUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent
      const { userEmail, userId } = customEvent.detail

      // Verificar se é o usuário atual
      if (user?.userType === 'user' && (user.email === userEmail || user.id === userId)) {
        console.log('🔄 Subscription atualizada para usuário atual, atualizando cache...')
        await refreshUser()
      }
    }

    const handleStorageChange = async () => {
      const invalidationData = localStorage.getItem('subscriptionCacheInvalidation')
      if (invalidationData && user?.userType === 'user') {
        try {
          const { userEmail, userId, timestamp } = JSON.parse(invalidationData)

          // Verificar se é para o usuário atual e é recente (últimos 5 minutos)
          const isRecent = Date.now() - new Date(timestamp).getTime() < 5 * 60 * 1000
          const isCurrentUser = user.email === userEmail || user.id === userId

          if (isCurrentUser && isRecent) {
            console.log('🔄 Cache invalidation detectada, atualizando dados do usuário...')
            await refreshUser()

            // Limpar flag após processar
            localStorage.removeItem('subscriptionCacheInvalidation')
          }
        } catch (error) {
          console.error('Erro ao processar invalidação de cache:', error)
        }
      }
    }

    // Escutar eventos personalizados
    window.addEventListener('subscriptionUpdated', handleSubscriptionUpdate)

    // Verificar localStorage periodicamente
    const interval = setInterval(handleStorageChange, 2000)

    return () => {
      window.removeEventListener('subscriptionUpdated', handleSubscriptionUpdate)
      clearInterval(interval)
    }
  }, [user, refreshUser])

  // Inicialização da autenticação
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Verificar se há uma sessão Supabase ativa
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erro ao obter sessão:', error)
        }

        if (session?.user) {
          // Usuário normal autenticado
          console.log('🔐 [AUTH DEBUG] Setting user session and type for:', session.user.email)
          setSession(session)
          setUserType('user')

          const userData = await fetchUserWithSubscription(session.user)
          if (userData) {
            console.log('👤 [AUTH DEBUG] Setting user data in context:', {
              userId: userData.id,
              email: userData.email,
              subscriptionPlan: userData.subscription?.plan,
              subscriptionStatus: userData.subscription?.status
            })
            setUser({ ...userData, userType: 'user' } as AuthUser)
          } else {
            console.error('❌ [AUTH DEBUG] Failed to get user data from fetchUserWithSubscription')
          }
        } else {
          // Verificar se há admin no localStorage (temporário para migração)
          const adminAuth = localStorage.getItem('adminAuth')
          const adminData = localStorage.getItem('adminData')
          
          if (adminAuth === 'true' && adminData) {
            try {
              const admin = JSON.parse(adminData) as AdminUser
              setUserType('admin')
              setUser({ ...admin, userType: 'admin' } as AuthAdmin)
            } catch (error) {
              console.error('Erro ao carregar dados do admin:', error)
              localStorage.removeItem('adminAuth')
              localStorage.removeItem('adminData')
            }
          }
        }
      } catch (error) {
        console.error('Erro na inicialização da autenticação:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Escutar mudanças de autenticação do Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [AUTH DEBUG] Auth state changed:', {
        event,
        email: session?.user?.email,
        provider: session?.user?.app_metadata?.provider,
        providers: session?.user?.app_metadata?.providers,
        userMetadata: session?.user?.user_metadata,
        isOAuth: !!session?.user?.app_metadata?.provider && session?.user?.app_metadata?.provider !== 'email'
      })

      setLoading(true)

      if (session?.user) {
        // Identificar tipo de login
        const loginMethod = session.user.app_metadata?.provider || 'email'
        const isOAuthLogin = loginMethod !== 'email'

        console.log('🔐 [AUTH DEBUG] User login detected:', {
          email: session.user.email,
          loginMethod,
          isOAuthLogin,
          userId: session.user.id,
          metadata: session.user.user_metadata
        })

        setSession(session)
        setUserType('user')

        const userData = await fetchUserWithSubscription(session.user)
        if (userData) {
          console.log('👤 [AUTH DEBUG] Setting user data via', loginMethod, ':', {
            userId: userData.id,
            email: userData.email,
            subscriptionPlan: userData.subscription?.plan,
            subscriptionStatus: userData.subscription?.status,
            loginMethod
          })
          setUser({ ...userData, userType: 'user' } as AuthUser)
        } else {
          console.error('❌ [AUTH DEBUG] Failed to get user data for', loginMethod, 'login')
        }
      } else if (event === 'SIGNED_OUT') {
        // Usuário fez logout
        setSession(null)
        setUser(null)
        setUserType(null)
        
        // Limpar dados de admin se existirem
        localStorage.removeItem('adminAuth')
        localStorage.removeItem('adminData')
      }

      setLoading(false)
    })

    return () => {
      if (authListener.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [fetchUserWithSubscription])

  // Métodos de autenticação para usuários normais
  const signUp = async (data: RegisterData) => {
    try {
      setLoading(true)
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      })

      if (error) throw error

      // Se o usuário foi criado, também criar entrada na tabela users
      if (authData.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email!,
              name: data.name,
            },
          ])

        if (insertError && insertError.code !== '23505') {
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

  const signInUser = async (data: LoginData) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    } finally {
      setLoading(false)
    }
  }

  const signInWithProvider = async (provider: 'google' | 'github') => {
    try {
      setLoading(true)
      
      const options: any = {
        redirectTo: `${window.location.origin}/auth/callback`
      }

      // Adicionar scopes explícitos para Google para resolver problemas com ambientes corporativos
      if (provider === 'google') {
        options.scopes = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
      }

      console.log('🔍 Tentando login com:', { provider, options })

      const { error, data } = await supabase.auth.signInWithOAuth({
        provider,
        options
      })

      console.log('📋 Resposta do OAuth:', { error, data })

      if (error) {
        console.error('❌ Erro no OAuth:', error)
        throw error
      }
      
      return { error: null }
    } catch (error) {
      console.error('💥 Erro capturado:', error)
      return { error: error as Error }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const updateUserProfile = async (data: Partial<User>) => {
    try {
      if (!user || user.userType !== 'user') {
        throw new Error('Usuário não autenticado')
      }

      const { error } = await supabase
        .from('users')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      // Atualizar estado local
      setUser(prev => prev ? { ...prev, ...data, updated_at: new Date().toISOString() } : null)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Métodos de autenticação para administradores
  const signInAdmin = async (data: LoginData) => {
    try {
      setLoading(true)
      
      const result = await AdminAuth.validateLogin(data.email, data.password)
      
      if (!result.success || !result.admin) {
        throw new Error(result.error || 'Credenciais inválidas')
      }

      // Atualizar último login
      await AdminAuth.updateLastLogin(result.admin.id)

      // Definir estado de admin
      setUserType('admin')
      setUser({ ...result.admin, userType: 'admin' } as AuthAdmin)
      
      // Salvar no localStorage (será removido quando implementarmos sessões do servidor)
      localStorage.setItem('adminAuth', 'true')
      localStorage.setItem('adminData', JSON.stringify(result.admin))

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    } finally {
      setLoading(false)
    }
  }

  // Métodos comuns
  const signOut = async () => {
    setLoading(true)
    
    try {
      if (userType === 'user') {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('Erro ao fazer logout do usuário:', error)
        }
      } else if (userType === 'admin') {
        // Logout de admin
        localStorage.removeItem('adminAuth')
        localStorage.removeItem('adminData')
      }
    } catch (error) {
      console.error('Erro no logout:', error)
    } finally {
      setUser(null)
      setSession(null)
      setUserType(null)
      setLoading(false)
    }
  }

  // Verificações de permissão
  const isAdmin = () => user?.userType === 'admin'
  const isUser = () => user?.userType === 'user'
  const isAuthenticated = () => user !== null

  // Debug helper function - can be called from browser console via window.debugAuth()
  const debugAuth = useCallback(async () => {
    console.log('🔍 [AUTH DEBUG] Current auth state:')
    console.log('User:', user)
    console.log('Session:', session)
    console.log('UserType:', userType)
    console.log('Loading:', loading)

    if (session?.user) {
      console.log('🔍 [AUTH DEBUG] Testing RPC call directly...')
      try {
        const { data, error } = await supabase
          .rpc('get_user_with_subscription', { user_uuid: session.user.id })

        console.log('📋 [AUTH DEBUG] Direct RPC result:', { data, error })

        if (data) {
          console.log('✅ [AUTH DEBUG] RPC subscription data:', {
            plan: data.subscription?.plan,
            status: data.subscription?.status,
            id: data.subscription?.id
          })
        }
      } catch (err) {
        console.error('❌ [AUTH DEBUG] Direct RPC error:', err)
      }
    }
  }, [user, session, userType, loading])

  // Expose debug function globally for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugAuth = debugAuth
      (window as any).refreshAuth = refreshUser
    }
  }, [debugAuth, refreshUser])

  const value: UnifiedAuthContextType = {
    // Estado
    user,
    session,
    loading,
    userType,
    
    // Métodos para usuários normais
    signUp,
    signInUser,
    signInWithProvider,
    resetPassword,
    updateUserProfile,
    refreshUser,
    
    // Métodos para administradores
    signInAdmin,
    
    // Métodos comuns
    signOut,
    
    // Verificações de permissão
    isAdmin,
    isUser,
    isAuthenticated,
  }

  return <UnifiedAuthContext.Provider value={value}>{children}</UnifiedAuthContext.Provider>
}

export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext)
  if (context === undefined) {
    throw new Error('useUnifiedAuth deve ser usado dentro de um UnifiedAuthProvider')
  }
  return context
}

// Hook para compatibilidade com o código existente
export const useAuth = () => {
  const context = useUnifiedAuth()
  
  return {
    user: context.user?.userType === 'user' ? context.user : null,
    session: context.session,
    loading: context.loading,
    signUp: context.signUp,
    signIn: context.signInUser,
    signInWithProvider: context.signInWithProvider,
    signOut: context.signOut,
    updateProfile: context.updateUserProfile,
    refreshUser: context.refreshUser,
  }
}