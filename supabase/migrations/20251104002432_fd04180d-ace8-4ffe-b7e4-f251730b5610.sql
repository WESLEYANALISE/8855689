-- Correção manual específica para o título do Art. 14
-- O título "Saldo de Provisões Existente em 31.12.96" está no final do Art. 13

-- Passo 1: Remover o título do final do Art. 13
UPDATE "LEI 9430 - LEGISLACAO TRIBUTARIA"
SET "Artigo" = trim(trailing from substring("Artigo", 1, 398))
WHERE id = 27 AND "Número do Artigo" = '13';

-- Passo 2: Adicionar o título no início do Art. 14
UPDATE "LEI 9430 - LEGISLACAO TRIBUTARIA"
SET "Artigo" = 'Saldo de Provisões Existente em 31.12.96' || E'\n\n' || "Artigo"
WHERE id = 28 AND "Número do Artigo" = '14';