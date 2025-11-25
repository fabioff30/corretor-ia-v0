-- Migration: Add lifetime plan for Black Friday promotion
-- Date: 2024-11-24
-- Description: Creates lifetime plan type, lifetime_purchases table, and activation function

-- ============================================================================
-- 1. UPDATE PLAN_LIMITS_CONFIG CONSTRAINT TO ALLOW 'lifetime'
-- ============================================================================

-- Remove existing constraint
ALTER TABLE plan_limits_config
  DROP CONSTRAINT IF EXISTS plan_limits_config_plan_type_check;

-- Add new constraint including 'lifetime'
ALTER TABLE plan_limits_config
  ADD CONSTRAINT plan_limits_config_plan_type_check
  CHECK (plan_type IN ('free', 'pro', 'lifetime'));

-- ============================================================================
-- 1.1 UPDATE PROFILES CONSTRAINT TO ALLOW 'lifetime'
-- ============================================================================

-- Remove existing constraint from profiles table
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_type_check;

-- Add new constraint including 'lifetime'
ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_type_check
  CHECK (plan_type IN ('free', 'pro', 'admin', 'lifetime'));

-- ============================================================================
-- 2. ADD LIFETIME TO PLAN_LIMITS_CONFIG
-- ============================================================================

-- Insert lifetime plan limits (same as pro but never expires)
INSERT INTO plan_limits_config (
  plan_type,
  max_characters,
  corrections_per_day,
  rewrites_per_day,
  ai_analyses_per_day,
  file_uploads_per_day,
  show_ads
) VALUES (
  'lifetime',
  20000,   -- Same as pro
  -1,      -- Unlimited
  -1,      -- Unlimited
  -1,      -- Unlimited
  -1,      -- Unlimited
  false    -- No ads
)
ON CONFLICT (plan_type) DO NOTHING;

-- ============================================================================
-- 3. CREATE LIFETIME_PURCHASES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lifetime_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  payment_method TEXT NOT NULL DEFAULT 'stripe_card', -- 'stripe_card', 'stripe_pix'
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  promo_code TEXT,
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lifetime_purchases_user_id ON lifetime_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_lifetime_purchases_stripe_payment ON lifetime_purchases(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_lifetime_purchases_status ON lifetime_purchases(status);
CREATE INDEX IF NOT EXISTS idx_lifetime_purchases_checkout_session ON lifetime_purchases(stripe_checkout_session_id);

-- Enable RLS
ALTER TABLE lifetime_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own lifetime purchases"
  ON lifetime_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert lifetime purchases"
  ON lifetime_purchases FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update lifetime purchases"
  ON lifetime_purchases FOR UPDATE
  USING (true);

-- ============================================================================
-- 4. CREATE ACTIVATE_LIFETIME_PLAN FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.activate_lifetime_plan(
  p_user_id UUID,
  p_purchase_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Log function call
  RAISE NOTICE 'activate_lifetime_plan called for user % and purchase %', p_user_id, p_purchase_id;

  -- Update profile to lifetime status (never expires)
  UPDATE public.profiles
  SET
    plan_type = 'lifetime',
    subscription_status = 'lifetime',
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Check if profile was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  -- Update purchase record
  UPDATE lifetime_purchases
  SET
    status = 'completed',
    purchased_at = NOW(),
    updated_at = NOW()
  WHERE id = p_purchase_id;

  -- Check if purchase was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lifetime purchase % not found', p_purchase_id;
  END IF;

  -- Log success
  RAISE NOTICE 'Lifetime plan activated successfully for user %', p_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.activate_lifetime_plan IS 'Activates lifetime plan for user when Black Friday purchase is completed (never expires)';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.activate_lifetime_plan TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_lifetime_plan TO authenticated;

-- ============================================================================
-- 5. VERIFY MIGRATION
-- ============================================================================

DO $$
DECLARE
  lifetime_exists BOOLEAN;
BEGIN
  -- Check if lifetime plan was added to plan_limits_config
  SELECT EXISTS(
    SELECT 1 FROM plan_limits_config WHERE plan_type = 'lifetime'
  ) INTO lifetime_exists;

  IF lifetime_exists THEN
    RAISE NOTICE 'Lifetime plan successfully added to plan_limits_config';
  ELSE
    RAISE WARNING 'Lifetime plan was not added to plan_limits_config';
  END IF;

  -- Check if lifetime_purchases table exists
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lifetime_purchases'
  ) THEN
    RAISE NOTICE 'lifetime_purchases table created successfully';
  ELSE
    RAISE EXCEPTION 'lifetime_purchases table was not created';
  END IF;
END $$;
