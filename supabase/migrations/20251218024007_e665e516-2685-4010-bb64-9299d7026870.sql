-- Adicionar coluna termos à tabela resumos_diarios
ALTER TABLE public.resumos_diarios 
ADD COLUMN IF NOT EXISTS termos JSONB DEFAULT '[]'::jsonb;