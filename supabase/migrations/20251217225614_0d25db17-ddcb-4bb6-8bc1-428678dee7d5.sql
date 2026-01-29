-- Adicionar colunas faltantes em ranking_frentes
ALTER TABLE ranking_frentes ADD COLUMN IF NOT EXISTS posicao integer;

-- Adicionar colunas faltantes em ranking_discursos
ALTER TABLE ranking_discursos ADD COLUMN IF NOT EXISTS posicao integer;
ALTER TABLE ranking_discursos ADD COLUMN IF NOT EXISTS ano integer;
