-- Tabela para cachear tutoriais gerados pela IA
CREATE TABLE public.tutoriais_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  funcionalidade_id TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  descricao_curta TEXT NOT NULL,
  funcionalidades JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  icone TEXT,
  rota TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_tutoriais_cache_categoria ON public.tutoriais_cache(categoria);
CREATE INDEX idx_tutoriais_cache_ordem ON public.tutoriais_cache(ordem);

-- RLS
ALTER TABLE public.tutoriais_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutoriais são públicos para leitura"
ON public.tutoriais_cache
FOR SELECT
USING (true);

CREATE POLICY "Sistema pode inserir tutoriais"
ON public.tutoriais_cache
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar tutoriais"
ON public.tutoriais_cache
FOR UPDATE
USING (true);