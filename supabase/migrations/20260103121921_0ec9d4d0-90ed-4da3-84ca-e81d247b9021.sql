-- Add expiration and payment tracking columns to subscriptions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pix',
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;

-- Create index for faster expiration checks
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiration ON subscriptions(user_id, expiration_date) WHERE status = 'authorized';