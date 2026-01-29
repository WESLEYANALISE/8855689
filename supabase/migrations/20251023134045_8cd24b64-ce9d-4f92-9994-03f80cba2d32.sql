-- Criar tabela para cache de notícias jurídicas com análise IA
CREATE TABLE IF NOT EXISTS public.noticias_juridicas_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  link text NOT NULL UNIQUE,
  imagem text,
  fonte text,
  categoria text,
  data_publicacao timestamp with time zone,
  conteudo_completo text,
  analise_ia text,
  analise_gerada_em timestamp with time zone,
  visualizada boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_noticias_cache_data ON public.noticias_juridicas_cache(data_publicacao DESC);
CREATE INDEX IF NOT EXISTS idx_noticias_cache_link ON public.noticias_juridicas_cache(link);
CREATE INDEX IF NOT EXISTS idx_noticias_cache_visualizada ON public.noticias_juridicas_cache(visualizada);

-- Habilitar RLS
ALTER TABLE public.noticias_juridicas_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Notícias são públicas para leitura
CREATE POLICY "Notícias cache são públicas para leitura"
ON public.noticias_juridicas_cache
FOR SELECT
USING (true);

-- Policy: Sistema pode gerenciar notícias
CREATE POLICY "Sistema pode gerenciar notícias cache"
ON public.noticias_juridicas_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_noticias_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_noticias_cache_timestamp
BEFORE UPDATE ON public.noticias_juridicas_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_noticias_cache_updated_at();