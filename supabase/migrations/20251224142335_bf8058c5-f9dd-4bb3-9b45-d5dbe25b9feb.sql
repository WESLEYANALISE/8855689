-- Adicionar coluna posicao_anterior nas tabelas de ranking existentes
ALTER TABLE ranking_despesas ADD COLUMN IF NOT EXISTS posicao_anterior INTEGER;
ALTER TABLE ranking_proposicoes ADD COLUMN IF NOT EXISTS posicao_anterior INTEGER;
ALTER TABLE ranking_presenca ADD COLUMN IF NOT EXISTS posicao_anterior INTEGER;
ALTER TABLE ranking_comissoes ADD COLUMN IF NOT EXISTS posicao_anterior INTEGER;
ALTER TABLE ranking_discursos ADD COLUMN IF NOT EXISTS posicao_anterior INTEGER;
ALTER TABLE ranking_frentes ADD COLUMN IF NOT EXISTS posicao_anterior INTEGER;
ALTER TABLE ranking_senadores_despesas ADD COLUMN IF NOT EXISTS posicao_anterior INTEGER;
ALTER TABLE ranking_senadores_materias ADD COLUMN IF NOT EXISTS posicao_anterior INTEGER;
ALTER TABLE ranking_senadores_discursos ADD COLUMN IF NOT EXISTS posicao_anterior INTEGER;
ALTER TABLE ranking_senadores_comissoes ADD COLUMN IF NOT EXISTS posicao_anterior INTEGER;
ALTER TABLE ranking_senadores_votacoes ADD COLUMN IF NOT EXISTS posicao_anterior INTEGER;

-- Criar tabela para ranking por mandato (gastos acumulados desde fevereiro/2023)
CREATE TABLE IF NOT EXISTS ranking_despesas_mandato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deputado_id INTEGER NOT NULL,
  nome TEXT NOT NULL,
  partido TEXT,
  uf TEXT,
  foto_url TEXT,
  total_gasto NUMERIC DEFAULT 0,
  mandato_inicio DATE DEFAULT '2023-02-01',
  posicao INTEGER,
  posicao_anterior INTEGER,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ranking_despesas_mandato_posicao ON ranking_despesas_mandato(posicao);
CREATE INDEX IF NOT EXISTS idx_ranking_despesas_mandato_deputado ON ranking_despesas_mandato(deputado_id);

-- Habilitar RLS
ALTER TABLE ranking_despesas_mandato ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Ranking mandato é público para leitura"
ON ranking_despesas_mandato
FOR SELECT
USING (true);