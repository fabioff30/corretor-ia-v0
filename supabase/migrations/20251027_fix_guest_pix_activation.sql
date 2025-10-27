-- Migration: Fix Guest PIX Activation Flow
-- Created: 2025-10-27
-- Description:
--   Adds 'approved' and 'consumed' states to pix_payments to properly handle
--   guest payments where user creates account AFTER paying.
--
--   Flow:
--   1. pending → User generates PIX
--   2. approved → Mercado Pago confirms payment (guest payment not yet linked)
--   3. consumed → Payment benefit applied to user profile (PRO plan activated)

-- ============================================================================
-- 1. UPDATE PIX_PAYMENTS TABLE STATUS CONSTRAINT
-- ============================================================================

-- Drop old constraint
ALTER TABLE pix_payments
  DROP CONSTRAINT IF EXISTS pix_payments_status_check;

-- Add new constraint with 'approved' and 'consumed' states
ALTER TABLE pix_payments
  ADD CONSTRAINT pix_payments_status_check
  CHECK (status IN ('pending', 'approved', 'paid', 'consumed', 'failed', 'expired'));

-- ============================================================================
-- 2. ADD INDEX FOR APPROVED GUEST PAYMENTS
-- ============================================================================

-- Index to quickly find approved payments for a given email (for linking)
CREATE INDEX IF NOT EXISTS idx_pix_payments_approved_by_email
  ON pix_payments(email, status)
  WHERE status = 'approved' AND user_id IS NULL;

-- ============================================================================
-- 3. MIGRATE EXISTING 'paid' RECORDS TO 'consumed'
-- ============================================================================

-- Convert existing 'paid' records to 'consumed' (they were already processed)
-- This ensures backward compatibility
UPDATE pix_payments
SET status = 'consumed'
WHERE status = 'paid'
  AND user_id IS NOT NULL;

-- ============================================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON CONSTRAINT pix_payments_status_check ON pix_payments IS
  'Status flow: pending → approved (MP confirms) → consumed (benefit applied to profile)';

COMMENT ON INDEX idx_pix_payments_approved_by_email IS
  'Fast lookup for approved guest payments when user signs up';
