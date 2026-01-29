-- Tabela de cache para aulas da jornada jurídica
CREATE TABLE jornada_aulas_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,
  resumo_id BIGINT NOT NULL,
  tema TEXT NOT NULL,
  estrutura_completa JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  visualizacoes INTEGER DEFAULT 0,
  UNIQUE(area, resumo_id)
);

-- RLS
ALTER TABLE jornada_aulas_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read jornada_aulas_cache" 
  ON jornada_aulas_cache FOR SELECT USING (true);

CREATE POLICY "Service role can insert jornada_aulas_cache"
  ON jornada_aulas_cache FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update jornada_aulas_cache"
  ON jornada_aulas_cache FOR UPDATE USING (true);

-- Indexes para busca rápida
CREATE INDEX idx_jornada_aulas_area ON jornada_aulas_cache(area);
CREATE INDEX idx_jornada_aulas_resumo ON jornada_aulas_cache(resumo_id);
CREATE INDEX idx_jornada_aulas_area_resumo ON jornada_aulas_cache(area, resumo_id);