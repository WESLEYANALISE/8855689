-- Backup da tabela LEI 9430 antes das correções
CREATE TABLE IF NOT EXISTS "LEI9430_backup_2025_11_04" AS
SELECT * FROM "LEI 9430 - LEGISLACAO TRIBUTARIA";

-- Etapa 1: Corrigir títulos que estão no final do artigo anterior
-- Regex mais simples: captura última linha de 3-140 caracteres
WITH candidatos AS (
  SELECT
    id,
    "Artigo",
    (regexp_match("Artigo", '\\n\\n([^\\n]{3,140})\\s*$'))[1] AS titulo,
    lead(id) OVER (ORDER BY id) AS proximo_id
  FROM "LEI 9430 - LEGISLACAO TRIBUTARIA"
  WHERE "Número do Artigo" IS NOT NULL
),
validos AS (
  SELECT c.*
  FROM candidatos c
  WHERE c.titulo IS NOT NULL
    AND c.proximo_id IS NOT NULL
    AND right(c.titulo, 1) NOT IN ('.', '!', '?', ';', ':')
    AND c.titulo NOT LIKE '%Art.%'
    AND c.titulo NOT LIKE '%Parágrafo%'
    AND c.titulo NOT LIKE '%§%'
    AND c.titulo NOT LIKE '%Inciso%'
    AND LENGTH(c.titulo) > 10
)
-- Remove o título do final do artigo atual
UPDATE "LEI 9430 - LEGISLACAO TRIBUTARIA" t
SET "Artigo" = left(t."Artigo", length(t."Artigo") - length('\\n\\n' || v.titulo))
FROM validos v
WHERE t.id = v.id;

-- Adiciona o título removido no início do próximo artigo
WITH candidatos AS (
  SELECT
    id,
    (regexp_match("Artigo", '\\n\\n([^\\n]{3,140})\\s*$'))[1] AS titulo,
    lead(id) OVER (ORDER BY id) AS proximo_id
  FROM "LEI9430_backup_2025_11_04"
  WHERE "Número do Artigo" IS NOT NULL
),
validos AS (
  SELECT c.*
  FROM candidatos c
  WHERE c.titulo IS NOT NULL
    AND c.proximo_id IS NOT NULL
    AND right(c.titulo, 1) NOT IN ('.', '!', '?', ';', ':')
    AND c.titulo NOT LIKE '%Art.%'
    AND c.titulo NOT LIKE '%Parágrafo%'
    AND c.titulo NOT LIKE '%§%'
    AND c.titulo NOT LIKE '%Inciso%'
    AND LENGTH(c.titulo) > 10
)
UPDATE "LEI 9430 - LEGISLACAO TRIBUTARIA" nxt
SET "Artigo" = v.titulo || E'\\n\\n' || nxt."Artigo"
FROM validos v
WHERE nxt.id = v.proximo_id;

-- Etapa 2: Corrigir títulos em linhas separadas
CREATE TEMP TABLE titulos_precedentes_v2 AS
SELECT 
  t1.id AS linha_titulo_id,
  t1."Artigo" AS titulo_texto,
  t2.id AS artigo_id
FROM "LEI 9430 - LEGISLACAO TRIBUTARIA" t1
JOIN "LEI 9430 - LEGISLACAO TRIBUTARIA" t2
  ON t2.id = (SELECT MIN(id) FROM "LEI 9430 - LEGISLACAO TRIBUTARIA" WHERE id > t1.id)
WHERE t1."Número do Artigo" IS NULL
  AND t2."Número do Artigo" IS NOT NULL
  AND t1."Artigo" NOT LIKE 'Capítulo%'
  AND t1."Artigo" NOT LIKE 'Seção%'
  AND t1."Artigo" NOT LIKE 'CAPÍTULO%'
  AND t1."Artigo" NOT LIKE 'SEÇÃO%'
  AND t1."Artigo" NOT LIKE 'LEI%'
  AND t1."Artigo" NOT LIKE 'Dispõe%'
  AND t1."Artigo" NOT LIKE 'O PRESIDENTE%'
  AND LENGTH(t1."Artigo") BETWEEN 3 AND 280;

UPDATE "LEI 9430 - LEGISLACAO TRIBUTARIA" dest
SET "Artigo" = temp.titulo_texto || E'\\n\\n' || dest."Artigo"
FROM titulos_precedentes_v2 temp
WHERE dest.id = temp.artigo_id;

DELETE FROM "LEI 9430 - LEGISLACAO TRIBUTARIA"
WHERE id IN (SELECT linha_titulo_id FROM titulos_precedentes_v2);

DROP TABLE titulos_precedentes_v2;