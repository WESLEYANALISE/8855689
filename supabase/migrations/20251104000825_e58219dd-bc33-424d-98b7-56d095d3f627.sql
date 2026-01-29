-- Copiar todos os artigos da Lei 9.430/1996 (Legislação Tributária) da TABELA PARA EDITAR
INSERT INTO "LEI 9430 - LEGISLACAO TRIBUTARIA" ("Número do Artigo", "Artigo")
SELECT "Número do Artigo", "Artigo" 
FROM "TABELA PARA EDITAR" 
WHERE id BETWEEN 792 AND 963
ORDER BY id;