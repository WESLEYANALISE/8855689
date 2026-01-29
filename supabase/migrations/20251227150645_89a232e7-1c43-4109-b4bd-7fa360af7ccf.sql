-- Adicionar coluna tema_atual para suportar botões interativos pós-resposta
ALTER TABLE public.evelyn_conversas 
ADD COLUMN IF NOT EXISTS tema_atual TEXT;