
-- Limpeza de notas de redação dos artigos do Vade Mecum
-- Remove textos entre parênteses como "(Redação dada pela Lei nº X, de Y)"

-- ESTATUTO - IDOSO
UPDATE "ESTATUTO - IDOSO"
SET "Artigo" = regexp_replace("Artigo", '\(Redaç?\s?ão dada pela[^)]+\)', '', 'gi')
WHERE "Artigo" ~* '\(Redaç?\s?ão dada pela';

-- ESTATUTO - CIDADE
UPDATE "ESTATUTO - CIDADE"
SET "Artigo" = regexp_replace("Artigo", '\(Redaç?\s?ão dada pela[^)]+\)', '', 'gi')
WHERE "Artigo" ~* '\(Redaç?\s?ão dada pela';

-- ESTATUTO - PESSOA COM DEFICIÊNCIA
UPDATE "ESTATUTO - PESSOA COM DEFICIÊNCIA"
SET "Artigo" = regexp_replace("Artigo", '\(Redaç?\s?ão dada pela[^)]+\)', '', 'gi')
WHERE "Artigo" ~* '\(Redaç?\s?ão dada pela';

-- CF - Constituição Federal (inclui EMENDA CONSTITUCIONAL)
UPDATE "CF - Constituição Federal"
SET "Artigo" = regexp_replace("Artigo", '\(REDAÇÃO DADA PELA EMENDA[^)]+\)', '', 'gi')
WHERE "Artigo" ~* '\(REDAÇÃO DADA PELA EMENDA';

-- Também limpar padrões adicionais: (Incluído pela...), (Revogado pela...), (Vide...)
UPDATE "CF - Constituição Federal"
SET "Artigo" = regexp_replace("Artigo", '\(Incluído pela[^)]+\)', '', 'gi')
WHERE "Artigo" ~* '\(Incluído pela';

UPDATE "CF - Constituição Federal"
SET "Artigo" = regexp_replace("Artigo", '\(Revogado pela[^)]+\)', '', 'gi')
WHERE "Artigo" ~* '\(Revogado pela';

UPDATE "CF - Constituição Federal"
SET "Artigo" = regexp_replace("Artigo", '\(Vide[^)]+\)', '', 'gi')
WHERE "Artigo" ~* '\(Vide';

-- Limpar espaços duplos resultantes da remoção
UPDATE "ESTATUTO - IDOSO" SET "Artigo" = regexp_replace("Artigo", '\s{2,}', ' ', 'g') WHERE "Artigo" ~ '\s{2,}';
UPDATE "ESTATUTO - CIDADE" SET "Artigo" = regexp_replace("Artigo", '\s{2,}', ' ', 'g') WHERE "Artigo" ~ '\s{2,}';
UPDATE "ESTATUTO - PESSOA COM DEFICIÊNCIA" SET "Artigo" = regexp_replace("Artigo", '\s{2,}', ' ', 'g') WHERE "Artigo" ~ '\s{2,}';
UPDATE "CF - Constituição Federal" SET "Artigo" = regexp_replace("Artigo", '\s{2,}', ' ', 'g') WHERE "Artigo" ~ '\s{2,}';
