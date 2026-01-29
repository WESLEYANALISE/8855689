-- Limpar narração do Art. 5º do Código Eleitoral para regenerar com a correção
UPDATE "CE – Código Eleitoral"
SET "Narração" = NULL
WHERE "Número do Artigo" = '5º';