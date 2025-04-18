"use client"

import { useState, useEffect } from "react"

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Verificar se o usuário já está autenticado no localStorage
    const checkAuth = () => {
      const storedAuth = localStorage.getItem("adminAuth")
      if (storedAuth === "true") {
        setIsAuthenticated(true)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = (password: string): boolean => {
    // Verificar se a senha corresponde à variável de ambiente
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

    if (adminPassword && password === adminPassword) {
      localStorage.setItem("adminAuth", "true")
      setIsAuthenticated(true)
      return true
    }

    return false
  }

  const logout = () => {
    localStorage.removeItem("adminAuth")
    setIsAuthenticated(false)
  }

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  }
}
