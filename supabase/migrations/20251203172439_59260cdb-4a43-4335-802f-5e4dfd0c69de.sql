-- Adicionar coluna exemplo_pratico na tabela QUESTOES_GERADAS
ALTER TABLE "QUESTOES_GERADAS" 
ADD COLUMN IF NOT EXISTS exemplo_pratico TEXT;