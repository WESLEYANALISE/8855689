-- Criar tabela de notícias de concursos
CREATE TABLE IF NOT EXISTS public.noticias_concursos_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  link TEXT NOT NULL UNIQUE,
  imagem TEXT,
  fonte TEXT,
  categoria TEXT DEFAULT 'Concurso',
  data_publicacao TIMESTAMPTZ,
  conteudo_completo TEXT,
  conteudo_formatado TEXT,
  analise_ia TEXT,
  analise_gerada_em TIMESTAMPTZ,
  termos_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.noticias_concursos_cache ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (notícias são públicas)
CREATE POLICY "Notícias de concursos são públicas para leitura"
  ON public.noticias_concursos_cache
  FOR SELECT
  USING (true);

-- Índice para busca por data
CREATE INDEX IF NOT EXISTS idx_noticias_concursos_data ON public.noticias_concursos_cache(data_publicacao DESC);

-- Índice para busca por link (evitar duplicatas)
CREATE INDEX IF NOT EXISTS idx_noticias_concursos_link ON public.noticias_concursos_cache(link);