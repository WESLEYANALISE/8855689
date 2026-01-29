-- Recriar tabela de notícias jurídicas com políticas corretas
DROP TABLE IF EXISTS public.noticias_juridicas_cache CASCADE;

CREATE TABLE public.noticias_juridicas_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  link TEXT NOT NULL UNIQUE,
  imagem TEXT,
  fonte TEXT,
  categoria TEXT DEFAULT 'Geral',
  data_publicacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  conteudo_completo TEXT,
  analise_ia TEXT,
  analise_gerada_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.noticias_juridicas_cache ENABLE ROW LEVEL SECURITY;

-- Políticas: público pode ler tudo
CREATE POLICY "Notícias são públicas para leitura"
  ON public.noticias_juridicas_cache
  FOR SELECT
  USING (true);

-- Sistema pode inserir (sem autenticação para edge functions)
CREATE POLICY "Sistema pode inserir notícias"
  ON public.noticias_juridicas_cache
  FOR INSERT
  WITH CHECK (true);

-- Sistema pode atualizar
CREATE POLICY "Sistema pode atualizar notícias"
  ON public.noticias_juridicas_cache
  FOR UPDATE
  USING (true);

-- Índices para performance
CREATE INDEX idx_noticias_data ON public.noticias_juridicas_cache(data_publicacao DESC);
CREATE INDEX idx_noticias_link ON public.noticias_juridicas_cache(link);