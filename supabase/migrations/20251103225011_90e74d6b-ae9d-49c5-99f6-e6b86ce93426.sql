-- Limpar tabela LEI 14133 - LICITACOES
DELETE FROM "LEI 14133 - LICITACOES";

-- Copiar TODOS os registros da TABELA PARA EDITAR (artigos + estrutura completa)
INSERT INTO "LEI 14133 - LICITACOES" ("Número do Artigo", "Artigo")
SELECT "Número do Artigo", "Artigo" 
FROM "TABELA PARA EDITAR" 
ORDER BY id;