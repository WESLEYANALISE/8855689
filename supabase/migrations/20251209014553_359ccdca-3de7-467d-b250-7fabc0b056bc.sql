-- Limpar narrações dos artigos 1 a 14 do Código Penal
UPDATE "CP - Código Penal"
SET "Narração" = NULL
WHERE "Número do Artigo" IN ('1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10', '11', '12', '13', '14', '1', '2', '3', '4', '5', '6', '7', '8', '9');