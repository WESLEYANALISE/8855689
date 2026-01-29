-- Corrigir o número do artigo 8-A no ECA que está incorretamente como "8"
UPDATE "ESTATUTO - ECA" 
SET "Número do Artigo" = '8-A'
WHERE id = 12 AND "Artigo" LIKE '%Art. 8º-A%';