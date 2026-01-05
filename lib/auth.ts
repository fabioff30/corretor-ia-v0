// @ts-nocheck
/**
 * Server-side Authentication System
 * Secure replacement for client-side admin authentication
 */

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
// Configuration
function getJwtSecret(): Uint8Array {
  const key = process.env.AUTH_TOKEN || 'fallback-key-for-development-only'
  return new TextEncoder().encode(key)
}
const COOKIE_NAME = 'admin_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export interface AdminUser {
  id: string
  role: 'admin'
  authenticated: boolean
  expiresAt: number
}

/**
 * Create a secure JWT token for admin session
 */
export async function createAdminToken(adminId: string = 'admin'): Promise<string> {
  const payload: AdminUser = {
    id: adminId,
    role: 'admin',
    authenticated: true,
    expiresAt: Date.now() + SESSION_DURATION,
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecret())

  return token
}

/**
 * Verify and decode an admin JWT token
 */
export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    
    const user = payload as AdminUser
    
    // Check if token is expired
    if (user.expiresAt && user.expiresAt < Date.now()) {
      return null
    }
    
    // Verify token structure
    if (user.role !== 'admin' || !user.authenticated) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Set admin session cookie
 */
export async function setAdminSession(adminId: string = 'admin') {
  const token = await createAdminToken(adminId)
  const cookieStore = await cookies()
  
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  })
}

/**
 * Get current admin session
 */
export async function getAdminSession(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(COOKIE_NAME)
    
    if (!sessionCookie?.value) {
      return null
    }
    
    return await verifyAdminToken(sessionCookie.value)
  } catch (error) {
    console.error('Session retrieval failed:', error)
    return null
  }
}

/**
 * Clear admin session
 */
export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/**
 * Validate admin password (server-side only)
 */
export function validateAdminPassword(password: string): boolean {
  // In development, allow NEXT_PUBLIC_ADMIN_PASSWORD (local-only convenience)
  if (process.env.NODE_ENV === 'development') {
    return password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123')
  }
  // In production, prefer ADMIN_PASSWORD
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD
  return !!adminPassword && password === adminPassword
}

/**
 * Middleware helper to check if user is admin
 */
export async function requireAdmin(): Promise<AdminUser> {
  const session = await getAdminSession()
  
  if (!session) {
    throw new Error('Unauthorized: Admin access required')
  }
  
  return session
}
// @ts-nocheck
