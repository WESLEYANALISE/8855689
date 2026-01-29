-- Adicionar colunas para armazenar os timepoints de sincronização de áudio
ALTER TABLE public."RESUMO" 
ADD COLUMN IF NOT EXISTS timepoints_resumo JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS timepoints_exemplos JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS timepoints_termos JSONB DEFAULT NULL;