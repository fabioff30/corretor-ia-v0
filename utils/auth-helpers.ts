import { UserWithSubscription } from '@/lib/supabase'

/**
 * Client-side helpers para autenticação
 */

/**
 * Validar formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validar força da senha
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} => {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Senha deve ter pelo menos 8 caracteres')
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Inclua pelo menos uma letra minúscula')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Inclua pelo menos uma letra maiúscula')
  }

  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Inclua pelo menos um número')
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
  } else {
    feedback.push('Inclua pelo menos um caractere especial')
  }

  return {
    isValid: score >= 3,
    score,
    feedback
  }
}

/**
 * Gerar URL de redirect segura
 */
export const getSafeRedirectUrl = (redirect: string | null, fallback: string = '/'): string => {
  if (!redirect) return fallback
  
  // Verificar se é uma URL relativa segura
  if (redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }
  
  return fallback
}

/**
 * Formatar nome de usuário
 */
export const formatUserName = (user: { name?: string; email: string }): string => {
  if (user.name?.trim()) {
    return user.name.trim()
  }
  
  // Extrair nome do email
  const emailPart = user.email.split('@')[0]
  return emailPart.charAt(0).toUpperCase() + emailPart.slice(1)
}

/**
 * Obter iniciais do usuário para avatar
 */
export const getUserInitials = (user: { name?: string; email: string }): string => {
  const name = formatUserName(user)
  
  const words = name.split(' ')
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  
  return name.slice(0, 2).toUpperCase()
}

/**
 * Verificar se usuário tem plano premium
 */
export const isPremiumUser = (user: UserWithSubscription | null): boolean => {
  return user?.subscription?.plan === 'premium' && user?.subscription?.status === 'active'
}

/**
 * Obter limite de caracteres para correção baseado no plano
 */
export const getCorrectionLimit = (user: UserWithSubscription | null): number => {
  return isPremiumUser(user) ? 5000 : 1500
}

/**
 * Verificar se usuário pode usar funcionalidade premium
 */
export const canUsePremiumFeature = (user: UserWithSubscription | null): boolean => {
  return isPremiumUser(user)
}

/**
 * Tipos de erro de autenticação
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'invalid_credentials',
  USER_NOT_FOUND = 'user_not_found',
  EMAIL_ALREADY_EXISTS = 'email_already_exists',
  WEAK_PASSWORD = 'weak_password',
  INVALID_EMAIL = 'invalid_email',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Mapear erros do Supabase para mensagens amigáveis
 */
export const getAuthErrorMessage = (error: any): string => {
  if (!error) return 'Erro desconhecido'
  
  const errorCode = error.message || error.code || ''
  
  // Erros comuns do Supabase
  if (errorCode.includes('Invalid login credentials')) {
    return 'Email ou senha inválidos'
  }
  
  if (errorCode.includes('User already registered')) {
    return 'Este email já está registrado'
  }
  
  if (errorCode.includes('Password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres'
  }
  
  if (errorCode.includes('Invalid email')) {
    return 'Email inválido'
  }
  
  if (errorCode.includes('Email not confirmed')) {
    return 'Verifique seu email para confirmar a conta'
  }
  
  if (errorCode.includes('User not found')) {
    return 'Usuário não encontrado'
  }
  
  if (errorCode.includes('Network')) {
    return 'Erro de conexão. Verifique sua internet'
  }
  
  return error.message || 'Erro desconhecido'
}

/**
 * Delay helper para retry logic
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry helper para operações de autenticação
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (i < maxRetries) {
        await delay(delayMs * (i + 1)) // Exponential backoff
      }
    }
  }
  
  throw lastError
}