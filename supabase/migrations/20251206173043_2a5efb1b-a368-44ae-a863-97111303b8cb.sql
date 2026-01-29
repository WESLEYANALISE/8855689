
-- Limpar todos os campos de capa gerada da tabela BIBLIOTECA-ESTUDOS
UPDATE "BIBLIOTECA-ESTUDOS"
SET 
  "Capa-livro" = NULL,
  "url_capa_gerada" = NULL
WHERE "Capa-livro" IS NOT NULL OR "url_capa_gerada" IS NOT NULL;
