-- Copiar todos os registros da Lei 7.347/1985 (Ação Civil Pública) da TABELA PARA EDITAR
INSERT INTO "LEI 7347 - ACAO CIVIL PUBLICA" ("Número do Artigo", "Artigo")
SELECT "Número do Artigo", "Artigo" 
FROM "TABELA PARA EDITAR" 
WHERE id BETWEEN 312 AND 338
ORDER BY id;