/**
 * TypeScript types para o schema do Supabase
 * Gerado automaticamente ou definido manualmente
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          plan_type: 'free' | 'pro' | 'lifetime' | 'admin' | 'lifetime'
          subscription_status: 'active' | 'inactive' | 'past_due' | 'cancelled'
          subscription_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          plan_type?: 'free' | 'pro' | 'admin'
          subscription_status?: 'active' | 'inactive' | 'past_due' | 'cancelled'
          subscription_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          plan_type?: 'free' | 'pro' | 'admin'
          subscription_status?: 'active' | 'inactive' | 'past_due' | 'cancelled'
          subscription_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_corrections: {
        Row: {
          id: string
          user_id: string
          original_text: string
          corrected_text: string
          operation_type: 'correct' | 'rewrite' | 'ai_analysis' | 'file_upload'
          tone_style: string | null
          evaluation: Json | null
          character_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_text: string
          corrected_text: string
          operation_type: 'correct' | 'rewrite' | 'ai_analysis' | 'file_upload'
          tone_style?: string | null
          evaluation?: Json | null
          character_count: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_text?: string
          corrected_text?: string
          operation_type?: 'correct' | 'rewrite' | 'ai_analysis' | 'file_upload'
          tone_style?: string | null
          evaluation?: Json | null
          character_count?: number
          created_at?: string
        }
      }
      usage_limits: {
        Row: {
          id: string
          user_id: string
          date: string
          corrections_used: number
          rewrites_used: number
          ai_analyses_used: number
          file_uploads_used: number
          last_reset: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          corrections_used?: number
          rewrites_used?: number
          ai_analyses_used?: number
          file_uploads_used?: number
          last_reset?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          corrections_used?: number
          rewrites_used?: number
          ai_analyses_used?: number
          file_uploads_used?: number
          last_reset?: string
        }
      }
      plan_limits_config: {
        Row: {
          id: string
          plan_type: 'free' | 'pro' | 'lifetime'
          max_characters: number
          corrections_per_day: number
          rewrites_per_day: number
          ai_analyses_per_day: number
          file_uploads_per_day: number
          show_ads: boolean
          updated_by: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          plan_type: 'free' | 'pro' | 'lifetime'
          max_characters: number
          corrections_per_day: number
          rewrites_per_day: number
          ai_analyses_per_day: number
          file_uploads_per_day: number
          show_ads: boolean
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          plan_type?: 'free' | 'pro'
          max_characters?: number
          corrections_per_day?: number
          rewrites_per_day?: number
          ai_analyses_per_day?: number
          file_uploads_per_day?: number
          show_ads?: boolean
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
      }
      limits_change_history: {
        Row: {
          id: string
          plan_type: string
          field_changed: string
          old_value: string | null
          new_value: string | null
          changed_by: string | null
          changed_by_email: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          plan_type: string
          field_changed: string
          old_value?: string | null
          new_value?: string | null
          changed_by?: string | null
          changed_by_email?: string | null
          changed_at?: string
        }
        Update: {
          id?: string
          plan_type?: string
          field_changed?: string
          old_value?: string | null
          new_value?: string | null
          changed_by?: string | null
          changed_by_email?: string | null
          changed_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          mp_subscription_id: string | null
          mp_plan_id: string | null
          mp_payer_id: string | null
          status: 'pending' | 'authorized' | 'paused' | 'canceled'
          payment_method_id: string | null
          start_date: string | null
          next_payment_date: string | null
          end_date: string | null
          amount: number | null
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mp_subscription_id?: string | null
          mp_plan_id?: string | null
          mp_payer_id?: string | null
          status?: 'pending' | 'authorized' | 'paused' | 'canceled'
          payment_method_id?: string | null
          start_date?: string | null
          next_payment_date?: string | null
          end_date?: string | null
          amount?: number | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mp_subscription_id?: string | null
          mp_plan_id?: string | null
          mp_payer_id?: string | null
          status?: 'pending' | 'authorized' | 'paused' | 'canceled'
          payment_method_id?: string | null
          start_date?: string | null
          next_payment_date?: string | null
          end_date?: string | null
          amount?: number | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      payment_transactions: {
        Row: {
          id: string
          subscription_id: string | null
          user_id: string | null
          mp_payment_id: string | null
          mp_subscription_id: string | null
          status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled'
          status_detail: string | null
          amount: number | null
          currency: string
          payment_method: string | null
          payment_type: string | null
          webhook_data: Json | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          subscription_id?: string | null
          user_id?: string | null
          mp_payment_id?: string | null
          mp_subscription_id?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled'
          status_detail?: string | null
          amount?: number | null
          currency?: string
          payment_method?: string | null
          payment_type?: string | null
          webhook_data?: Json | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          subscription_id?: string | null
          user_id?: string | null
          mp_payment_id?: string | null
          mp_subscription_id?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled'
          status_detail?: string | null
          amount?: number | null
          currency?: string
          payment_method?: string | null
          payment_type?: string | null
          webhook_data?: Json | null
          paid_at?: string | null
          created_at?: string
        }
      }
      lifetime_purchases: {
        Row: {
          id: string
          user_id: string
          stripe_payment_intent_id: string | null
          stripe_checkout_session_id: string | null
          amount: number
          currency: string
          payment_method: 'stripe_card' | 'stripe_pix'
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          promo_code: string | null
          purchased_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_payment_intent_id?: string | null
          stripe_checkout_session_id?: string | null
          amount: number
          currency?: string
          payment_method?: 'stripe_card' | 'stripe_pix'
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          promo_code?: string | null
          purchased_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_payment_intent_id?: string | null
          stripe_checkout_session_id?: string | null
          amount?: number
          currency?: string
          payment_method?: 'stripe_card' | 'stripe_pix'
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          promo_code?: string | null
          purchased_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_limit: {
        Args: {
          p_user_id: string
          p_operation_type: string
        }
        Returns: boolean
      }
      increment_usage: {
        Args: {
          p_user_id: string
          p_operation_type: string
        }
        Returns: void
      }
      cleanup_old_usage_limits: {
        Args: Record<string, never>
        Returns: number
      }
      activate_subscription: {
        Args: {
          p_user_id: string
          p_subscription_id: string
        }
        Returns: void
      }
      cancel_subscription: {
        Args: {
          p_user_id: string
          p_subscription_id: string
        }
        Returns: void
      }
      check_past_due_subscriptions: {
        Args: Record<string, never>
        Returns: number
      }
      process_expired_subscriptions: {
        Args: Record<string, never>
        Returns: number
      }
      activate_lifetime_plan: {
        Args: {
          p_user_id: string
          p_purchase_id: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserCorrection = Database['public']['Tables']['user_corrections']['Row']
export type UsageLimit = Database['public']['Tables']['usage_limits']['Row']
export type PlanLimitsConfig = Database['public']['Tables']['plan_limits_config']['Row']
export type LimitsChangeHistory = Database['public']['Tables']['limits_change_history']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type PaymentTransaction = Database['public']['Tables']['payment_transactions']['Row']
export type LifetimePurchase = Database['public']['Tables']['lifetime_purchases']['Row']
