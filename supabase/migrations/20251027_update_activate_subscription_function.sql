-- Migration: Update activate_subscription function to avoid referencing legacy columns
-- Created: 2025-10-27

CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_user_id UUID,
  p_subscription_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_next_payment_date TIMESTAMPTZ;
  v_plan_type TEXT;
BEGIN
  SELECT next_payment_date,
         CASE
           WHEN mp_subscription_id LIKE 'pix_%' THEN 'pro'
           ELSE 'pro'
         END
  INTO v_next_payment_date, v_plan_type
  FROM public.subscriptions
  WHERE id = p_subscription_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription % not found for user %', p_subscription_id, p_user_id;
  END IF;

  UPDATE public.profiles
  SET
    plan_type = v_plan_type,
    subscription_status = 'active',
    subscription_expires_at = v_next_payment_date,
    updated_at = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.activate_subscription IS 'Activates user profile when subscription is created (PRO plan with 1-month expiration)';
