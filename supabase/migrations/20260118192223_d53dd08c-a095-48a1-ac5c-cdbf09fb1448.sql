-- Tabela principal para armazenar conhecimento extraído de PDFs
CREATE TABLE public.oab_base_conhecimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,
  pagina INTEGER NOT NULL,
  conteudo TEXT NOT NULL,
  resumo_chunk TEXT,
  tokens_estimados INTEGER DEFAULT 0,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(area, pagina)
);

-- Índice para busca por área
CREATE INDEX idx_oab_base_conhecimento_area ON public.oab_base_conhecimento(area);

-- Tabela de controle de status por área
CREATE TABLE public.oab_base_conhecimento_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT UNIQUE NOT NULL,
  pdf_url TEXT,
  status TEXT DEFAULT 'pendente',
  total_paginas INTEGER DEFAULT 0,
  total_chunks INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_oab_base_conhecimento_updated_at
  BEFORE UPDATE ON public.oab_base_conhecimento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oab_base_conhecimento_areas_updated_at
  BEFORE UPDATE ON public.oab_base_conhecimento_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.oab_base_conhecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oab_base_conhecimento_areas ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de leitura
CREATE POLICY "Permitir leitura pública da base de conhecimento"
  ON public.oab_base_conhecimento FOR SELECT
  USING (true);

CREATE POLICY "Permitir leitura pública das áreas"
  ON public.oab_base_conhecimento_areas FOR SELECT
  USING (true);

-- Políticas de escrita para service role (edge functions)
CREATE POLICY "Service role pode inserir conhecimento"
  ON public.oab_base_conhecimento FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role pode atualizar conhecimento"
  ON public.oab_base_conhecimento FOR UPDATE
  USING (true);

CREATE POLICY "Service role pode deletar conhecimento"
  ON public.oab_base_conhecimento FOR DELETE
  USING (true);

CREATE POLICY "Service role pode inserir áreas"
  ON public.oab_base_conhecimento_areas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role pode atualizar áreas"
  ON public.oab_base_conhecimento_areas FOR UPDATE
  USING (true);

-- Seed com as 17 áreas da OAB
INSERT INTO public.oab_base_conhecimento_areas (area) VALUES
  ('Direito Constitucional'),
  ('Direito Administrativo'),
  ('Direito Civil'),
  ('Direito Processual Civil'),
  ('Direito Penal'),
  ('Direito Processual Penal'),
  ('Direito do Trabalho'),
  ('Direito Processual do Trabalho'),
  ('Direito Tributário'),
  ('Direito Empresarial'),
  ('Direito do Consumidor'),
  ('Direito Ambiental'),
  ('Direito Internacional'),
  ('Direitos Humanos'),
  ('Filosofia do Direito'),
  ('Ética Profissional'),
  ('Estatuto da Advocacia e OAB')
ON CONFLICT (area) DO NOTHING;