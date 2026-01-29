-- Tabela para cache de jurisprudência do Corpus 927
CREATE TABLE public.jurisprudencia_corpus927 (
  id BIGSERIAL PRIMARY KEY,
  codigo_slug TEXT NOT NULL,
  numero_artigo TEXT NOT NULL,
  titulo_artigo TEXT,
  sumulas_vinculantes TEXT,
  sumulas_stj TEXT,
  recursos_repetitivos TEXT,
  repercussao_geral TEXT,
  posicionamentos_agrupados TEXT,
  posicionamentos_isolados TEXT,
  jurisprudencia_em_tese TEXT,
  raw_content TEXT,
  fonte_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(codigo_slug, numero_artigo)
);

-- Índices para busca rápida
CREATE INDEX idx_jurisprudencia_corpus927_codigo ON public.jurisprudencia_corpus927(codigo_slug);
CREATE INDEX idx_jurisprudencia_corpus927_artigo ON public.jurisprudencia_corpus927(numero_artigo);

-- RLS
ALTER TABLE public.jurisprudencia_corpus927 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jurisprudência é pública para leitura"
ON public.jurisprudencia_corpus927
FOR SELECT
USING (true);

CREATE POLICY "Sistema pode inserir jurisprudência"
ON public.jurisprudencia_corpus927
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar jurisprudência"
ON public.jurisprudencia_corpus927
FOR UPDATE
USING (true);