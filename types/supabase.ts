export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      document_conversions: {
        Row: {
          characters: number
          created_at: string
          error_message: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          pages: number
          processing_time_ms: number
          success: boolean
          user_id: string
          words: number
        }
        Insert: {
          characters?: number
          created_at?: string
          error_message?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          pages?: number
          processing_time_ms?: number
          success?: boolean
          user_id: string
          words?: number
        }
        Update: {
          characters?: number
          created_at?: string
          error_message?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          pages?: number
          processing_time_ms?: number
          success?: boolean
          user_id?: string
          words?: number
        }
        Relationships: []
      }
      gift_purchases: {
        Row: {
          amount_paid: number
          buyer_email: string
          buyer_name: string
          buyer_user_id: string | null
          created_at: string | null
          email_sent_at: string | null
          expires_at: string | null
          gift_code: string
          gift_message: string | null
          id: string
          payment_id: string | null
          payment_method: string
          plan_duration_months: number
          plan_type: string
          recipient_email: string
          recipient_name: string
          redeemed_at: string | null
          redeemed_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount_paid: number
          buyer_email: string
          buyer_name: string
          buyer_user_id?: string | null
          created_at?: string | null
          email_sent_at?: string | null
          expires_at?: string | null
          gift_code: string
          gift_message?: string | null
          id?: string
          payment_id?: string | null
          payment_method: string
          plan_duration_months: number
          plan_type: string
          recipient_email: string
          recipient_name: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number
          buyer_email?: string
          buyer_name?: string
          buyer_user_id?: string | null
          created_at?: string | null
          email_sent_at?: string | null
          expires_at?: string | null
          gift_code?: string
          gift_message?: string | null
          id?: string
          payment_id?: string | null
          payment_method?: string
          plan_duration_months?: number
          plan_type?: string
          recipient_email?: string
          recipient_name?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lifetime_purchases: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          payment_method: string
          promo_code: string | null
          purchased_at: string | null
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string
          promo_code?: string | null
          purchased_at?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string
          promo_code?: string | null
          purchased_at?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lifetime_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      limits_change_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          changed_by_email: string | null
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          plan_type: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          changed_by_email?: string | null
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          plan_type: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          changed_by_email?: string | null
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          plan_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "limits_change_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string
          mp_payment_id: string | null
          mp_subscription_id: string | null
          paid_at: string | null
          payment_method: string | null
          payment_type: string | null
          status: string | null
          status_detail: string | null
          stripe_charge_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          user_id: string | null
          webhook_data: Json | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_subscription_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_type?: string | null
          status?: string | null
          status_detail?: string | null
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          user_id?: string | null
          webhook_data?: Json | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_subscription_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_type?: string | null
          status?: string | null
          status_detail?: string | null
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          user_id?: string | null
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_stripe_subscriptions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          email: string
          id: string
          linked_at: string | null
          linked_to_user_id: string | null
          next_payment_date: string | null
          payment_status: string | null
          start_date: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          email: string
          id?: string
          linked_at?: string | null
          linked_to_user_id?: string | null
          next_payment_date?: string | null
          payment_status?: string | null
          start_date: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          email?: string
          id?: string
          linked_at?: string | null
          linked_to_user_id?: string | null
          next_payment_date?: string | null
          payment_status?: string | null
          start_date?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pix_payments: {
        Row: {
          amount: number
          created_at: string | null
          email: string | null
          expires_at: string
          id: string
          is_bundle: boolean | null
          julinho_activated: boolean | null
          julinho_activation_error: string | null
          linked_to_user_at: string | null
          paid_at: string | null
          payment_intent_id: string
          pix_code: string | null
          plan_type: string
          processing_started_at: string | null
          qr_code: string | null
          status: string
          updated_at: string | null
          user_id: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          email?: string | null
          expires_at: string
          id?: string
          is_bundle?: boolean | null
          julinho_activated?: boolean | null
          julinho_activation_error?: string | null
          linked_to_user_at?: string | null
          paid_at?: string | null
          payment_intent_id: string
          pix_code?: string | null
          plan_type: string
          processing_started_at?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          is_bundle?: boolean | null
          julinho_activated?: boolean | null
          julinho_activation_error?: string | null
          linked_to_user_at?: string | null
          paid_at?: string | null
          payment_intent_id?: string
          pix_code?: string | null
          plan_type?: string
          processing_started_at?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      plan_limits_config: {
        Row: {
          ai_analyses_per_day: number
          corrections_per_day: number
          created_at: string | null
          file_uploads_per_day: number
          id: string
          max_characters: number
          plan_type: string
          rewrites_per_day: number
          show_ads: boolean
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ai_analyses_per_day: number
          corrections_per_day: number
          created_at?: string | null
          file_uploads_per_day?: number
          id?: string
          max_characters: number
          plan_type: string
          rewrites_per_day: number
          show_ads: boolean
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ai_analyses_per_day?: number
          corrections_per_day?: number
          created_at?: string | null
          file_uploads_per_day?: number
          id?: string
          max_characters?: number
          plan_type?: string
          rewrites_per_day?: number
          show_ads?: boolean
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_limits_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          plan_type: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          plan_type?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          plan_type?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          stripe_customer_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          stripe_customer_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          stripe_customer_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          end_date: string | null
          id: string
          mp_payer_id: string | null
          mp_plan_id: string | null
          mp_subscription_id: string | null
          next_payment_date: string | null
          payment_method_id: string | null
          start_date: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          id?: string
          mp_payer_id?: string | null
          mp_plan_id?: string | null
          mp_subscription_id?: string | null
          next_payment_date?: string | null
          payment_method_id?: string | null
          start_date?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          id?: string
          mp_payer_id?: string | null
          mp_plan_id?: string | null
          mp_subscription_id?: string | null
          next_payment_date?: string | null
          payment_method_id?: string | null
          start_date?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_limits: {
        Row: {
          ai_analyses_used: number | null
          corrections_used: number | null
          date: string | null
          file_uploads_used: number
          id: string
          last_reset: string | null
          rewrites_used: number | null
          user_id: string | null
        }
        Insert: {
          ai_analyses_used?: number | null
          corrections_used?: number | null
          date?: string | null
          file_uploads_used?: number
          id?: string
          last_reset?: string | null
          rewrites_used?: number | null
          user_id?: string | null
        }
        Update: {
          ai_analyses_used?: number | null
          corrections_used?: number | null
          date?: string | null
          file_uploads_used?: number
          id?: string
          last_reset?: string | null
          rewrites_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_corrections: {
        Row: {
          character_count: number
          corrected_text: string
          created_at: string | null
          evaluation: Json | null
          id: string
          operation_type: string | null
          original_text: string
          tone_style: string | null
          user_id: string | null
        }
        Insert: {
          character_count: number
          corrected_text: string
          created_at?: string | null
          evaluation?: Json | null
          id?: string
          operation_type?: string | null
          original_text: string
          tone_style?: string | null
          user_id?: string | null
        }
        Update: {
          character_count?: number
          corrected_text?: string
          created_at?: string | null
          evaluation?: Json | null
          id?: string
          operation_type?: string | null
          original_text?: string
          tone_style?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_corrections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_lifetime_plan: {
        Args: { p_purchase_id: string; p_user_id: string }
        Returns: undefined
      }
      activate_subscription: {
        Args: { p_subscription_id: string; p_user_id: string }
        Returns: undefined
      }
      cancel_subscription: {
        Args: { p_subscription_id: string; p_user_id: string }
        Returns: undefined
      }
      check_past_due_subscriptions: { Args: never; Returns: number }
      check_user_limit: {
        Args: { p_operation_type: string; p_user_id: string }
        Returns: boolean
      }
      cleanup_old_conversions: { Args: never; Returns: number }
      cleanup_old_usage_limits: { Args: never; Returns: number }
      create_profile_for_user: { Args: { user_id: string }; Returns: undefined }
      dreamlit_auth_admin_executor: {
        Args: { command: string }
        Returns: undefined
      }
      expire_old_pix_payments: { Args: never; Returns: undefined }
      generate_gift_code: { Args: never; Returns: string }
      get_conversion_stats_by_date: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: Json
      }
      get_user_conversion_stats: { Args: { p_user_id: string }; Returns: Json }
      get_user_with_subscription: { Args: { user_uuid: string }; Returns: Json }
      increment_usage: {
        Args: { p_operation_type: string; p_user_id: string }
        Returns: undefined
      }
      process_expired_subscriptions: { Args: never; Returns: number }
      redeem_gift: {
        Args: { p_gift_code: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Legacy helper aliases (kept for backwards compatibility with existing imports)
export type Profile = Tables<'profiles'>
export type Subscription = Tables<'subscriptions'>
export type PaymentTransaction = Tables<'payment_transactions'>
export type LifetimePurchase = Tables<'lifetime_purchases'>
export type UserCorrection = Tables<'user_corrections'>
export type UsageLimit = Tables<'usage_limits'>
export type PlanLimitsConfig = Tables<'plan_limits_config'>
