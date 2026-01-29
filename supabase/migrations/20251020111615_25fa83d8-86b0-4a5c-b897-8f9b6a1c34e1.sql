-- Adicionar coluna para cache do conteúdo gerado na tabela RESUMO
ALTER TABLE "RESUMO" 
ADD COLUMN IF NOT EXISTS conteudo_gerado JSONB DEFAULT NULL;

-- Adicionar coluna para data de atualização
ALTER TABLE "RESUMO"
ADD COLUMN IF NOT EXISTS ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Criar índice para busca rápida por área e tema
CREATE INDEX IF NOT EXISTS idx_resumo_area_tema 
ON "RESUMO" (area, tema);

-- Criar índice para busca por subtema
CREATE INDEX IF NOT EXISTS idx_resumo_subtema
ON "RESUMO" (subtema);