-- Limpar todas as narrações do Código Penal para regenerar
UPDATE "CP - Código Penal"
SET "Narração" = NULL
WHERE "Narração" IS NOT NULL;