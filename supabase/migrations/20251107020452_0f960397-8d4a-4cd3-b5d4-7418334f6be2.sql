-- Adicionar coluna de descrição gerada por IA na tabela CURSOS-APP
ALTER TABLE "CURSOS-APP" 
ADD COLUMN IF NOT EXISTS "descricao-aula" text,
ADD COLUMN IF NOT EXISTS "descricao_gerada_em" timestamp with time zone;