-- Tabela para cache de jurisprudências estruturadas
CREATE TABLE public.jurisprudencia_estruturada_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisprudencia_id TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  tribunal TEXT,
  estrutura JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca rápida
CREATE INDEX idx_jurisprudencia_cache_id ON public.jurisprudencia_estruturada_cache(jurisprudencia_id);

-- Habilitar RLS
ALTER TABLE public.jurisprudencia_estruturada_cache ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (cache pode ser lido por todos)
CREATE POLICY "Jurisprudência cache é público para leitura"
ON public.jurisprudencia_estruturada_cache
FOR SELECT
USING (true);

-- Política de inserção pública (qualquer um pode adicionar ao cache)
CREATE POLICY "Qualquer um pode inserir no cache"
ON public.jurisprudencia_estruturada_cache
FOR INSERT
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_jurisprudencia_cache_updated_at
BEFORE UPDATE ON public.jurisprudencia_estruturada_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();