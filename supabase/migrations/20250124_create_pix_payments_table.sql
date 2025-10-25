-- Create PIX payments table
CREATE TABLE IF NOT EXISTS pix_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_intent_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  qr_code TEXT,
  pix_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_pix_payments_user_id ON pix_payments(user_id);
CREATE INDEX idx_pix_payments_payment_intent_id ON pix_payments(payment_intent_id);
CREATE INDEX idx_pix_payments_status ON pix_payments(status);
CREATE INDEX idx_pix_payments_created_at ON pix_payments(created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE pix_payments ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own PIX payments
CREATE POLICY "Users can view own pix payments" ON pix_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for service role to manage all PIX payments
CREATE POLICY "Service role can manage all pix payments" ON pix_payments
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pix_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_pix_payments_updated_at_trigger
  BEFORE UPDATE ON pix_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_pix_payments_updated_at();

-- Function to automatically expire old pending PIX payments
CREATE OR REPLACE FUNCTION expire_old_pix_payments()
RETURNS void AS $$
BEGIN
  UPDATE pix_payments
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to expire old payments (requires pg_cron extension)
-- SELECT cron.schedule('expire-pix-payments', '*/5 * * * *', 'SELECT expire_old_pix_payments();');