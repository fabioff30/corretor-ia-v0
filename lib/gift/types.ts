/**
 * TypeScript types for Christmas Gift Feature
 */

import type { GiftPlanId } from './config'

// ============================================================================
// Database Types
// ============================================================================

export type GiftStatus =
  | 'pending_payment'
  | 'paid'
  | 'email_sent'
  | 'redeemed'
  | 'expired'
  | 'cancelled'

export type PaymentMethod = 'pix' | 'stripe'

export interface GiftPurchase {
  id: string

  // Buyer info
  buyer_email: string
  buyer_name: string
  buyer_user_id: string | null

  // Recipient info
  recipient_email: string
  recipient_name: string

  // Gift details
  gift_code: string
  plan_type: GiftPlanId
  plan_duration_months: number
  gift_message: string | null

  // Payment
  payment_method: PaymentMethod
  payment_id: string | null
  amount_paid: number

  // Status
  status: GiftStatus

  // Redemption
  redeemed_by: string | null
  redeemed_at: string | null

  // Timestamps
  created_at: string
  updated_at: string
  expires_at: string | null
  email_sent_at: string | null
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateGiftRequest {
  // Buyer info
  buyer_name: string
  buyer_email: string

  // Recipient info
  recipient_name: string
  recipient_email: string

  // Gift details
  plan_id: GiftPlanId
  gift_message?: string

  // Payment
  payment_method: PaymentMethod
}

export interface CreateGiftResponse {
  success: boolean
  gift_id?: string
  gift_code?: string

  // PIX payment data
  pix_qr_code?: string
  pix_qr_code_base64?: string
  pix_copy_paste?: string
  pix_expires_at?: string

  // Stripe payment data
  stripe_checkout_url?: string

  // Error
  error?: string
}

export interface GiftStatusResponse {
  status: GiftStatus
  payment_confirmed: boolean
  email_sent: boolean
}

export interface VerifyGiftResponse {
  valid: boolean
  gift?: {
    plan_name: string
    plan_type: GiftPlanId
    duration_months: number
    buyer_name: string
    recipient_name: string
    expires_at: string | null
    already_redeemed: boolean
  }
  error?: string
}

export interface RedeemGiftRequest {
  code: string
}

export interface RedeemGiftResponse {
  success: boolean
  plan_type?: string
  duration_months?: number
  buyer_name?: string
  error?: string
}

// ============================================================================
// Form Types
// ============================================================================

export interface GiftFormData {
  // Buyer
  buyerName: string
  buyerEmail: string

  // Recipient
  recipientName: string
  recipientEmail: string

  // Gift
  planId: GiftPlanId
  giftMessage: string

  // Payment
  paymentMethod: PaymentMethod
}

export interface GiftFormErrors {
  buyerName?: string
  buyerEmail?: string
  recipientName?: string
  recipientEmail?: string
  planId?: string
  giftMessage?: string
  paymentMethod?: string
  general?: string
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface GiftPlanSelectorProps {
  selectedPlan: GiftPlanId | null
  onSelectPlan: (planId: GiftPlanId) => void
}

export interface GiftRecipientFormProps {
  formData: Pick<GiftFormData, 'recipientName' | 'recipientEmail' | 'giftMessage'>
  errors: Pick<GiftFormErrors, 'recipientName' | 'recipientEmail' | 'giftMessage'>
  onChange: (field: keyof GiftFormData, value: string) => void
}

export interface GiftPaymentSectionProps {
  paymentMethod: PaymentMethod
  onSelectPaymentMethod: (method: PaymentMethod) => void
  isProcessing: boolean
  onSubmit: () => void
  totalAmount: number
}

export interface GiftRedeemCardProps {
  giftCode: string
  giftData: VerifyGiftResponse['gift']
  isRedeeming: boolean
  onRedeem: () => void
  isLoggedIn: boolean
}
