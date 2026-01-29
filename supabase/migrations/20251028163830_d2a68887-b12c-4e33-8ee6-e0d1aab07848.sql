-- Fase 1: Tabela para cache de candidatos do TSE
CREATE TABLE IF NOT EXISTS cache_candidatos_tse (
  id BIGSERIAL PRIMARY KEY,
  ano INTEGER NOT NULL,
  uf TEXT NOT NULL,
  sq_candidato BIGINT NOT NULL,
  dados JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidato_ano_uf ON cache_candidatos_tse(ano, uf);
CREATE INDEX IF NOT EXISTS idx_candidato_sq ON cache_candidatos_tse(sq_candidato);
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidato_unique ON cache_candidatos_tse(ano, sq_candidato);

-- Fase 2: Tabela para resultados de eleições
CREATE TABLE IF NOT EXISTS resultados_eleicoes (
  id BIGSERIAL PRIMARY KEY,
  ano INTEGER NOT NULL,
  turno INTEGER NOT NULL DEFAULT 1,
  uf TEXT NOT NULL,
  cargo TEXT NOT NULL,
  sq_candidato BIGINT NOT NULL,
  nome_candidato TEXT NOT NULL,
  numero TEXT NOT NULL,
  partido TEXT NOT NULL,
  votos BIGINT NOT NULL,
  percentual_votos NUMERIC(5,2),
  situacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resultado_ano_uf_cargo ON resultados_eleicoes(ano, uf, cargo);
CREATE INDEX IF NOT EXISTS idx_resultado_sq_candidato ON resultados_eleicoes(sq_candidato);

-- Fase 4: Tabela para perfil do eleitorado
CREATE TABLE IF NOT EXISTS eleitorado_perfil (
  id BIGSERIAL PRIMARY KEY,
  uf TEXT NOT NULL,
  municipio TEXT,
  genero TEXT,
  faixa_etaria TEXT,
  escolaridade TEXT,
  quantidade BIGINT NOT NULL,
  ano_referencia INTEGER DEFAULT 2024,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eleitorado_uf ON eleitorado_perfil(uf);
CREATE INDEX IF NOT EXISTS idx_eleitorado_ano ON eleitorado_perfil(ano_referencia);

-- RLS Policies: Público para leitura, sistema para escrita
ALTER TABLE cache_candidatos_tse ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_eleicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleitorado_perfil ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
CREATE POLICY "Cache de candidatos é público para leitura"
  ON cache_candidatos_tse FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Resultados são públicos para leitura"
  ON resultados_eleicoes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Eleitorado é público para leitura"
  ON eleitorado_perfil FOR SELECT
  TO public
  USING (true);

-- Políticas de escrita para o sistema
CREATE POLICY "Sistema pode gerenciar cache de candidatos"
  ON cache_candidatos_tse FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Sistema pode gerenciar resultados"
  ON resultados_eleicoes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Sistema pode gerenciar eleitorado"
  ON eleitorado_perfil FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);