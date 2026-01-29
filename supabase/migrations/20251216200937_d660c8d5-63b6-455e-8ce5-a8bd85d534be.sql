-- Adicionar coluna de relevância à tabela de cache de notícias
ALTER TABLE public.noticias_juridicas_cache 
ADD COLUMN IF NOT EXISTS relevancia INTEGER DEFAULT 50;

-- Criar índice para ordenação por relevância
CREATE INDEX IF NOT EXISTS idx_noticias_relevancia ON public.noticias_juridicas_cache(relevancia DESC);

-- Criar índice para busca por data
CREATE INDEX IF NOT EXISTS idx_noticias_data_publicacao ON public.noticias_juridicas_cache(data_publicacao DESC);