/**
 * Mercado Pago Client
 * Handles all interactions with Mercado Pago API for subscriptions and payments
 */

import { getServerConfig } from '@/utils/env-config'

// Types for Mercado Pago API
export interface MPSubscriptionRequest {
  reason: string // Plan name/description
  auto_recurring: {
    frequency: number // Billing frequency (e.g., 1 for monthly)
    frequency_type: 'days' | 'months' // Frequency unit
    transaction_amount: number // Amount in currency (e.g., 29.90)
    currency_id: string // Currency (e.g., 'BRL')
  }
  back_url: string // URL to redirect after payment
  payer_email?: string // Optional payer email
  external_reference?: string // Your internal reference (user_id)
}

export interface MPSubscriptionResponse {
  id: string // preapproval_id
  payer_id: number
  payer_email: string
  back_url: string
  init_point: string // URL to redirect user for payment
  sandbox_init_point: string
  status: 'pending' | 'authorized' | 'paused' | 'cancelled'
  reason: string
  external_reference: string
  date_created: string
  last_modified: string
  init_point_url?: string
  auto_recurring: {
    frequency: number
    frequency_type: string
    transaction_amount: number
    currency_id: string
    start_date?: string
    end_date?: string
  }
  summarized: {
    quotas: number | null
    charged_quantity: number
    charged_amount: number
    pending_charge_quantity: number
    pending_charge_amount: number
    semaphore: string
  }
}

export interface MPSubscriptionDetails {
  id: string
  payer_id: number
  status: string
  next_payment_date: string
  payment_method_id: string
  summarized: {
    charged_quantity: number
    charged_amount: number
  }
}

export interface MPPaymentDetails {
  id: number
  status: string
  status_detail: string
  transaction_amount: number
  currency_id: string
  date_created: string
  date_approved: string | null
  payer: {
    id: string
    email: string
  }
  payment_method_id: string
  payment_type_id: string
}

/**
 * Mercado Pago Client Class
 */
export class MercadoPagoClient {
  private accessToken: string
  private baseUrl: string = 'https://api.mercadopago.com'

  constructor(accessToken?: string) {
    this.accessToken = accessToken || getServerConfig().MERCADO_PAGO_ACCESS_TOKEN

    if (!this.accessToken) {
      throw new Error('Mercado Pago access token not configured')
    }
  }

  /**
   * Create a new subscription (preapproval)
   */
  async createSubscription(
    data: MPSubscriptionRequest
  ): Promise<MPSubscriptionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/preapproval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('MP API Error:', error)
        throw new Error(
          `Failed to create subscription: ${error.message || response.statusText}`
        )
      }

      const subscription: MPSubscriptionResponse = await response.json()
      return subscription
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw error
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<MPSubscriptionDetails> {
    try {
      const response = await fetch(
        `${this.baseUrl}/preapproval/${subscriptionId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to get subscription: ${response.statusText}`)
      }

      const subscription: MPSubscriptionDetails = await response.json()
      return subscription
    } catch (error) {
      console.error('Error getting subscription:', error)
      throw error
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/preapproval/${subscriptionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            status: 'cancelled',
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to cancel subscription: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      throw error
    }
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/preapproval/${subscriptionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            status: 'paused',
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to pause subscription: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error pausing subscription:', error)
      throw error
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<MPPaymentDetails> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get payment: ${response.statusText}`)
      }

      const payment: MPPaymentDetails = await response.json()
      return payment
    } catch (error) {
      console.error('Error getting payment:', error)
      throw error
    }
  }

  /**
   * Search payments by external reference (user_id)
   */
  async searchPaymentsByReference(
    externalReference: string
  ): Promise<MPPaymentDetails[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/payments/search?external_reference=${externalReference}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to search payments: ${response.statusText}`)
      }

      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error('Error searching payments:', error)
      throw error
    }
  }
}

/**
 * Helper function to create a Pro plan subscription
 */
export async function createProSubscription(
  userId: string,
  userEmail: string,
  backUrl: string
): Promise<MPSubscriptionResponse> {
  const client = new MercadoPagoClient()

  const subscriptionData: MPSubscriptionRequest = {
    reason: 'Plano Premium - CorretorIA',
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: 29.90, // R$ 29,90/mês
      currency_id: 'BRL',
    },
    back_url: backUrl,
    payer_email: userEmail,
    external_reference: userId,
  }

  return await client.createSubscription(subscriptionData)
}

/**
 * Get the default Mercado Pago client instance
 */
export function getMercadoPagoClient(): MercadoPagoClient {
  return new MercadoPagoClient()
}
