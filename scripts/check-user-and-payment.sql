-- Check if user_id matches ads@fabiofariasf.com.br
SELECT
  id,
  email,
  plan_type,
  subscription_status
FROM profiles
WHERE id = '53485bac-5e9a-40b6-b955-3a1e3742051f';

-- Check if there's a PIX payment record for this payment_id
SELECT
  id,
  user_id,
  email,
  payment_intent_id,
  status,
  amount,
  plan_type,
  created_at,
  paid_at,
  expires_at
FROM pix_payments
WHERE payment_intent_id = '130895552147';

-- Also check by user_id
SELECT
  id,
  user_id,
  email,
  payment_intent_id,
  status,
  amount,
  plan_type,
  created_at,
  paid_at,
  expires_at
FROM pix_payments
WHERE user_id = '53485bac-5e9a-40b6-b955-3a1e3742051f'
ORDER BY created_at DESC;
