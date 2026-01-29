-- Adicionar novos campos à tabela SIMULACAO_CASOS para múltipla escolha
ALTER TABLE "SIMULACAO_CASOS"
ADD COLUMN IF NOT EXISTS questoes_alternativas jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS refutacoes_por_opcao jsonb DEFAULT '[]'::jsonb;

-- Adicionar comentários para documentação
COMMENT ON COLUMN "SIMULACAO_CASOS".questoes_alternativas IS 'Array de questões com 3 alternativas cada. Estrutura: [{pergunta, opcoes: [{texto, correta, pontos, fundamentacao}], contexto, fase}]';
COMMENT ON COLUMN "SIMULACAO_CASOS".refutacoes_por_opcao IS 'Refutações da parte contrária para cada opção escolhida. Estrutura: [{questao_id, opcao_id, refutacao_se_correta, refutacao_se_errada}]';

-- Atualizar comentário da coluna modo
COMMENT ON COLUMN "SIMULACAO_CASOS".modo IS 'Modo do caso: advogado ou juiz';

-- Garantir que a tabela SIMULACAO_PARTIDAS_JUIZ existe e tem os campos necessários
-- (já existe, apenas validar estrutura)

-- Adicionar índices para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_simulacao_casos_area_tema ON "SIMULACAO_CASOS"(area, tema);
CREATE INDEX IF NOT EXISTS idx_simulacao_casos_modo ON "SIMULACAO_CASOS"(modo);
CREATE INDEX IF NOT EXISTS idx_simulacao_partidas_user_caso ON "SIMULACAO_PARTIDAS"(user_id, caso_id);
CREATE INDEX IF NOT EXISTS idx_simulacao_partidas_juiz_user_caso ON "SIMULACAO_PARTIDAS_JUIZ"(user_id, caso_id);