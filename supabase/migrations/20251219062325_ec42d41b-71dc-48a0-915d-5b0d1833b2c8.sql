-- Criar tabela de cache para explicações de jurisprudência
CREATE TABLE public.jurisprudencia_explicacoes_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisprudencia_identificador TEXT NOT NULL,
  modo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  explicacao TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(jurisprudencia_identificador, modo)
);

-- Índice para busca rápida
CREATE INDEX idx_jurisprudencia_cache_lookup ON public.jurisprudencia_explicacoes_cache(jurisprudencia_identificador, modo);

-- Habilitar RLS
ALTER TABLE public.jurisprudencia_explicacoes_cache ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (cache pode ser lido por todos)
CREATE POLICY "Cache de explicações é público para leitura"
ON public.jurisprudencia_explicacoes_cache
FOR SELECT
USING (true);

-- Política de inserção (permitir inserção via service role)
CREATE POLICY "Permitir inserção de cache"
ON public.jurisprudencia_explicacoes_cache
FOR INSERT
WITH CHECK (true);

-- Política de atualização
CREATE POLICY "Permitir atualização de cache"
ON public.jurisprudencia_explicacoes_cache
FOR UPDATE
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_jurisprudencia_cache_updated_at
BEFORE UPDATE ON public.jurisprudencia_explicacoes_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();