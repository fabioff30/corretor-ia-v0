// Sistema de autenticação simulado para desenvolvimento
export interface MockUser {
  id: string
  email: string
  name: string
  plan: 'free' | 'premium'
  created_at: string
  subscription?: {
    status: 'active' | 'canceled' | 'expired'
    current_period_end: string
    created_at: string
  }
}

// Usuários de teste
export const mockUsers: MockUser[] = [
  {
    id: 'user-free-1',
    email: 'usuario@teste.com',
    name: 'João Silva',
    plan: 'free',
    created_at: '2024-01-15T10:00:00.000Z'
  },
  {
    id: 'user-premium-1', 
    email: 'premium@teste.com',
    name: 'Maria Premium',
    plan: 'premium',
    created_at: '2024-02-01T10:00:00.000Z',
    subscription: {
      status: 'active',
      current_period_end: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 dias
      created_at: '2024-02-01T10:00:00.000Z'
    }
  },
  {
    id: 'user-premium-2',
    email: 'vip@teste.com', 
    name: 'Carlos VIP',
    plan: 'premium',
    created_at: '2024-01-20T10:00:00.000Z',
    subscription: {
      status: 'active',
      current_period_end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias (quase expirando)
      created_at: '2024-01-20T10:00:00.000Z'
    }
  }
]

// Simular login
export const mockLogin = (email: string, password: string): MockUser | null => {
  // Para demonstração, aceita qualquer senha
  const user = mockUsers.find(u => u.email === email)
  return user || null
}

// Função para salvar usuário logado no localStorage
export const saveMockSession = (user: MockUser) => {
  localStorage.setItem('mock-user-session', JSON.stringify({
    user,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
  }))
}

// Função para recuperar sessão do localStorage
export const getMockSession = (): MockUser | null => {
  try {
    const session = localStorage.getItem('mock-user-session')
    if (!session) return null
    
    const { user, expires } = JSON.parse(session)
    
    // Verificar se não expirou
    if (new Date(expires) < new Date()) {
      localStorage.removeItem('mock-user-session')
      return null
    }
    
    return user
  } catch {
    return null
  }
}

// Função para limpar sessão
export const clearMockSession = () => {
  localStorage.removeItem('mock-user-session')
}

// Estatísticas simuladas baseadas no usuário
export const getMockStats = (user: MockUser) => {
  const baseStats = {
    correctionsThisMonth: Math.floor(Math.random() * 20) + 5,
    averageScore: Math.floor(Math.random() * 30) / 10 + 7, // 7.0 - 10.0
  }

  if (user.plan === 'premium') {
    return {
      ...baseStats,
      correctionsThisMonth: baseStats.correctionsThisMonth + 15,
      charactersUsed: Math.floor(Math.random() * 8000) + 2000, // 2000-10000
      characterLimit: 10000
    }
  }

  return {
    ...baseStats,
    charactersUsed: Math.floor(Math.random() * 1200) + 300, // 300-1500
    characterLimit: 1500
  }
}