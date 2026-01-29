-- Adicionar coluna fonte à tabela jurisprudencia_corpus927
ALTER TABLE public.jurisprudencia_corpus927 
ADD COLUMN IF NOT EXISTS fonte TEXT DEFAULT 'cache';