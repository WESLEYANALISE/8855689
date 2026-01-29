-- Tabela para posts jurídicos estilo Instagram
CREATE TABLE public.posts_juridicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artigo_numero TEXT NOT NULL,
  lei_tabela TEXT NOT NULL,
  titulo TEXT NOT NULL,
  roteiro JSONB NOT NULL DEFAULT '[]'::jsonb,
  imagens JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_publicacao DATE,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'pronto', 'publicado')),
  visualizacoes INTEGER NOT NULL DEFAULT 0,
  curtidas INTEGER NOT NULL DEFAULT 0,
  texto_artigo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_posts_juridicos_status ON public.posts_juridicos(status);
CREATE INDEX idx_posts_juridicos_data_publicacao ON public.posts_juridicos(data_publicacao);
CREATE INDEX idx_posts_juridicos_lei_tabela ON public.posts_juridicos(lei_tabela);

-- Enable RLS
ALTER TABLE public.posts_juridicos ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública (posts publicados)
CREATE POLICY "Posts publicados são visíveis para todos"
ON public.posts_juridicos
FOR SELECT
USING (status = 'publicado');

-- Policy para inserção e edição (sem autenticação para admin local)
CREATE POLICY "Permitir inserção de posts"
ON public.posts_juridicos
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir atualização de posts"
ON public.posts_juridicos
FOR UPDATE
USING (true);

CREATE POLICY "Permitir deleção de posts"
ON public.posts_juridicos
FOR DELETE
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_posts_juridicos_updated_at
BEFORE UPDATE ON public.posts_juridicos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();