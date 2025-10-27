'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/supabase"
import { createClient } from "@/lib/supabase/client"

interface UserContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: string | null
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: Profile | null; error: string | null }>
  uploadAvatar: (file: File) => Promise<{ data: string | null; error: string | null }>
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
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const initialUserProvided = initialUser !== null
  const [loading, setLoading] = useState(!initialUserProvided)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError) {
        console.error("Erro ao buscar perfil:", profileError)
        setError(profileError.message)
        return null
      }

      setProfile(data)
      setError(null)

      // Armazenar plan-type no localStorage para scripts acessarem (ex: AdSense)
      if (typeof window !== 'undefined' && data?.plan_type) {
        localStorage.setItem('user-plan-type', data.plan_type)
      }

      return data
    },
    [supabase]
  )

  useEffect(() => {
    let isMounted = true

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

        setUser(currentUser)

        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setProfile(null)
        }
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
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return

      const nextUser = session?.user ?? null
      setUser(nextUser)

      if (nextUser) {
        await fetchProfile(nextUser.id)
      } else {
        setProfile(null)
        // Limpar plan-type ao fazer logout
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-plan-type')
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, initialUserProvided, supabase])

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
    [supabase, user]
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
    [supabase, user]
  )

  const signOut = useCallback(async () => {
    setUser(null)
    setProfile(null)

    // Limpar plan-type do localStorage ao fazer logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user-plan-type')
    }

    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      setError(signOutError.message)

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (currentUser) {
        setUser(currentUser)
        await fetchProfile(currentUser.id)
      } else {
        setProfile(null)
      }
    } else {
      setError(null)
    }

    return { error: signOutError }
  }, [fetchProfile, supabase])

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      profile,
      loading,
      error,
      updateProfile,
      uploadAvatar,
      signOut,
      isAuthenticated: !!user,
      isPro: profile?.plan_type === "pro" || profile?.plan_type === "admin",
      isAdmin: profile?.plan_type === "admin",
      isFree: profile?.plan_type === "free",
    }),
    [error, loading, profile, signOut, updateProfile, uploadAvatar, user]
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
