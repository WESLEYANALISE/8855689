-- Limpar dados de exemplo prático, narrações de exemplo e narrações de enunciados
-- da tabela Lei Maria da Penha para regeneração

UPDATE "Lei 11.340 de 2006 - Maria da Penha"
SET 
  exemplo = NULL,
  "Narração" = NULL
WHERE exemplo IS NOT NULL OR "Narração" IS NOT NULL;