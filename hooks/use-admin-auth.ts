"use client"

import { useAdminAuth as useAdminAuthContext } from './use-unified-auth'

/**
 * Hook específico para autenticação de administradores
 * Mantém compatibilidade com o código existente
 */
export function useAdminAuth() {
  const { admin, isAuthenticated, loading, signIn, signOut } = useAdminAuthContext()

  // Método de login legado (compatibilidade)
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signIn({ email, password })
      return !result.error
    } catch (error) {
      console.error('Erro no login admin:', error)
      return false
    }
  }

  // Método de logout legado (compatibilidade)
  const logout = async () => {
    await signOut()
  }

  return {
    admin,
    isAuthenticated,
    isLoading: loading,
    signIn,
    signOut,
    login, // Método legado
    logout, // Método legado
  }
}