-- Create table for daily news summaries with audio narration
CREATE TABLE public.resumos_diarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('politica', 'juridica')),
  data DATE NOT NULL,
  noticias_ids JSONB DEFAULT '[]'::jsonb,
  texto_resumo TEXT,
  slides JSONB DEFAULT '[]'::jsonb,
  url_audio TEXT,
  total_noticias INTEGER DEFAULT 0,
  hora_corte TIME DEFAULT '23:00:00',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tipo, data)
);

-- Enable RLS
ALTER TABLE public.resumos_diarios ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Resumos diários são públicos para leitura"
ON public.resumos_diarios
FOR SELECT
USING (true);

-- System can insert/update
CREATE POLICY "Sistema pode inserir resumos diários"
ON public.resumos_diarios
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar resumos diários"
ON public.resumos_diarios
FOR UPDATE
USING (true);

-- Index for fast lookups
CREATE INDEX idx_resumos_diarios_tipo_data ON public.resumos_diarios(tipo, data DESC);