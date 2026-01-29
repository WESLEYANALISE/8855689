-- Adicionar novos campos à tabela cache_proposicoes_recentes
ALTER TABLE cache_proposicoes_recentes 
ADD COLUMN IF NOT EXISTS ordem_cache INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS autores_completos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS situacao TEXT,
ADD COLUMN IF NOT EXISTS tema TEXT,
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS resumo_executivo_ia TEXT,
ADD COLUMN IF NOT EXISTS quantidade_votacoes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS orgao_tramitacao TEXT;

-- Criar índice para ordenação por updated_at
CREATE INDEX IF NOT EXISTS idx_cache_proposicoes_updated_at ON cache_proposicoes_recentes(updated_at DESC);

-- Criar índice para ordem_cache
CREATE INDEX IF NOT EXISTS idx_cache_proposicoes_ordem ON cache_proposicoes_recentes(ordem_cache DESC);

-- Criar índice para data_apresentacao
CREATE INDEX IF NOT EXISTS idx_cache_proposicoes_data ON cache_proposicoes_recentes(data_apresentacao DESC);

-- Comentário sobre a estratégia FIFO
COMMENT ON COLUMN cache_proposicoes_recentes.ordem_cache IS 'Ordem de inserção para sistema FIFO - mantém apenas as 100 mais recentes';