-- Adicionar coluna mp_payment_id que estava faltando
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;

-- Atualizar a assinatura pendente do usuário que já pagou
UPDATE subscriptions 
SET 
  status = 'authorized',
  mp_payment_id = '140490801690',
  expiration_date = '2026-02-02T12:30:34.742Z'::timestamptz,
  payment_method = 'pix',
  last_payment_date = NOW(),
  updated_at = NOW()
WHERE user_id = '372b4f7f-9450-4fa4-83ee-84988c2586eb'
  AND status = 'pending';