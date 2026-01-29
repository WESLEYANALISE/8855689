-- Limpar todas as narrações do Código de Processo Civil
UPDATE "CPC – Código de Processo Civil"
SET "Narração" = NULL
WHERE "Narração" IS NOT NULL;