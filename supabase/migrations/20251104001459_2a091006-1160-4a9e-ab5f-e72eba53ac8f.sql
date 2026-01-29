-- Corrigir títulos que estão em linhas separadas antes dos artigos
-- Move conteúdo de linhas sem número de artigo para o início do próximo artigo

-- Criar tabela temporária com mapeamento de títulos que precedem artigos
CREATE TEMP TABLE titulos_precedentes AS
SELECT 
  t1.id as linha_titulo_id,
  t1."Artigo" as titulo_texto,
  t2.id as artigo_id,
  t2."Número do Artigo" as artigo_numero,
  t2."Artigo" as artigo_texto
FROM "LEI 9430 - LEGISLACAO TRIBUTARIA" t1
INNER JOIN "LEI 9430 - LEGISLACAO TRIBUTARIA" t2 ON t2.id = (
  SELECT MIN(id) 
  FROM "LEI 9430 - LEGISLACAO TRIBUTARIA" 
  WHERE id > t1.id
)
WHERE t1."Número do Artigo" IS NULL
  AND t2."Número do Artigo" IS NOT NULL
  AND t1."Artigo" !~ '^(Capítulo|Seção|CAPÍTULO|SEÇÃO|LEI|Dispõe|O PRESIDENTE)'
  AND LENGTH(t1."Artigo") < 200;

-- Adiciona os títulos no início dos artigos
UPDATE "LEI 9430 - LEGISLACAO TRIBUTARIA" dest
SET "Artigo" = temp.titulo_texto || E'\n\n' || dest."Artigo"
FROM titulos_precedentes temp
WHERE dest.id = temp.artigo_id;

-- Remove as linhas de título que foram movidas
DELETE FROM "LEI 9430 - LEGISLACAO TRIBUTARIA"
WHERE id IN (SELECT linha_titulo_id FROM titulos_precedentes);

-- Limpa tabela temporária
DROP TABLE titulos_precedentes;