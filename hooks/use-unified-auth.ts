"use client"

import { useContext } from 'react'
import { useUnifiedAuth } from '@/contexts/unified-auth-context'

/**
 * Hook principal de autenticação unificada
 * Exporta o contexto completo para uso geral
 */
export const useAuth = () => {
  return useUnifiedAuth()
}

/**
 * Hook para verificar tipos específicos de autenticação
 */
export const useAuthType = () => {
  const { userType, isAdmin, isUser, isAuthenticated } = useUnifiedAuth()
  
  return {
    userType,
    isAdmin: isAdmin(),
    isUser: isUser(),
    isAuthenticated: isAuthenticated(),
  }
}

/**
 * Hook para métodos de autenticação de usuários
 */
export const useUserAuth = () => {
  const {
    signUp,
    signInUser,
    signInWithProvider,
    resetPassword,
    updateUserProfile,
    refreshUser,
    signOut,
    user,
    session,
    loading,
  } = useUnifiedAuth()
  
  return {
    user: user?.userType === 'user' ? user : null,
    session,
    loading,
    signUp,
    signIn: signInUser,
    signInWithProvider,
    resetPassword,
    updateProfile: updateUserProfile,
    refreshUser,
    signOut,
  }
}

/**
 * Hook para métodos de autenticação de administradores
 */
export const useAdminAuth = () => {
  const {
    signInAdmin,
    signOut,
    user,
    loading,
  } = useUnifiedAuth()
  
  return {
    admin: user?.userType === 'admin' ? user : null,
    isAuthenticated: user?.userType === 'admin',
    loading,
    signIn: signInAdmin,
    signOut,
  }
}

/**
 * Hook para operações comuns de autenticação
 */
export const useAuthActions = () => {
  const { signOut, loading } = useUnifiedAuth()
  
  return {
    signOut,
    loading,
  }
}

/**
 * Hook para dados do usuário atual (independente do tipo)
 */
export const useCurrentUser = () => {
  const { user, userType, loading } = useUnifiedAuth()
  
  return {
    user,
    userType,
    loading,
    isAdmin: userType === 'admin',
    isUser: userType === 'user',
    isAuthenticated: user !== null,
  }
}