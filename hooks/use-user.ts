/**
 * Hook para gerenciar dados do usuário autenticado
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/supabase'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    // Buscar usuário e perfil inicial
    const fetchUser = async () => {
      try {
        setLoading(true)
        setError(null)

        // Buscar usuário autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        // Ignorar erro se não houver sessão (usuário não está logado)
        if (userError && userError.message !== 'Auth session missing!') {
          throw userError
        }

        setUser(user)

        // Se houver usuário, buscar perfil
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError) {
            console.error('Erro ao buscar perfil:', profileError)
          } else {
            setProfile(profile)
          }
        }
      } catch (err) {
        // Apenas logar erros que não sejam de sessão ausente
        if (err instanceof Error && err.message !== 'Auth session missing!') {
          console.error('Erro ao buscar usuário:', err)
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          // Buscar perfil atualizado
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setProfile(profile)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Função para atualizar perfil
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Usuário não autenticado' }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar perfil'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Função para upload de avatar
  const uploadAvatar = async (file: File) => {
    if (!user) return { error: 'Usuário não autenticado' }

    try {
      setLoading(true)
      setError(null)

      // Upload do arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Buscar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Atualizar perfil com nova URL
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      setProfile(data)
      return { data: publicUrl, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload do avatar'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Função para fazer logout
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
    }
    return { error }
  }

  return {
    user,
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    signOut,
    isAuthenticated: !!user,
    isPro: profile?.plan_type === 'pro',
    isAdmin: profile?.plan_type === 'admin',
    isFree: profile?.plan_type === 'free',
  }
}
