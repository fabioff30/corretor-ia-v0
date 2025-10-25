-- Allow PIX payments created for test flows
ALTER TABLE pix_payments
  DROP CONSTRAINT IF EXISTS pix_payments_plan_type_check;

ALTER TABLE pix_payments
  ADD CONSTRAINT pix_payments_plan_type_check
  CHECK (plan_type IN ('monthly', 'annual', 'test'));
