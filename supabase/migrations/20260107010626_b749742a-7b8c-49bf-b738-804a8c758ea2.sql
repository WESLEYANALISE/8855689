-- Adicionar coluna para controlar se já notificou sobre expiração
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS notificado_expiracao boolean DEFAULT false;