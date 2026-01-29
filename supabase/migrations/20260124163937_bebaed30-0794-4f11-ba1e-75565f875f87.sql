-- Adicionar campo de progresso para rastreamento em tempo real
ALTER TABLE oab_trilhas_topicos 
ADD COLUMN IF NOT EXISTS progresso INTEGER DEFAULT 0;

-- Índice para consultas de status
CREATE INDEX IF NOT EXISTS idx_oab_trilhas_topicos_status_materia 
ON oab_trilhas_topicos(materia_id, status);