-- Tabela para armazenar itens dos feeds RSS do STJ
CREATE TABLE public.stj_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_tipo TEXT NOT NULL CHECK (feed_tipo IN ('noticias', 'teses', 'informativos', 'pesquisa_pronta')),
  titulo TEXT NOT NULL,
  link TEXT NOT NULL UNIQUE,
  descricao TEXT,
  data_publicacao TIMESTAMP WITH TIME ZONE,
  conteudo_completo TEXT,
  categoria TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_stj_feeds_tipo ON public.stj_feeds(feed_tipo);
CREATE INDEX idx_stj_feeds_data ON public.stj_feeds(data_publicacao DESC);
CREATE INDEX idx_stj_feeds_created ON public.stj_feeds(created_at DESC);

-- RLS
ALTER TABLE public.stj_feeds ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Leitura pública dos feeds STJ"
ON public.stj_feeds
FOR SELECT
USING (true);

-- Política de inserção/atualização apenas para service role
CREATE POLICY "Service role pode inserir feeds STJ"
ON public.stj_feeds
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role pode atualizar feeds STJ"
ON public.stj_feeds
FOR UPDATE
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_stj_feeds_updated_at
  BEFORE UPDATE ON public.stj_feeds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();