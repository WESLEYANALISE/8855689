-- Copiar todos os registros da LRF (LC 101/2000) da TABELA PARA EDITAR
INSERT INTO "LC 101 - LRF" ("Número do Artigo", "Artigo")
SELECT "Número do Artigo", "Artigo" 
FROM "TABELA PARA EDITAR" 
WHERE id BETWEEN 458 AND 607
ORDER BY id;