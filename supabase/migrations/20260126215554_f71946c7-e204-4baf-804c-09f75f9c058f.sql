-- Tabela para rate limiting global de APIs
CREATE TABLE IF NOT EXISTS public.api_rate_limit_tracker (
  id TEXT PRIMARY KEY DEFAULT 'gemini_global',
  ultima_chamada TIMESTAMPTZ DEFAULT now(),
  chamadas_ultimo_minuto INTEGER DEFAULT 0,
  chamadas_ultima_hora INTEGER DEFAULT 0,
  reset_minuto TIMESTAMPTZ DEFAULT now(),
  reset_hora TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir registro inicial para Gemini
INSERT INTO public.api_rate_limit_tracker (id, ultima_chamada, chamadas_ultimo_minuto, chamadas_ultima_hora)
VALUES ('gemini_global', now(), 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_api_rate_limit_tracker_id ON public.api_rate_limit_tracker(id);

-- RLS: Permitir acesso via service role
ALTER TABLE public.api_rate_limit_tracker ENABLE ROW LEVEL SECURITY;

-- Política para service role (edge functions)
CREATE POLICY "Service role full access" ON public.api_rate_limit_tracker
  FOR ALL
  USING (true)
  WITH CHECK (true);