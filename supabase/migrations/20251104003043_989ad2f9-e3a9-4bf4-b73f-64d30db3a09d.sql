-- Backup dos dados antes da importação
CREATE TABLE IF NOT EXISTS "LEI6015_backup_import" AS 
SELECT * FROM "TABELA PARA EDITAR" WHERE id BETWEEN 964 AND 1369;

-- Importação dos artigos da Lei 6015
INSERT INTO "LEI 6015 - REGISTROS PUBLICOS" 
  ("Número do Artigo", "Artigo")
SELECT 
  "Número do Artigo", 
  "Artigo"
FROM "TABELA PARA EDITAR"
WHERE id BETWEEN 964 AND 1369
ORDER BY id;

-- Correção 1: Anexar títulos que estão em linhas separadas (sem Número do Artigo) ao artigo seguinte
CREATE TEMP TABLE titulos_precedentes_6015 AS
SELECT 
  t1.id AS linha_titulo_id,
  t1."Artigo" AS titulo_texto,
  t2.id AS artigo_id
FROM "LEI 6015 - REGISTROS PUBLICOS" t1
JOIN "LEI 6015 - REGISTROS PUBLICOS" t2
  ON t2.id = (SELECT MIN(id) FROM "LEI 6015 - REGISTROS PUBLICOS" WHERE id > t1.id)
WHERE t1."Número do Artigo" IS NULL
  AND t2."Número do Artigo" IS NOT NULL
  AND t1."Artigo" !~ '^(Cap[íi]tulo|Se[cç][aã]o|LEI|Disp[óo]e|O PRESIDENTE|TÍTULO)'
  AND LENGTH(t1."Artigo") BETWEEN 3 AND 280;

UPDATE "LEI 6015 - REGISTROS PUBLICOS" dest
SET "Artigo" = trim(both E'\n' from (titulo_texto || E'\n\n' || dest."Artigo"))
FROM titulos_precedentes_6015 temp
WHERE dest.id = temp.artigo_id;

DELETE FROM "LEI 6015 - REGISTROS PUBLICOS"
WHERE id IN (SELECT linha_titulo_id FROM titulos_precedentes_6015);

DROP TABLE titulos_precedentes_6015;

-- Correção 2: Mover títulos que ficaram no final do artigo anterior
WITH candidatos AS (
  SELECT
    id,
    "Artigo" AS artigo_texto,
    (regexp_match("Artigo", E'\n\n([^\n]{3,140})\s*$'))[1] AS titulo,
    lead(id) OVER (ORDER BY id) AS proximo_id
  FROM "LEI 6015 - REGISTROS PUBLICOS"
  WHERE "Número do Artigo" IS NOT NULL
),
validos AS (
  SELECT c.*
  FROM candidatos c
  JOIN "LEI 6015 - REGISTROS PUBLICOS" n ON n.id = c.proximo_id
  WHERE c.titulo IS NOT NULL
    AND right(c.titulo, 1) !~ '[\.!?;:]'
    AND c.titulo !~ E'\b(Art\.|Par[aá]grafo|§|Inciso|Cap[ií]tulo|Se[cç][aã]o)\b'
    AND array_length(regexp_split_to_array(c.titulo, '\s+'), 1) <= 16
)
UPDATE "LEI 6015 - REGISTROS PUBLICOS" t
SET "Artigo" = left(t."Artigo", length(t."Artigo") - length(E'\n\n' || v.titulo))
FROM validos v
WHERE t.id = v.id;

WITH candidatos AS (
  SELECT
    id,
    "Artigo" AS artigo_texto,
    (regexp_match("Artigo", E'\n\n([^\n]{3,140})\s*$'))[1] AS titulo,
    lead(id) OVER (ORDER BY id) AS proximo_id
  FROM "LEI 6015 - REGISTROS PUBLICOS"
  WHERE "Número do Artigo" IS NOT NULL
),
validos AS (
  SELECT c.*
  FROM candidatos c
  JOIN "LEI 6015 - REGISTROS PUBLICOS" n ON n.id = c.proximo_id
  WHERE c.titulo IS NOT NULL
    AND right(c.titulo, 1) !~ '[\.!?;:]'
    AND c.titulo !~ E'\b(Art\.|Par[aá]grafo|§|Inciso|Cap[ií]tulo|Se[cç][aã]o)\b'
    AND array_length(regexp_split_to_array(c.titulo, '\s+'), 1) <= 16
)
UPDATE "LEI 6015 - REGISTROS PUBLICOS" nxt
SET "Artigo" = v.titulo || E'\n\n' || nxt."Artigo"
FROM validos v
WHERE nxt.id = v.proximo_id;