-- Limpar as capas existentes da BIBLIOTECA-ESTUDOS para permitir geração com IA
UPDATE "BIBLIOTECA-ESTUDOS"
SET "Capa-livro" = NULL
WHERE "Capa-livro" IS NOT NULL;