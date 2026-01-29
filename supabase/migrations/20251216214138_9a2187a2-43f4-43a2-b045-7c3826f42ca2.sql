-- Tabela para cachear a lista de obras de cada filósofo
CREATE TABLE IF NOT EXISTS public.obras_filosofos_cache (
  id SERIAL PRIMARY KEY,
  filosofo TEXT NOT NULL UNIQUE,
  obras JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.obras_filosofos_cache ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Leitura pública de obras cache"
ON public.obras_filosofos_cache
FOR SELECT
USING (true);

-- Política para service role inserir/atualizar
CREATE POLICY "Service role pode gerenciar obras cache"
ON public.obras_filosofos_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- Índice para busca por filósofo
CREATE INDEX IF NOT EXISTS idx_obras_filosofos_cache_filosofo ON public.obras_filosofos_cache(filosofo);