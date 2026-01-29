-- Adicionar coluna pairing_code na tabela evelyn_config
ALTER TABLE public.evelyn_config 
ADD COLUMN IF NOT EXISTS pairing_code TEXT;