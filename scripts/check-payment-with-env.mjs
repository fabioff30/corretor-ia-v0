/**
 * Quick script to check payment status in Mercado Pago
 * Usage: node scripts/check-payment-with-env.mjs <paymentId>
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = join(__dirname, '..', '.env.local')
try {
  const envFile = readFileSync(envPath, 'utf8')
  const lines = envFile.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  }
} catch (error) {
  console.error('Warning: Could not load .env.local:', error.message)
}

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN

if (!MERCADO_PAGO_ACCESS_TOKEN) {
  console.error('❌ MERCADO_PAGO_ACCESS_TOKEN not found in environment')
  process.exit(1)
}

const paymentId = process.argv[2]

if (!paymentId) {
  console.error('❌ Usage: node scripts/check-payment-with-env.mjs <paymentId>')
  process.exit(1)
}

console.log(`\n🔍 Checking payment ${paymentId} in Mercado Pago...\n`)

try {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    }
  )

  if (!response.ok) {
    console.error(`❌ API Error: ${response.status} ${response.statusText}`)
    const errorBody = await response.text()
    console.error('Response body:', errorBody)
    process.exit(1)
  }

  const payment = await response.json()

  console.log('✅ Payment found in Mercado Pago:')
  console.log('─────────────────────────────────────')
  console.log(`Payment ID: ${payment.id}`)
  console.log(`Status: ${payment.status}`)
  console.log(`Status Detail: ${payment.status_detail}`)
  console.log(`Payment Method: ${payment.payment_method_id}`)
  console.log(`Amount: ${payment.currency_id} ${payment.transaction_amount}`)
  console.log(`External Reference: ${payment.external_reference || 'N/A'}`)
  console.log(`Date Created: ${payment.date_created}`)
  console.log(`Date Approved: ${payment.date_approved || 'Not approved yet'}`)
  console.log(`Date Last Updated: ${payment.date_last_updated}`)

  if (payment.date_of_expiration) {
    console.log(`Date of Expiration: ${payment.date_of_expiration}`)
    const expirationDate = new Date(payment.date_of_expiration)
    const now = new Date()
    if (expirationDate < now) {
      console.log(`⚠️  Payment has EXPIRED (${Math.floor((now - expirationDate) / (1000 * 60))} minutes ago)`)
    }
  }

  console.log('─────────────────────────────────────')

  // Check if it was paid
  if (payment.status === 'approved') {
    console.log('\n✅ PAYMENT WAS APPROVED!')
    console.log(`✅ Approved at: ${payment.date_approved}`)
    console.log('\n📌 This payment should be processed by webhook.')
    console.log('If webhook was not received, we need to manually process it.')
  } else {
    console.log(`\n⚠️  Payment status is: ${payment.status}`)
    console.log('This payment has NOT been approved yet.')
  }

} catch (error) {
  console.error('❌ Error checking payment:', error.message)
  process.exit(1)
}
