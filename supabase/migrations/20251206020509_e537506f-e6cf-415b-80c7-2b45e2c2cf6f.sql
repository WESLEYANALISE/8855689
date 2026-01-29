-- Adicionar coluna para capa gerada na BIBLIOTECA-ESTUDOS
ALTER TABLE "BIBLIOTECA-ESTUDOS" 
ADD COLUMN IF NOT EXISTS "url_capa_gerada" TEXT;

-- Adicionar colunas para controle de lotes na BIBLIOTECA-CLASSICOS
ALTER TABLE "BIBLIOTECA-CLASSICOS" 
ADD COLUMN IF NOT EXISTS "capitulos_gerados" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "total_capitulos" INTEGER;