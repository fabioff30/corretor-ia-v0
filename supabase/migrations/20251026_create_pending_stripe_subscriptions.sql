-- Migration: Create pending_stripe_subscriptions table for guest checkouts
-- This table stores Stripe subscriptions from guest checkouts until they can be linked to a user account

CREATE TABLE IF NOT EXISTS pending_stripe_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'authorized', 'active', 'paused', 'canceled')),
  start_date TIMESTAMPTZ NOT NULL,
  next_payment_date TIMESTAMPTZ,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  payment_status TEXT, -- from checkout session
  linked_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  linked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_pending_stripe_subs_email ON pending_stripe_subscriptions(email);
CREATE INDEX idx_pending_stripe_subs_stripe_sub_id ON pending_stripe_subscriptions(stripe_subscription_id);
CREATE INDEX idx_pending_stripe_subs_linked ON pending_stripe_subscriptions(linked_to_user_id) WHERE linked_to_user_id IS NOT NULL;
CREATE INDEX idx_pending_stripe_subs_pending ON pending_stripe_subscriptions(email, status) WHERE linked_to_user_id IS NULL;

-- Add RLS (Row Level Security) policies
ALTER TABLE pending_stripe_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy for service role to manage all pending subscriptions
CREATE POLICY "Service role can manage all pending subscriptions" ON pending_stripe_subscriptions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pending_stripe_subs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_pending_stripe_subs_updated_at_trigger
  BEFORE UPDATE ON pending_stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_stripe_subs_updated_at();

-- Add comment for documentation
COMMENT ON TABLE pending_stripe_subscriptions IS 'Stores Stripe subscriptions from guest checkouts that are pending user account linking';
COMMENT ON COLUMN pending_stripe_subscriptions.email IS 'Email used in guest checkout';
COMMENT ON COLUMN pending_stripe_subscriptions.linked_to_user_id IS 'User ID when subscription is linked to account';
COMMENT ON COLUMN pending_stripe_subscriptions.linked_at IS 'Timestamp when subscription was linked';
