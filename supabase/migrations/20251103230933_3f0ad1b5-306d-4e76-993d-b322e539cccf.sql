-- Copiar todos os registros da LGPD (Lei 13.709/2018) da TABELA PARA EDITAR
INSERT INTO "LEI 13709 - LGPD" ("Número do Artigo", "Artigo")
SELECT "Número do Artigo", "Artigo" 
FROM "TABELA PARA EDITAR" 
WHERE id BETWEEN 338 AND 457
ORDER BY id;