-- Adicionar colunas faltantes na tabela SIMULACAO_CASOS
ALTER TABLE public."SIMULACAO_CASOS"
ADD COLUMN IF NOT EXISTS genero_advogado_reu text,
ADD COLUMN IF NOT EXISTS tipo_adversario text DEFAULT 'advogado_particular';