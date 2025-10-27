-- Migration: Create activate_subscription RPC function
-- Created: 2025-10-27
-- Description: Creates the activate_subscription function that updates user profile
--              when a PIX payment is approved and subscription is created

-- ============================================================================
-- CREATE ACTIVATE_SUBSCRIPTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_user_id UUID,
  p_subscription_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_next_payment_date TIMESTAMPTZ;
  v_plan_type TEXT;
BEGIN
  -- Log function call
  RAISE NOTICE 'activate_subscription called for user % and subscription %', p_user_id, p_subscription_id;

  -- Get next_payment_date from subscription to calculate expiration
  SELECT next_payment_date,
         CASE
           WHEN mp_subscription_id LIKE 'pix_%' THEN 'pro'
           ELSE 'pro'
         END
  INTO v_next_payment_date, v_plan_type
  FROM public.subscriptions
  WHERE id = p_subscription_id AND user_id = p_user_id;

  -- Check if subscription exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription % not found for user %', p_subscription_id, p_user_id;
  END IF;

  -- Update profiles table
  UPDATE public.profiles
  SET
    plan_type = v_plan_type,
    subscription_status = 'active',
    subscription_expires_at = v_next_payment_date,
    is_pro = TRUE,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Check if profile was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  -- Log success
  RAISE NOTICE 'Profile activated successfully for user %: plan_type=%, expires_at=%',
    p_user_id, v_plan_type, v_next_payment_date;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.activate_subscription IS 'Activates user profile when subscription is created (PRO plan with 1-month expiration)';

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.activate_subscription TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_subscription TO authenticated;
