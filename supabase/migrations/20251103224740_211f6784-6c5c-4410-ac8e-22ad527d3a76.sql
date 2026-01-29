-- Limpar tabela LEI 14133 - LICITACOES
DELETE FROM "LEI 14133 - LICITACOES";

-- Copiar todos os artigos numerados da TABELA PARA EDITAR
INSERT INTO "LEI 14133 - LICITACOES" ("Número do Artigo", "Artigo")
SELECT "Número do Artigo", "Artigo" 
FROM "TABELA PARA EDITAR" 
WHERE "Número do Artigo" IS NOT NULL;