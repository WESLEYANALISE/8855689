-- Adicionar coluna para versão da capa
ALTER TABLE oab_trilhas_topicos 
ADD COLUMN IF NOT EXISTS capa_versao INTEGER DEFAULT 1;

-- Comentário descritivo
COMMENT ON COLUMN oab_trilhas_topicos.capa_versao IS 'Versão da capa: 1=genérica antiga, 2=temática nova';

-- Índice para buscar rapidamente por versão
CREATE INDEX IF NOT EXISTS idx_oab_trilhas_topicos_capa_versao ON oab_trilhas_topicos(materia_id, capa_versao);