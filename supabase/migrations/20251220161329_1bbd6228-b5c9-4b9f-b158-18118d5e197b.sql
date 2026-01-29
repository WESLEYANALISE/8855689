-- Tabela para armazenar Informativos de Jurisprudência do STJ
CREATE TABLE public."STJ_INFORMATIVOS" (
  id SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL,
  data_publicacao DATE,
  titulo TEXT,
  processo TEXT,
  ramo_direito TEXT,
  ministro TEXT,
  orgao_julgador TEXT,
  tese TEXT,
  destaque TEXT,
  inteiro_teor TEXT,
  audio_url TEXT,
  tema_repetitivo INTEGER,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(numero, processo)
);

-- Tabela para armazenar Jurisprudência em Teses do STJ
CREATE TABLE public."STJ_TESES" (
  id SERIAL PRIMARY KEY,
  edicao INTEGER NOT NULL,
  numero_tese INTEGER,
  titulo_edicao TEXT,
  ramo_direito TEXT,
  tese TEXT NOT NULL,
  acordaos_vinculados TEXT[],
  data_publicacao DATE,
  ultima_atualizacao DATE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(edicao, numero_tese)
);

-- Tabela para armazenar Recursos Repetitivos/Precedentes Qualificados do STJ
CREATE TABLE public."STJ_REPETITIVOS" (
  id SERIAL PRIMARY KEY,
  tema INTEGER NOT NULL UNIQUE,
  processo TEXT,
  ministro TEXT,
  orgao_julgador TEXT,
  tribunal_origem TEXT,
  ramo_direito TEXT,
  situacao TEXT, -- Afetado, Julgado, Trânsito em Julgado, etc.
  questao_submetida TEXT,
  tese_firmada TEXT,
  data_afetacao DATE,
  data_julgamento DATE,
  suspensos_quantitativo INTEGER,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public."STJ_INFORMATIVOS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."STJ_TESES" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."STJ_REPETITIVOS" ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
CREATE POLICY "STJ Informativos leitura pública" ON public."STJ_INFORMATIVOS"
  FOR SELECT USING (true);

CREATE POLICY "STJ Teses leitura pública" ON public."STJ_TESES"
  FOR SELECT USING (true);

CREATE POLICY "STJ Repetitivos leitura pública" ON public."STJ_REPETITIVOS"
  FOR SELECT USING (true);

-- Políticas de inserção/atualização (service role)
CREATE POLICY "STJ Informativos inserção" ON public."STJ_INFORMATIVOS"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "STJ Informativos atualização" ON public."STJ_INFORMATIVOS"
  FOR UPDATE USING (true);

CREATE POLICY "STJ Teses inserção" ON public."STJ_TESES"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "STJ Teses atualização" ON public."STJ_TESES"
  FOR UPDATE USING (true);

CREATE POLICY "STJ Repetitivos inserção" ON public."STJ_REPETITIVOS"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "STJ Repetitivos atualização" ON public."STJ_REPETITIVOS"
  FOR UPDATE USING (true);

-- Índices para melhor performance
CREATE INDEX idx_stj_informativos_numero ON public."STJ_INFORMATIVOS"(numero DESC);
CREATE INDEX idx_stj_informativos_ramo ON public."STJ_INFORMATIVOS"(ramo_direito);
CREATE INDEX idx_stj_teses_edicao ON public."STJ_TESES"(edicao DESC);
CREATE INDEX idx_stj_teses_ramo ON public."STJ_TESES"(ramo_direito);
CREATE INDEX idx_stj_repetitivos_tema ON public."STJ_REPETITIVOS"(tema);
CREATE INDEX idx_stj_repetitivos_situacao ON public."STJ_REPETITIVOS"(situacao);