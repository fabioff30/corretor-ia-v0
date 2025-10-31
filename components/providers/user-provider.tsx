'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/supabase"
import { supabase } from "@/lib/supabase/client"
import { checkAndCleanup, monitorAuthErrors, RefreshLoopDetector } from "@/utils/auth-cleanup"

// Monitor de refresh loops - apenas registra, não tenta corrigir
// (A correção é feita pelo RefreshLoopDetector em auth-cleanup.ts)
let refreshFailureCount = 0
let lastRefreshFailure = 0
const MAX_REFRESH_FAILURES = 3
const FAILURE_WINDOW_MS = 10000 // 10 segundos

function handleRefreshFailure() {
  const now = Date.now()

  // Reset contador se passou tempo suficiente
  if (now - lastRefreshFailure > FAILURE_WINDOW_MS) {
    refreshFailureCount = 0
  }

  refreshFailureCount++
  lastRefreshFailure = now

  // Apenas registrar no detector global - ele fará a limpeza se necessário
  // NÃO chamamos signOut() aqui pois isso dispara eventos que causam mais loops
  RefreshLoopDetector.recordRefresh()

  if (refreshFailureCount >= MAX_REFRESH_FAILURES) {
    console.error('[UserProvider] Too many refresh failures detected, RefreshLoopDetector will handle cleanup')
    refreshFailureCount = 0
  }
}

interface UserContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: Profile | null; error: string | null }>
  uploadAvatar: (file: File) => Promise<{ data: string | null; error: string | null }>
  refreshProfile: () => Promise<{ data: Profile | null; error: string | null }>
  signOut: () => Promise<{ error: Error | null }>
  isAuthenticated: boolean
  isPro: boolean
  isAdmin: boolean
  isFree: boolean
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
  initialUser?: User | null
  initialProfile?: Profile | null
}

