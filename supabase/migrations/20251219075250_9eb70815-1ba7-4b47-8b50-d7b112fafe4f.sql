-- Adicionar colunas para cache de flashcards e questões gerados para jurisprudências
ALTER TABLE public.jurisprudencia_estruturada_cache
ADD COLUMN IF NOT EXISTS flashcards_gerados JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS questoes_geradas JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS flashcards_gerado_em TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS questoes_gerado_em TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Índice para busca rápida de jurisprudências com flashcards/questões
CREATE INDEX IF NOT EXISTS idx_jurisprudencia_cache_flashcards ON public.jurisprudencia_estruturada_cache(jurisprudencia_id) WHERE flashcards_gerados IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jurisprudencia_cache_questoes ON public.jurisprudencia_estruturada_cache(jurisprudencia_id) WHERE questoes_geradas IS NOT NULL;