import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Cliente Supabase para uso no lado do cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate'
    }
  }
})

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
  plan: 'free' | 'premium' | 'pro' | 'plus'
  plan_id?: string
  billing_period?: 'monthly' | 'annual'
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

// Tipos para os novos planos
export interface PlanFeature {
  feature_name: string
  feature_display_name: string
  daily_limit?: number | null
  monthly_limit?: number | null
  is_available: boolean
}

export interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  description?: string
  priority: number
  monthly_price?: number
  annual_price?: number
  features?: Record<string, PlanFeature>
}

export interface FeatureUsage {
  allowed: boolean
  reason: string
  daily_limit?: number | null
  monthly_limit?: number | null
  daily_used: number
  monthly_used: number
}

// Tipos combinados para uso na aplicação
export interface UserWithSubscription extends User {
  subscription?: Subscription
  subscription_plan?: SubscriptionPlan
}