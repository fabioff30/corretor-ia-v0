-- Migration: Remove deprecated 'test' plan type from pix_payments
-- Created: 2025-10-27

ALTER TABLE pix_payments
  DROP CONSTRAINT IF EXISTS pix_payments_plan_type_check;

UPDATE pix_payments
SET plan_type = 'monthly'
WHERE plan_type = 'test';

ALTER TABLE pix_payments
  ADD CONSTRAINT pix_payments_plan_type_check
  CHECK (plan_type IN ('monthly', 'annual'));
