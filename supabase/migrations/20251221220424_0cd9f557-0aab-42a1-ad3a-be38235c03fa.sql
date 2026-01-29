-- Tabela para cache das estatísticas do CNJ
CREATE TABLE public.cache_estatisticas_cnj (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL, -- 'kpis', 'tribunais', 'assuntos', 'classes', 'tempos', etc.
  periodo TEXT DEFAULT 'ano',
  ramo_justica TEXT DEFAULT 'todos',
  dados JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para buscas rápidas
CREATE INDEX idx_cache_cnj_tipo_periodo ON public.cache_estatisticas_cnj(tipo, periodo);
CREATE INDEX idx_cache_cnj_updated ON public.cache_estatisticas_cnj(updated_at);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cache_estatisticas_cnj_updated_at
  BEFORE UPDATE ON public.cache_estatisticas_cnj
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.cache_estatisticas_cnj ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (dados são públicos)
CREATE POLICY "Cache CNJ leitura publica" 
  ON public.cache_estatisticas_cnj 
  FOR SELECT 
  USING (true);

-- Política para inserção/atualização via service role apenas
CREATE POLICY "Cache CNJ escrita service role" 
  ON public.cache_estatisticas_cnj 
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');