-- Correção de títulos deslocados na Lei 9430 - Legislação Tributária
-- Move títulos que estão no final de um artigo para o início do próximo

-- Primeiro, criar uma tabela temporária com os mapeamentos
CREATE TEMP TABLE titulos_deslocados AS
SELECT 
  t1.id as artigo_atual_id,
  t2.id as proximo_artigo_id,
  (regexp_matches(t1."Artigo", '\n\n([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-Za-záàâãéêíóôõúç\s\-–—]+)\s*$'))[1] as titulo
FROM "LEI 9430 - LEGISLACAO TRIBUTARIA" t1
LEFT JOIN "LEI 9430 - LEGISLACAO TRIBUTARIA" t2 ON t2.id = (
  SELECT MIN(id) 
  FROM "LEI 9430 - LEGISLACAO TRIBUTARIA" 
  WHERE id > t1.id AND "Número do Artigo" IS NOT NULL
)
WHERE t1."Artigo" ~ '\n\n[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-Za-záàâãéêíóôõúç\s\-–—]+\s*$'
  AND t1."Número do Artigo" IS NOT NULL;

-- Remove os títulos do final dos artigos atuais
UPDATE "LEI 9430 - LEGISLACAO TRIBUTARIA" dest
SET "Artigo" = regexp_replace(dest."Artigo", '\n\n[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-Za-záàâãéêíóôõúç\s\-–—]+\s*$', '')
FROM titulos_deslocados temp
WHERE dest.id = temp.artigo_atual_id;

-- Adiciona os títulos no início dos próximos artigos
UPDATE "LEI 9430 - LEGISLACAO TRIBUTARIA" dest
SET "Artigo" = temp.titulo || E'\n\n' || dest."Artigo"
FROM titulos_deslocados temp
WHERE dest.id = temp.proximo_artigo_id
  AND temp.titulo IS NOT NULL;

-- Limpa a tabela temporária
DROP TABLE titulos_deslocados;