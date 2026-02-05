-- Adicionar colunas de conteúdo à tabela oab_etica_temas
ALTER TABLE public.oab_etica_temas 
ADD COLUMN IF NOT EXISTS conteudo_markdown TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS resumo TEXT,
ADD COLUMN IF NOT EXISTS flashcards JSONB,
ADD COLUMN IF NOT EXISTS questoes JSONB,
ADD COLUMN IF NOT EXISTS termos JSONB,
ADD COLUMN IF NOT EXISTS exemplos JSONB;