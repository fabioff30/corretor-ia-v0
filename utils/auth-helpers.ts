// @ts-nocheck
/**
 * Helpers de autenticação e verificação de permissões
 */

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types/supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthContext {
  user: User | null
  profile: Profile | null
}

export async function getCurrentUserWithProfile(): Promise<AuthContext> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // ✅ Use ONLY getUser() - it revalidates with Supabase server
  // Never use getSession() in server-side code for security
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    const cookieSnapshot = 'getAll' in cookieStore
      ? cookieStore
          .getAll()
          .map((cookie) => ({ name: cookie.name, value: cookie.value }))
      : []

    // Only log warning if there were Supabase auth cookies but session still failed
    // This indicates a real problem (expired/invalid session) vs just an anonymous visitor
    const hasSupabaseCookies = cookieSnapshot.some(c => c.name.startsWith('sb-'))
    if (hasSupabaseCookies) {
      console.warn('[Auth] Session invalid despite having auth cookies', {
        getUserError: error?.message ?? null,
        supabaseCookies: cookieSnapshot.filter(c => c.name.startsWith('sb-')).map(c => c.name),
      })
    }
    // If no sb-* cookies, user is just an anonymous visitor - no need to log

    return {
      user: null,
      profile: null,
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return {
      user,
      profile: null,
    }
  }

  return {
    user,
    profile: profile ?? null,
  }
}

/**
 * Busca o usuário autenticado atual
 */
export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Busca o perfil do usuário autenticado
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) return null

  return profile
}

/**
 * Require autenticação - redireciona para login se não autenticado
 */
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

/**
 * Require perfil - redireciona para login se não autenticado
 */
export async function requireProfile() {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/login')
  }

  return profile
}

/**
 * Require acesso admin - redireciona se não for admin
 */
export async function requireAdmin() {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/login')
  }

  if (profile.plan_type !== 'admin') {
    redirect('/dashboard')
  }

  return profile
}

/**
 * Verifica se o usuário tem permissão de admin
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile()
  return profile?.plan_type === 'admin' ?? false
}

/**
 * Verifica se o usuário tem plano Pro
 */
export async function isPro(): Promise<boolean> {
  const profile = await getCurrentProfile()
  if (!profile) return false
  return profile.plan_type === 'pro' || profile.plan_type === 'admin'
}

/**
 * Verifica se o usuário tem plano Free
 */
export async function isFree(): Promise<boolean> {
  const profile = await getCurrentProfile()
  return profile?.plan_type === 'free' ?? false
}

/**
 * Verifica se o usuário tem acesso premium (Pro ou Admin)
 */
export async function hasPremiumAccess(): Promise<boolean> {
  const profile = await getCurrentProfile()
  if (!profile) return false

  return profile.plan_type === 'pro' || profile.plan_type === 'admin'
}
// @ts-nocheck
