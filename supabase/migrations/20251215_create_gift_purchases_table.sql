-- Migration: Create gift_purchases table for Christmas gift feature
-- Date: 2024-12-15
-- Description: Creates table for tracking gift purchases, gift codes, and redemptions

-- ============================================================================
-- 1. CREATE GIFT_PURCHASES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS gift_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Buyer information
  buyer_email VARCHAR(255) NOT NULL,
  buyer_name VARCHAR(255) NOT NULL,
  buyer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for guest purchases

  -- Recipient information
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,

  -- Gift details
  gift_code VARCHAR(20) UNIQUE NOT NULL,
  plan_type VARCHAR(50) NOT NULL, -- 'monthly', 'annual', 'lifetime'
  plan_duration_months INTEGER NOT NULL, -- 1, 12, or -1 for lifetime

  -- Personalized message
  gift_message TEXT,

  -- Payment information
  payment_method VARCHAR(20) NOT NULL, -- 'pix' or 'stripe'
  payment_id VARCHAR(255), -- Mercado Pago or Stripe payment ID
  amount_paid DECIMAL(10,2) NOT NULL,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending_payment',
  -- Status values: pending_payment, paid, email_sent, redeemed, expired, cancelled

  -- Redemption information
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Gift code expires after 90 days
  email_sent_at TIMESTAMP WITH TIME ZONE
);

-- Add constraint for plan_type
ALTER TABLE gift_purchases
  ADD CONSTRAINT gift_purchases_plan_type_check
  CHECK (plan_type IN ('test', 'monthly', 'annual', 'lifetime'));

-- Add constraint for status
ALTER TABLE gift_purchases
  ADD CONSTRAINT gift_purchases_status_check
  CHECK (status IN ('pending_payment', 'paid', 'email_sent', 'redeemed', 'expired', 'cancelled'));

-- Add constraint for payment_method
ALTER TABLE gift_purchases
  ADD CONSTRAINT gift_purchases_payment_method_check
  CHECK (payment_method IN ('pix', 'stripe'));

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_gift_purchases_code ON gift_purchases(gift_code);
CREATE INDEX idx_gift_purchases_recipient_email ON gift_purchases(recipient_email);
CREATE INDEX idx_gift_purchases_buyer_email ON gift_purchases(buyer_email);
CREATE INDEX idx_gift_purchases_status ON gift_purchases(status);
CREATE INDEX idx_gift_purchases_payment_id ON gift_purchases(payment_id);
CREATE INDEX idx_gift_purchases_created_at ON gift_purchases(created_at DESC);

-- ============================================================================
-- 3. ENABLE RLS
-- ============================================================================

ALTER TABLE gift_purchases ENABLE ROW LEVEL SECURITY;

-- Anyone can create gift purchases (supports guest checkout)
CREATE POLICY "Anyone can create gift purchase" ON gift_purchases
  FOR INSERT WITH CHECK (true);

-- Anyone can view gift by code (needed for redemption page)
CREATE POLICY "Anyone can view gift by code" ON gift_purchases
  FOR SELECT USING (true);

-- Service role has full access
CREATE POLICY "Service role full access" ON gift_purchases
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 4. CREATE FUNCTION TO GENERATE UNIQUE GIFT CODE
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_gift_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  new_code VARCHAR(20);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Format: NATAL-XXXX-XXXX (easy to type)
    new_code := 'NATAL-' ||
                upper(substr(md5(random()::text), 1, 4)) || '-' ||
                upper(substr(md5(random()::text), 1, 4));

    SELECT EXISTS(SELECT 1 FROM gift_purchases WHERE gift_code = new_code) INTO code_exists;

    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION generate_gift_code IS 'Generates unique gift code in format NATAL-XXXX-XXXX';

-- ============================================================================
-- 5. CREATE FUNCTION TO REDEEM GIFT
-- ============================================================================

CREATE OR REPLACE FUNCTION redeem_gift(
  p_gift_code VARCHAR(20),
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_gift gift_purchases;
  v_plan_type VARCHAR(50);
  v_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get gift purchase
  SELECT * INTO v_gift FROM gift_purchases
  WHERE gift_code = p_gift_code AND status = 'email_sent';

  IF NOT FOUND THEN
    -- Check if already redeemed
    SELECT * INTO v_gift FROM gift_purchases WHERE gift_code = p_gift_code;
    IF FOUND AND v_gift.status = 'redeemed' THEN
      RETURN json_build_object('success', false, 'error', 'Este presente ja foi resgatado');
    END IF;
    RETURN json_build_object('success', false, 'error', 'Codigo de presente invalido');
  END IF;

  -- Check expiration
  IF v_gift.expires_at IS NOT NULL AND v_gift.expires_at < NOW() THEN
    UPDATE gift_purchases SET status = 'expired', updated_at = NOW() WHERE id = v_gift.id;
    RETURN json_build_object('success', false, 'error', 'Este presente expirou');
  END IF;

  -- Determine plan type and end date
  IF v_gift.plan_type = 'lifetime' THEN
    v_plan_type := 'lifetime';
    v_end_date := NULL; -- Never expires
  ELSE
    v_plan_type := 'pro';
    v_end_date := NOW() + (v_gift.plan_duration_months || ' months')::interval;
  END IF;

  -- Update gift purchase
  UPDATE gift_purchases SET
    status = 'redeemed',
    redeemed_by = p_user_id,
    redeemed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_gift.id;

  -- Update user profile
  UPDATE profiles SET
    plan_type = v_plan_type,
    subscription_status = CASE WHEN v_plan_type = 'lifetime' THEN 'lifetime' ELSE 'active' END,
    subscription_end_date = v_end_date,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'plan_type', v_plan_type,
    'duration_months', v_gift.plan_duration_months,
    'buyer_name', v_gift.buyer_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION redeem_gift IS 'Redeems a gift code and activates the subscription for the user';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_gift_code TO service_role;
GRANT EXECUTE ON FUNCTION generate_gift_code TO authenticated;
GRANT EXECUTE ON FUNCTION redeem_gift TO service_role;
GRANT EXECUTE ON FUNCTION redeem_gift TO authenticated;

-- ============================================================================
-- 6. CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_gift_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gift_purchases_updated_at
  BEFORE UPDATE ON gift_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_purchases_updated_at();

-- ============================================================================
-- 7. VERIFY MIGRATION
-- ============================================================================

DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gift_purchases'
  ) THEN
    RAISE NOTICE 'gift_purchases table created successfully';
  ELSE
    RAISE EXCEPTION 'gift_purchases table was not created';
  END IF;

  -- Check if generate_gift_code function exists
  IF EXISTS (
    SELECT FROM pg_proc WHERE proname = 'generate_gift_code'
  ) THEN
    RAISE NOTICE 'generate_gift_code function created successfully';
  ELSE
    RAISE EXCEPTION 'generate_gift_code function was not created';
  END IF;

  -- Check if redeem_gift function exists
  IF EXISTS (
    SELECT FROM pg_proc WHERE proname = 'redeem_gift'
  ) THEN
    RAISE NOTICE 'redeem_gift function created successfully';
  ELSE
    RAISE EXCEPTION 'redeem_gift function was not created';
  END IF;
END $$;
