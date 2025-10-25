"use client"

import { useState, useEffect } from "react"

interface AdminUser {
  id: string
  role: 'admin'
  authenticated: boolean
  expiresAt: number
}

export function useSecureAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [user, setUser] = useState<AdminUser | null>(null)

  // Check current session status
  const checkSession = async () => {
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'GET',
        credentials: 'include',
      })
      
      const data = await response.json()
      
      setIsAuthenticated(data.authenticated)
      setUser(data.user)
    } catch (error) {
      console.error('Session check failed:', error)
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  const login = async (password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'login',
          password,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Refresh session after successful login
        await checkSession()
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('Login failed:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'logout',
        }),
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsAuthenticated(false)
      setUser(null)
    }
  }

  const refreshSession = async () => {
    await checkSession()
  }

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    refreshSession,
  }
}
