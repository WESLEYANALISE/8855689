-- Add exemplo_pratico column to cache_definicoes_termos
ALTER TABLE public.cache_definicoes_termos
ADD COLUMN IF NOT EXISTS exemplo_pratico TEXT;