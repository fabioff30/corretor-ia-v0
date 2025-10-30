import { supabase as browserSupabase } from './supabase/client'

export const supabase = browserSupabase

// Tipos do banco de dados
export interface User {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  status: 'active' | 'canceled' | 'expired' | 'trial'
  plan: 'free' | 'premium'
  current_period_start?: string
  current_period_end?: string
  mercadopago_subscription_id?: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  subscription_id?: string
  mercadopago_payment_id?: string
  amount: number
  status: string
  created_at: string
}

export interface CorrectionHistory {
  id: string
  user_id: string
  original_text: string
  corrected_text: string
  score: number
  character_count: number
  correction_type: 'grammar' | 'style' | 'tone' | 'complete'
  created_at: string
}

// Tipos combinados para uso na aplicação
export interface UserWithSubscription extends User {
  subscription?: Subscription
}
