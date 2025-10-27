-- Manual activation script for payment 130895552147
-- User: ads@fabiofariasf.com.br (53485bac-5e9a-40b6-b955-3a1e3742051f)
-- Payment was approved on 2025-10-27T13:13:49 but webhook didn't process it

BEGIN;

-- Step 1: Check if subscription already exists
SELECT id, status FROM subscriptions
WHERE user_id = '53485bac-5e9a-40b6-b955-3a1e3742051f'
  AND status IN ('authorized', 'active');
-- If exists, ROLLBACK and handle differently

-- Step 2: Update PIX payment to mark as paid
UPDATE pix_payments
SET
  status = 'paid',
  paid_at = '2025-10-27T13:13:49.000-04:00'
WHERE id = '2f886852-68aa-465f-b95a-7e52598442aa';

-- Step 3: Create subscription (monthly plan = 30 days)
INSERT INTO subscriptions (
  user_id,
  mp_subscription_id,
  mp_payer_id,
  status,
  start_date,
  next_payment_date,
  amount,
  currency,
  payment_method_id
) VALUES (
  '53485bac-5e9a-40b6-b955-3a1e3742051f',
  'pix_130895552147',
  '2375529211',
  'authorized',
  '2025-10-27T13:13:49.000-04:00',
  '2025-11-27T13:13:49.000-04:00', -- 30 days later
  14.95,
  'BRL',
  'pix'
) RETURNING id;
-- Note the returned subscription_id for next step

-- Step 4: Activate subscription (will be done via RPC after getting subscription_id)
-- SELECT activate_subscription('53485bac-5e9a-40b6-b955-3a1e3742051f', '<subscription_id>');

-- Step 5: Update profile to PRO
UPDATE profiles
SET
  plan_type = 'pro',
  subscription_status = 'active',
  subscription_expires_at = '2025-11-27T13:13:49.000-04:00',
  updated_at = NOW()
WHERE id = '53485bac-5e9a-40b6-b955-3a1e3742051f';

-- Step 6: Mark payment as consumed
UPDATE pix_payments
SET status = 'consumed'
WHERE id = '2f886852-68aa-465f-b95a-7e52598442aa';

-- Verify the changes
SELECT
  p.email,
  p.plan_type,
  p.subscription_status,
  p.subscription_expires_at,
  pp.status as payment_status,
  pp.paid_at,
  s.id as subscription_id,
  s.status as subscription_status
FROM profiles p
LEFT JOIN pix_payments pp ON pp.user_id = p.id
LEFT JOIN subscriptions s ON s.user_id = p.id
WHERE p.id = '53485bac-5e9a-40b6-b955-3a1e3742051f';

COMMIT;
