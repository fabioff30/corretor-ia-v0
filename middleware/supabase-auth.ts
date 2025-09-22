import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { AdminAuth } from '@/lib/supabase-admin'

/**
 * Middleware de autenticação usando Supabase
 * Protege rotas admin e user com verificação de sessão
 */

export async function supabaseAuthMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
  
  const pathname = request.nextUrl.pathname
  
  // Rotas que não precisam de autenticação
  const publicRoutes = [
    '/',
    '/auth',
    '/auth/login',
    '/auth/register',
    '/auth/callback',
    '/auth/reset-password',
    '/api/auth',
    '/admin/login',
    '/api/public',
  ]
  
  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))
  
  if (isPublicRoute) {
    return response
  }
  
  // Verificar rotas admin
  if (pathname.startsWith('/admin')) {
    return await handleAdminRoute(request, response)
  }
  
  // Verificar rotas de usuário que precisam de autenticação
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
    return await handleUserRoute(request, response, supabase)
  }
  
  // Verificar APIs protegidas
  if (pathname.startsWith('/api/admin')) {
    return await handleAdminApiRoute(request, response)
  }
  
  if (pathname.startsWith('/api/user') || pathname.startsWith('/api/protected')) {
    return await handleUserApiRoute(request, response, supabase)
  }
  
  return response
}

/**
 * Lidar com rotas admin
 */
async function handleAdminRoute(request: NextRequest, response: NextResponse) {
  const pathname = request.nextUrl.pathname
  
  // Permitir acesso à página de login admin
  if (pathname === '/admin/login') {
    return response
  }
  
  try {
    // Por enquanto, verificar via cookie até implementarmos sessões admin completas
    const adminAuth = request.cookies.get('admin_session')
    
    if (!adminAuth?.value) {
      // Redirecionar para login admin
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Aqui você pode adicionar verificação adicional de JWT admin se necessário
    
    // Adicionar header para indicar que é um admin autenticado
    response.headers.set('x-user-type', 'admin')
    
    return response
  } catch (error) {
    console.error('Erro no middleware admin:', error)
    
    // Redirecionar para login em caso de erro
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

/**
 * Lidar com rotas de usuário
 */
async function handleUserRoute(request: NextRequest, response: NextResponse, supabase: any) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      // Redirecionar para login
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Adicionar dados da sessão aos headers
    response.headers.set('x-user-id', session.user.id)
    response.headers.set('x-user-email', session.user.email || '')
    response.headers.set('x-user-type', 'user')
    
    return response
  } catch (error) {
    console.error('Erro no middleware de usuário:', error)
    
    // Redirecionar para login em caso de erro
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

/**
 * Lidar com APIs admin
 */
async function handleAdminApiRoute(request: NextRequest, response: NextResponse) {
  try {
    // Verificar autenticação admin via cookie/header
    const adminAuth = request.cookies.get('admin_session')
    const authHeader = request.headers.get('authorization')
    
    if (!adminAuth?.value && !authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }
    
    // Aqui você pode implementar verificação de JWT admin
    
    // Adicionar dados do admin aos headers para uso nas APIs
    response.headers.set('x-user-type', 'admin')
    
    return response
  } catch (error) {
    console.error('Erro no middleware da API admin:', error)
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    )
  }
}

/**
 * Lidar com APIs de usuário
 */
async function handleUserApiRoute(request: NextRequest, response: NextResponse, supabase: any) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return NextResponse.json(
        { error: 'Unauthorized: User authentication required' },
        { status: 401 }
      )
    }
    
    // Adicionar dados da sessão aos headers
    response.headers.set('x-user-id', session.user.id)
    response.headers.set('x-user-email', session.user.email || '')
    response.headers.set('x-user-type', 'user')
    
    return response
  } catch (error) {
    console.error('Erro no middleware da API de usuário:', error)
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    )
  }
}

/**
 * Helper para APIs protegidas
 */
export async function withAuth<T>(
  handler: (request: NextRequest, session: any) => Promise<T>
) {
  return async (request: NextRequest) => {
    try {
      const response = NextResponse.next()
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value,
                ...options,
              })
              response.cookies.set({
                name,
                value,
                ...options,
              })
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value: '',
                ...options,
              })
              response.cookies.set({
                name,
                value: '',
                ...options,
              })
            },
          },
        }
      )
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      
      return await handler(request, session)
    } catch (error) {
      console.error('Erro no withAuth:', error)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper para APIs admin protegidas
 */
export async function withAdminAuth<T>(
  handler: (request: NextRequest, admin: any) => Promise<T>
) {
  return async (request: NextRequest) => {
    try {
      // Por enquanto, verificação simples via cookie
      const adminAuth = request.cookies.get('admin_session')
      
      if (!adminAuth?.value) {
        return NextResponse.json(
          { error: 'Unauthorized: Admin access required' },
          { status: 401 }
        )
      }
      
      // Aqui você pode implementar verificação completa de admin
      const admin = { id: 'admin', role: 'admin' } // Placeholder
      
      return await handler(request, admin)
    } catch (error) {
      console.error('Erro no withAdminAuth:', error)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Rate limiting baseado em usuário
 */
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>()
  
  return (request: NextRequest): boolean => {
    const userKey = request.headers.get('x-user-id') || request.ip || 'anonymous'
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Limpar entradas antigas
    for (const [key, data] of requests.entries()) {
      if (data.resetTime < windowStart) {
        requests.delete(key)
      }
    }
    
    const userData = requests.get(userKey)
    
    if (!userData) {
      requests.set(userKey, { count: 1, resetTime: now + windowMs })
      return true
    }
    
    if (userData.resetTime < now) {
      // Reset da janela
      userData.count = 1
      userData.resetTime = now + windowMs
      return true
    }
    
    if (userData.count >= maxRequests) {
      return false
    }
    
    userData.count++
    return true
  }
}