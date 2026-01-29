-- Transferir links de narração da TABELA PARA EDITAR para Código Civil
-- Extraindo número do formato "artigo.Xº.wav" ou "artigo.X.wav" e fazendo match com CC

UPDATE "CC - Código Civil" cc
SET "Narração" = te."Narração"
FROM "TABELA PARA EDITAR" te
WHERE (
  -- Match com formato "Xº" (ex: "1º", "2º")
  cc."Número do Artigo" = REGEXP_REPLACE(te."Artigo", '^artigo\.(\d+)º?\.wav$', '\1º', 'i')
  OR
  -- Match com formato numérico simples (ex: "13", "14")
  cc."Número do Artigo" = REGEXP_REPLACE(te."Artigo", '^artigo\.(\d+)\.wav$', '\1', 'i')
)
AND te."Narração" IS NOT NULL
AND te."Narração" != ''
AND (cc."Narração" IS NULL OR cc."Narração" = '');