export function UserProvider({ children, initialUser = null, initialProfile = null }: UserProviderProps) {
  // Use singleton Supabase client to prevent multiple refresh token attempts
  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const initialUserProvided = initialUser !== null
  const [loading, setLoading] = useState(!initialUserProvided)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle()

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Erro ao buscar perfil:", profileError)
          setError(profileError.message)
          return null
        }

        const profileData = data

        if (!profileData) {
          const response = await fetch("/api/profiles/sync", {
            method: "POST",
            cache: "no-store",
          })

          if (!response.ok) {
            const payload = await response.json().catch(() => null)
            const message = payload?.error || "Não foi possível criar o perfil"
            setError(message)
            return null
          }

          const payload = (await response.json()) as { profile: Profile }
          const createdProfile = payload.profile
          setProfile(createdProfile)
          setError(null)

          if (typeof window !== "undefined") {
            localStorage.setItem(
              "user-plan-type",
              createdProfile?.plan_type ?? "free"
            )
          }

          return createdProfile
        }

        setProfile(profileData)
        setError(null)

        if (typeof window !== "undefined") {
          localStorage.setItem("user-plan-type", profileData.plan_type ?? "free")
        }

        return profileData
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao buscar perfil"
        console.error("Erro ao buscar perfil:", err)
        setError(message)
        return null
      }
    },
    [] // supabase is now a singleton, no dependencies needed
  )

  useEffect(() => {
    let isMounted = true

    // Executar limpeza automática e monitoramento na primeira carga
    checkAndCleanup().catch(err => {
      console.error('[UserProvider] Erro na limpeza automática:', err)
    })
    monitorAuthErrors()

    const fetchUser = async () => {
      try {
        if (!initialUserProvided) {
          setLoading(true)
        }
        setError(null)

        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser()

        if (!isMounted) return

        if (userError && userError.message !== "Auth session missing!") {
          throw userError
        }

        // Quando não há sessão, garantir que estado reflete usuário anônimo
        if (!currentUser) {
          setUser(null)
          setProfile(null)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user-plan-type')
          }
          return
        }

        setUser(currentUser)
        await fetchProfile(currentUser.id)
      } catch (err) {
        if (err instanceof Error && err.message !== "Auth session missing!") {
          console.error("Erro ao buscar usuário:", err)
          setError(err.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      // Detectar falhas de refresh
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('[UserProvider] Token refresh failed, session is null')
        handleRefreshFailure()
        return
      }

      // Reset contador em caso de sucesso
      if (event === 'TOKEN_REFRESHED' && session) {
        refreshFailureCount = 0
      }

      if (event === 'SIGNED_IN' && session) {
        refreshFailureCount = 0
      }

      const nextUser = session?.user ?? null
      setUser(nextUser)

      if (nextUser) {
        await fetchProfile(nextUser.id)
      } else {
        setProfile(null)
        // Limpar plan-type ao fazer logout ou sessão ausente
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-plan-type')
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, initialUserProvided]) // supabase is singleton, no dependency needed

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) return { data: null, error: "Usuário não autenticado" }

      try {
        setError(null)

        // Para atualizações simples de nome, usar API dedicada (otimizada)
        if ('full_name' in updates && Object.keys(updates).length === 1) {
          const response = await fetch('/api/dashboard/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: "include",
            body: JSON.stringify({ full_name: updates.full_name }),
          })

          if (!response.ok) {
            const payload = await response.json().catch(() => null)
            const message = payload?.error || 'Erro ao atualizar perfil'
            setError(message)
            return { data: null, error: message }
          }

          const payload = await response.json()
          const updatedProfile = payload.profile as Profile
          setProfile(updatedProfile)
          return { data: updatedProfile, error: null }
        }

        const { data, error: updateError } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id)
          .select()
          .single()

        if (updateError) throw updateError

        setProfile(data)
        return { data, error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao atualizar perfil"
        setError(message)
        return { data: null, error: message }
      }
    },
    [user] // supabase is singleton
  )

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user) return { data: null, error: "Usuário não autenticado" }

      try {
        setError(null)

        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}/avatar.${fileExt}`

        const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, {
          upsert: true,
        })

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(fileName)

        const { data, error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", user.id)
          .select()
          .single()

        if (updateError) throw updateError

        setProfile(data)
        return { data: publicUrl, error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao fazer upload do avatar"
        setError(message)
        return { data: null, error: message }
      }
    },
    [user] // supabase is singleton
  )

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return { error: signInError }
      }

      return { error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login'
      setError(message)
      return { error: error as Error }
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null)
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (signInError) {
        setError(signInError.message)
        return { error: signInError }
      }

      return { error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login com Google'
      setError(message)
      return { error: error as Error }
    }
  }, [])

  const signOut = useCallback(async () => {
    console.log('[UserProvider] Starting logout...')

    // Clear local state first
    setUser(null)
    setProfile(null)

    // Limpar plan-type do localStorage ao fazer logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user-plan-type')
    }

    // Call server-side logout FIRST to clear cookies
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        console.warn('[UserProvider] Server logout returned non-OK status:', response.status)
      } else {
        console.log('[UserProvider] Server-side logout completed')
      }
    } catch (error) {
      console.warn('[UserProvider] Error during server-side logout:', error)
      // Continue with client-side cleanup anyway
    }

    // Clear client-side session (local only to avoid triggering server calls)
    try {
      await supabase.auth.signOut({ scope: 'local' })
      console.log('[UserProvider] Client-side logout completed')
    } catch (error) {
      console.warn('[UserProvider] Client signOut error (ignoring):', error)
    }

    setError(null)
    return { error: null }
  }, []) // supabase is singleton

  const refreshProfile = useCallback(async () => {
    if (!user) {
      return { data: null, error: "Usuário não autenticado" }
    }

    try {
      console.log('[UserProvider] Refreshing profile from database...')
      setError(null)

      const refreshedProfile = await fetchProfile(user.id)

      if (!refreshedProfile) {
        return { data: null, error: "Erro ao atualizar perfil" }
      }

      console.log('[UserProvider] Profile refreshed successfully:', {
        planType: refreshedProfile.plan_type,
        subscriptionStatus: refreshedProfile.subscription_status,
      })

      return { data: refreshedProfile, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar perfil"
      console.error('[UserProvider] Error refreshing profile:', err)
      setError(message)
      return { data: null, error: message }
    }
  }, [user, fetchProfile])

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      profile,
      loading,
      error,
      signIn,
      signInWithGoogle,
      updateProfile,
      uploadAvatar,
      refreshProfile,
      signOut,
      isAuthenticated: !!user,
      isPro: profile?.plan_type === "pro" || profile?.plan_type === "admin",
      isAdmin: profile?.plan_type === "admin",
      isFree: profile?.plan_type === "free",
    }),
    [error, loading, profile, refreshProfile, signIn, signInWithGoogle, signOut, updateProfile, uploadAvatar, user]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUserContext() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUserContext deve ser utilizado dentro de UserProvider")
  }
  return context
}

// Alias para compatibilidade com código existente
export const useUser = useUserContext
