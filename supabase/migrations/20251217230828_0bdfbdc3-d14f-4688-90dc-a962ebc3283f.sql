-- Tabela de cache para jurisprudências
CREATE TABLE IF NOT EXISTS public.jurisprudencias_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  termo TEXT NOT NULL,
  tribunal TEXT NOT NULL,
  dados JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_jurisprudencias_cache_key ON public.jurisprudencias_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_jurisprudencias_cache_expira ON public.jurisprudencias_cache(expira_em);
CREATE INDEX IF NOT EXISTS idx_jurisprudencias_cache_tribunal ON public.jurisprudencias_cache(tribunal);

-- RLS
ALTER TABLE public.jurisprudencias_cache ENABLE ROW LEVEL SECURITY;

-- Política pública para leitura (cache é público)
CREATE POLICY "Jurisprudencias cache é público para leitura"
ON public.jurisprudencias_cache
FOR SELECT
USING (true);

-- Política para service role inserir/atualizar
CREATE POLICY "Service role pode gerenciar cache"
ON public.jurisprudencias_cache
FOR ALL
USING (true)
WITH CHECK (true);