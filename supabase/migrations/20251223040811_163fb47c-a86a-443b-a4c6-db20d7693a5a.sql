-- Adicionar coluna imagem_webp na tabela noticias_juridicas_cache
ALTER TABLE public.noticias_juridicas_cache 
ADD COLUMN IF NOT EXISTS imagem_webp TEXT;

-- Criar índice para buscar notícias sem imagem webp
CREATE INDEX IF NOT EXISTS idx_noticias_juridicas_imagem_pendente 
ON public.noticias_juridicas_cache (imagem) 
WHERE imagem IS NOT NULL AND imagem_webp IS NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.noticias_juridicas_cache.imagem_webp IS 'URL da imagem convertida para WebP otimizada';