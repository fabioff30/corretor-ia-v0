-- Migration 004: Stripe Integration
-- Created: 2025-10-06
-- Description: Add Stripe fields to existing payment tables

-- ============================================================================
-- 1. UPDATE SUBSCRIPTIONS TABLE
-- ============================================================================

-- Add Stripe columns to subscriptions table
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  -- Make Mercado Pago fields nullable for backwards compatibility
  ALTER COLUMN mp_subscription_id DROP NOT NULL;

-- Create indexes for Stripe fields
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id
  ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
  ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_price_id
  ON subscriptions(stripe_price_id);

-- Comments
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription ID (sub_xxx)';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe customer ID (cus_xxx)';
COMMENT ON COLUMN subscriptions.stripe_price_id IS 'Stripe price ID (price_xxx)';

-- ============================================================================
-- 2. UPDATE PAYMENT TRANSACTIONS TABLE
-- ============================================================================

-- Add Stripe columns to payment_transactions table
ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
  -- Make Mercado Pago fields nullable
  ALTER COLUMN mp_payment_id DROP NOT NULL;

-- Create indexes for Stripe fields
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent
  ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_invoice
  ON payment_transactions(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_charge
  ON payment_transactions(stripe_charge_id);

-- Comments
COMMENT ON COLUMN payment_transactions.stripe_payment_intent_id IS 'Stripe PaymentIntent ID (pi_xxx)';
COMMENT ON COLUMN payment_transactions.stripe_invoice_id IS 'Stripe Invoice ID (in_xxx)';
COMMENT ON COLUMN payment_transactions.stripe_charge_id IS 'Stripe Charge ID (ch_xxx)';

-- ============================================================================
-- 3. ADD STRIPE CUSTOMER TABLE (for caching customer data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,

  -- Customer data
  email TEXT,
  name TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, stripe_customer_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id
  ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id
  ON stripe_customers(stripe_customer_id);

-- Comments
COMMENT ON TABLE stripe_customers IS 'Cache of Stripe customer IDs for users';
COMMENT ON COLUMN stripe_customers.stripe_customer_id IS 'Stripe customer ID (cus_xxx)';

-- Trigger for updated_at
CREATE TRIGGER update_stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. UPDATE FUNCTIONS FOR STRIPE
-- ============================================================================

-- Update activate_subscription to work with both Stripe and Mercado Pago
CREATE OR REPLACE FUNCTION activate_subscription(
  p_user_id UUID,
  p_subscription_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Update profile to Pro status
  UPDATE profiles
  SET
    plan_type = 'pro',
    subscription_status = 'active',
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Update subscription status
  UPDATE subscriptions
  SET
    status = 'authorized',
    updated_at = NOW()
  WHERE id = p_subscription_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION activate_subscription IS 'Activate Pro plan after successful payment (works with Stripe or MP)';

-- ============================================================================
-- 5. ROW LEVEL SECURITY FOR NEW TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own Stripe customer"
  ON stripe_customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage Stripe customers"
  ON stripe_customers FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
