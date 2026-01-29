-- Tabela para cache de imagens convertidas para WebP
CREATE TABLE IF NOT EXISTS public.cache_imagens_webp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_original TEXT NOT NULL UNIQUE,
  url_webp TEXT NOT NULL,
  tamanho_original INTEGER,
  tamanho_webp INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca rápida por URL original
CREATE INDEX IF NOT EXISTS idx_cache_imagens_webp_url ON public.cache_imagens_webp(url_original);

-- Habilitar RLS
ALTER TABLE public.cache_imagens_webp ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública (imagens são públicas)
CREATE POLICY "Imagens WebP são públicas para leitura"
  ON public.cache_imagens_webp
  FOR SELECT
  USING (true);

-- Adicionar coluna imagem_url_webp na tabela de notícias políticas
ALTER TABLE public.noticias_politicas_cache 
ADD COLUMN IF NOT EXISTS imagem_url_webp TEXT;