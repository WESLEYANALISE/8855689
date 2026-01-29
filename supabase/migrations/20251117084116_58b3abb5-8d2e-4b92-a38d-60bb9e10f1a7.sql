-- Transferir links de narração da TABELA PARA EDITAR para CPC
UPDATE "CPC – Código de Processo Civil" cpc
SET "Narração" = te."Narração"
FROM "TABELA PARA EDITAR" te
WHERE cpc."Número do Artigo" = te."Artigo"
  AND te."Narração" IS NOT NULL
  AND te."Narração" != ''
  AND (cpc."Narração" IS NULL OR cpc."Narração" = '');