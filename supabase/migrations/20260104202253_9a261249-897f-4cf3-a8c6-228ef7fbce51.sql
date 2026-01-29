-- Criar tabela de cache para locais jurídicos
CREATE TABLE public.locais_juridicos_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  raio INTEGER NOT NULL,
  cidade TEXT,
  dados JSONB NOT NULL,
  total_resultados INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expira_em TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Indexes para buscas rápidas
CREATE INDEX idx_locais_cache_key ON public.locais_juridicos_cache(cache_key);
CREATE INDEX idx_locais_cache_tipo ON public.locais_juridicos_cache(tipo);
CREATE INDEX idx_locais_cache_expira ON public.locais_juridicos_cache(expira_em);

-- RLS
ALTER TABLE public.locais_juridicos_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cache público para leitura"
  ON public.locais_juridicos_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role pode gerenciar cache"
  ON public.locais_juridicos_cache FOR ALL
  TO service_role
  USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_locais_juridicos_cache_updated_at
  BEFORE UPDATE ON public.locais_juridicos_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();