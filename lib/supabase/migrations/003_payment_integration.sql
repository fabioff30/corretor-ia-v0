-- Migration 003: Payment Integration with Mercado Pago
-- Created: 2025-10-03
-- Description: Add tables and functions for handling subscriptions and payment transactions

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- 1.1 Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Mercado Pago data
  mp_subscription_id TEXT UNIQUE, -- preapproval_id from MP
  mp_plan_id TEXT, -- Plan ID in MP
  mp_payer_id TEXT, -- Payer ID

  -- Status and control
  status TEXT CHECK (status IN ('pending', 'authorized', 'paused', 'canceled')) DEFAULT 'pending',
  payment_method_id TEXT,

  -- Dates
  start_date TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,

  -- Values
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, mp_subscription_id)
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_id ON subscriptions(mp_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Comments
COMMENT ON TABLE subscriptions IS 'User subscriptions managed through Mercado Pago';
COMMENT ON COLUMN subscriptions.mp_subscription_id IS 'Mercado Pago preapproval ID';
COMMENT ON COLUMN subscriptions.status IS 'pending, authorized, paused, or canceled';

-- 1.2 Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Mercado Pago data
  mp_payment_id TEXT UNIQUE,
  mp_subscription_id TEXT,

  -- Payment status
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'cancelled')) DEFAULT 'pending',
  status_detail TEXT,

  -- Values
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',

  -- Metadata
  payment_method TEXT,
  payment_type TEXT,

  -- Webhook data (raw JSON for debugging)
  webhook_data JSONB,

  -- Timestamps
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_subscription ON payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_mp_payment ON payment_transactions(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON payment_transactions(created_at DESC);

-- Comments
COMMENT ON TABLE payment_transactions IS 'Payment transaction history from Mercado Pago';
COMMENT ON COLUMN payment_transactions.status IS 'pending, approved, rejected, refunded, or cancelled';

-- 1.3 Add subscription fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'cancelled')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

COMMENT ON COLUMN profiles.subscription_status IS 'active, inactive, past_due, or cancelled';
COMMENT ON COLUMN profiles.subscription_expires_at IS 'When the paid subscription access expires';

-- ============================================================================
-- 2. FUNCTIONS
-- ============================================================================

-- 2.1 Activate subscription after payment approval
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

COMMENT ON FUNCTION activate_subscription IS 'Activate Pro plan after successful payment';

-- 2.2 Cancel subscription
CREATE OR REPLACE FUNCTION cancel_subscription(
  p_user_id UUID,
  p_subscription_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Revert to Free plan (with grace period)
  UPDATE profiles
  SET
    plan_type = 'free',
    subscription_status = 'cancelled',
    subscription_expires_at = NOW() + INTERVAL '30 days', -- Access until end of paid period
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Mark subscription as canceled
  UPDATE subscriptions
  SET
    status = 'canceled',
    end_date = NOW(),
    updated_at = NOW()
  WHERE id = p_subscription_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cancel_subscription IS 'Cancel subscription with 30-day grace period';

-- 2.3 Check for past due subscriptions
CREATE OR REPLACE FUNCTION check_past_due_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Mark users with payment overdue (> 5 days after payment date)
  UPDATE profiles p
  SET
    subscription_status = 'past_due',
    updated_at = NOW()
  FROM subscriptions s
  WHERE p.id = s.user_id
    AND s.status = 'authorized'
    AND s.next_payment_date < NOW() - INTERVAL '5 days'
    AND p.subscription_status = 'active';

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_past_due_subscriptions IS 'Mark subscriptions as past_due after 5 days';

-- 2.4 Process expired subscriptions
CREATE OR REPLACE FUNCTION process_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Downgrade users whose subscription access expired
  UPDATE profiles
  SET
    plan_type = 'free',
    subscription_status = 'inactive',
    updated_at = NOW()
  WHERE subscription_expires_at < NOW()
    AND plan_type = 'pro'
    AND subscription_status IN ('cancelled', 'past_due');

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_expired_subscriptions IS 'Downgrade users with expired subscription access';

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- 3.1 Update timestamp for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

-- 4.1 Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 4.2 Policies for subscriptions
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND plan_type = 'admin'
    )
  );

-- Allow system (service_role) to manage subscriptions
CREATE POLICY "System can manage subscriptions"
  ON subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4.3 Policies for payment_transactions
CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND plan_type = 'admin'
    )
  );

-- Allow system to insert transactions
CREATE POLICY "System can insert transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 5. INITIAL DATA (Optional - for testing)
-- ============================================================================

-- No initial data needed for production
-- For testing, you can create a test subscription manually

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
