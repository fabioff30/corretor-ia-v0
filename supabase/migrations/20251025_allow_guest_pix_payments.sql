-- Migration: Allow PIX payments without user login
-- This enables the new payment flow where users can pay first and link to account later

-- 1. Make user_id nullable to allow guest payments
ALTER TABLE pix_payments
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add email field for guest payments
ALTER TABLE pix_payments
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Add field to track when payment was linked to user account
ALTER TABLE pix_payments
  ADD COLUMN IF NOT EXISTS linked_to_user_at TIMESTAMPTZ;

-- 4. Add constraint: either user_id OR email must be present
ALTER TABLE pix_payments
  ADD CONSTRAINT pix_payments_user_or_email_check
  CHECK (user_id IS NOT NULL OR email IS NOT NULL);

-- 5. Create index on email for faster lookups when linking payments
CREATE INDEX IF NOT EXISTS idx_pix_payments_email ON pix_payments(email) WHERE email IS NOT NULL;

-- 6. Create index on status for pending guest payments
CREATE INDEX IF NOT EXISTS idx_pix_payments_pending_guest ON pix_payments(status, email)
  WHERE user_id IS NULL AND email IS NOT NULL;

-- 7. Update RLS policy to allow viewing guest payments by email
-- (Service role will handle this, but we add for completeness)
CREATE POLICY "Users can view pix payments by email" ON pix_payments
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    (user_id IS NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- 8. Add comment for documentation
COMMENT ON COLUMN pix_payments.email IS 'Email for guest payments (when user_id is NULL). Used to link payment to user account after registration/login.';
COMMENT ON COLUMN pix_payments.linked_to_user_at IS 'Timestamp when a guest payment was linked to a user account.';
