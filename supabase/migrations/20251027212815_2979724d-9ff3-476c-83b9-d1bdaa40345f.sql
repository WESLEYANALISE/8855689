-- Adicionar coluna de votações ao cache de proposições
ALTER TABLE cache_proposicoes_recentes 
ADD COLUMN IF NOT EXISTS votacoes jsonb DEFAULT '[]'::jsonb;

-- Criar índice para busca mais rápida
CREATE INDEX IF NOT EXISTS idx_cache_proposicoes_id 
ON cache_proposicoes_recentes(id_proposicao);

-- Adicionar comentário
COMMENT ON COLUMN cache_proposicoes_recentes.votacoes IS 'Votações da proposição com estatísticas de votos';