import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { AdminAuth, AdminUser } from '@/lib/supabase-admin'
import { UserWithSubscription } from '@/lib/supabase'

/**
 * Server-side auth helpers para Next.js App Router
 */

/**
 * Obter sessão atual do usuário no servidor (cached)
 */
export const getServerSession = cache(async () => {
  try {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set(name, '', options)
          },
        },
      }
    )
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Erro ao obter sessão do servidor:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Erro no getServerSession:', error)
    return null
  }
})

/**
 * Obter usuário atual no servidor (cached)
 */
export const getServerUser = cache(async (): Promise<UserWithSubscription | null> => {
  try {
    const session = await getServerSession()
    if (!session?.user) return null
    
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set(name, '', options)
          },
        },
      }
    )
    
    const { data, error } = await supabase
      .rpc('get_user_with_subscription', { user_uuid: session.user.id })
    
    if (error) {
      console.error('Erro ao obter usuário do servidor:', error)
      return null
    }
    
    return data as UserWithSubscription
  } catch (error) {
    console.error('Erro no getServerUser:', error)
    return null
  }
})

/**
 * Verificar se o usuário atual é admin (servidor)
 */
export const getServerAdmin = cache(async (): Promise<AdminUser | null> => {
  try {
    // Por enquanto, verificar via cookie/header até implementarmos sessões admin no servidor
    const cookieStore = cookies()
    const adminCookie = cookieStore.get('admin_session')
    
    if (!adminCookie?.value) {
      return null
    }
    
    // Aqui você pode implementar verificação de JWT admin se necessário
    // Por enquanto, retornamos null para forçar uso do contexto client-side
    return null
  } catch (error) {
    console.error('Erro no getServerAdmin:', error)
    return null
  }
})

/**
 * Verificar se usuário está autenticado (servidor)
 */
export const isAuthenticated = cache(async (): Promise<boolean> => {
  const session = await getServerSession()
  return !!session
})

/**
 * Verificar se usuário é admin (servidor)
 */
export const isAdmin = cache(async (): Promise<boolean> => {
  const admin = await getServerAdmin()
  return !!admin
})

/**
 * Redirect helpers para páginas que requerem autenticação
 */
export const requireAuth = async () => {
  const session = await getServerSession()
  if (!session) {
    throw new Error('Authentication required')
  }
  return session
}

export const requireAdmin = async () => {
  const admin = await getServerAdmin()
  if (!admin) {
    throw new Error('Admin access required')
  }
  return admin
}