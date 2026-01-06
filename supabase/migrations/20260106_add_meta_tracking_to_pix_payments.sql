-- Add Meta CAPI tracking columns to pix_payments table
-- Used for server-side tracking via Meta Conversions API

-- Add fbc column (Facebook Click ID from _fbc cookie)
ALTER TABLE pix_payments
ADD COLUMN IF NOT EXISTS fbc TEXT;

-- Add fbp column (Facebook Browser ID from _fbp cookie)
ALTER TABLE pix_payments
ADD COLUMN IF NOT EXISTS fbp TEXT;

-- Add event_id column (for deduplication between Pixel and CAPI)
ALTER TABLE pix_payments
ADD COLUMN IF NOT EXISTS event_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN pix_payments.fbc IS 'Facebook Click ID (_fbc cookie) for CAPI Event Match Quality';
COMMENT ON COLUMN pix_payments.fbp IS 'Facebook Browser ID (_fbp cookie) for CAPI Event Match Quality';
COMMENT ON COLUMN pix_payments.event_id IS 'Event ID for deduplication between client-side Pixel and server-side CAPI';
