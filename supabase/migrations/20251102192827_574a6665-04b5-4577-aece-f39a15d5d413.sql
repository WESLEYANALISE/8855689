-- Remover o prefixo "Art. Xº" do campo Artigo para evitar duplicação
UPDATE "Lei 7.210 de 1984 - Lei de Execução Penal"
SET "Artigo" = regexp_replace("Artigo", '^Art\.\s*[0-9]+[ºª]?(-[A-Z])?\s+', '', 'i')
WHERE "Número do Artigo" IS NOT NULL 
  AND "Artigo" ~ '^Art\.\s*[0-9]+[ºª]?(-[A-Z])?\s+';