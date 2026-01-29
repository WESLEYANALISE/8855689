-- Inserir cabeçalho da Lei de Improbidade Administrativa
-- Primeiro, ajustar a sequência de IDs se necessário
DO $$
DECLARE
  min_id bigint;
BEGIN
  -- Pegar o menor ID atual
  SELECT MIN(id) INTO min_id FROM "LEI 8429 - IMPROBIDADE";
  
  -- Se já existe um registro com Número do Artigo vazio, deletar para recriar
  DELETE FROM "LEI 8429 - IMPROBIDADE" WHERE "Número do Artigo" = '' OR "Número do Artigo" IS NULL;
  
  -- Inserir o cabeçalho no início
  INSERT INTO "LEI 8429 - IMPROBIDADE" (id, "Número do Artigo", "Artigo", "Aula")
  VALUES (
    COALESCE(min_id - 1, 0),
    NULL,
    'LEI Nº 8.429, DE 2 DE JUNHO DE 1992

Dispõe sobre as sanções aplicáveis aos agentes públicos nos casos de enriquecimento ilícito no exercício de mandato, cargo, emprego ou função na administração pública direta, indireta ou fundacional e dá outras providências.

O PRESIDENTE DA REPÚBLICA

Faço saber que o Congresso Nacional decreta e eu sanciono a seguinte lei:',
    NULL
  );
END $$;