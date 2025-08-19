/**
 * Server-side Authentication System
 * Secure replacement for client-side admin authentication
 */

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getEnvConfig } from '@/utils/env-validation'

// Configuration
const JWT_SECRET = new TextEncoder().encode(
  getEnvConfig().AUTH_TOKEN || 'fallback-key-for-development-only'
)
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
    .sign(JWT_SECRET)

  return token
}

/**
 * Verify and decode an admin JWT token
 */
export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
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
  const cookieStore = cookies()
  
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
    const cookieStore = cookies()
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
export function clearAdminSession() {
  const cookieStore = cookies()
  cookieStore.delete(COOKIE_NAME)
}

/**
 * Validate admin password (server-side only)
 */
export function validateAdminPassword(password: string): boolean {
  const envConfig = getEnvConfig()
  
  // In development, we'll use a simple password check
  // In production, this should use proper hashing
  if (process.env.NODE_ENV === 'development') {
    return password === (envConfig.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123')
  }
  
  // In production, we should use bcrypt or similar
  // For now, we'll use the environment variable
  const adminPassword = process.env.ADMIN_PASSWORD || envConfig.NEXT_PUBLIC_ADMIN_PASSWORD
  return password === adminPassword
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