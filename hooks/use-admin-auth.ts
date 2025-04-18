"use client"

import { useState, useEffect } from "react"

// Chave para armazenar o estado de autenticação no localStorage
const ADMIN_AUTH_KEY = "admin-authenticated"

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Verificar o estado de autenticação ao carregar o componente
  useEffect(() => {
    const checkAuth = () => {
      const storedAuth = localStorage.getItem(ADMIN_AUTH_KEY)
      setIsAdmin(storedAuth === "true")
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  // Função para autenticar como administrador
  const loginAsAdmin = (password: string) => {
    // Verificar a senha do administrador
    // Usamos o ADMIN_API_KEY como senha
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin-password-not-set"

    if (password === adminPassword) {
      localStorage.setItem(ADMIN_AUTH_KEY, "true")
      setIsAdmin(true)
      return true
    }

    return false
  }

  // Função para sair da conta de administrador
  const logoutAdmin = () => {
    localStorage.removeItem(ADMIN_AUTH_KEY)
    setIsAdmin(false)
  }

  return {
    isAdmin,
    isLoading,
    loginAsAdmin,
    logoutAdmin,
  }
}
