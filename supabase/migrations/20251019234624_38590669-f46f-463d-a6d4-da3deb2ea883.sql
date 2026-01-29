-- Adicionar novas colunas na tabela SIMULACAO_CASOS para suportar o novo sistema de turnos
ALTER TABLE "SIMULACAO_CASOS"
ADD COLUMN IF NOT EXISTS estrutura_audiencia JSONB DEFAULT '{"turnos": []}'::jsonb,
ADD COLUMN IF NOT EXISTS artigos_ids BIGINT[],
ADD COLUMN IF NOT EXISTS tabela_artigos TEXT;

-- Criar índice para melhorar performance nas buscas por artigos
CREATE INDEX IF NOT EXISTS idx_simulacao_casos_area_tema 
ON "SIMULACAO_CASOS" (area, tema);

-- Adicionar comentários explicativos
COMMENT ON COLUMN "SIMULACAO_CASOS".estrutura_audiencia IS 'Estrutura de turnos da audiência com perguntas, respostas e provas';
COMMENT ON COLUMN "SIMULACAO_CASOS".artigos_ids IS 'IDs dos artigos relacionados ao caso';
COMMENT ON COLUMN "SIMULACAO_CASOS".tabela_artigos IS 'Nome da tabela de onde os artigos foram extraídos (ex: CP - Código Penal)';