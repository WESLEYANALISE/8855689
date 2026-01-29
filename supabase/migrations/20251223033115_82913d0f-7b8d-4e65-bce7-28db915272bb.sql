-- Adicionar coluna ordem_dou à tabela resenha_diaria para manter a ordem correta das leis
ALTER TABLE public.resenha_diaria 
ADD COLUMN IF NOT EXISTS ordem_dou INTEGER;