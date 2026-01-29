
-- Padronização e transferência do CPM - VERSÃO CORRIGIDA
-- ETAPA 1: Limpar tabela CPM
TRUNCATE TABLE "CPM – Código Penal Militar" RESTART IDENTITY;

-- ETAPA 2: Inserir dados padronizados da TABELA PARA EDITAR
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo")
SELECT 
  -- Padronizar números: remover º e converter string vazia em NULL
  CASE 
    WHEN "Número do Artigo" IS NULL OR TRIM("Número do Artigo") = '' THEN NULL
    WHEN "Número do Artigo" LIKE '%º' THEN REPLACE("Número do Artigo", 'º', '')
    ELSE "Número do Artigo"
  END as "Número do Artigo",
  -- Limpar texto: remover espaços duplos e quebras de linha excessivas
  REGEXP_REPLACE(
    REGEXP_REPLACE("Artigo", '\s+', ' ', 'g'),
    '\n\n\n+', E'\n\n', 'g'
  ) as "Artigo"
FROM "TABELA PARA EDITAR";

-- ETAPA 3: Validação final
DO $$
DECLARE
  total_registros INTEGER;
  total_artigos INTEGER;
  total_estruturas INTEGER;
  artigo_minimo INTEGER;
  artigo_maximo INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_registros FROM "CPM – Código Penal Militar";
  SELECT COUNT("Número do Artigo") INTO total_artigos FROM "CPM – Código Penal Militar" WHERE "Número do Artigo" IS NOT NULL;
  total_estruturas := total_registros - total_artigos;
  
  SELECT MIN(CAST("Número do Artigo" AS INTEGER)) INTO artigo_minimo 
  FROM "CPM – Código Penal Militar" WHERE "Número do Artigo" IS NOT NULL;
  
  SELECT MAX(CAST("Número do Artigo" AS INTEGER)) INTO artigo_maximo 
  FROM "CPM – Código Penal Militar" WHERE "Número do Artigo" IS NOT NULL;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ PADRONIZAÇÃO E TRANSFERÊNCIA CONCLUÍDA!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total de registros inseridos: %', total_registros;
  RAISE NOTICE 'Total de artigos: % (deve ser 410)', total_artigos;
  RAISE NOTICE 'Total de estruturas: %', total_estruturas;
  RAISE NOTICE 'Numeração: artigos % a %', artigo_minimo, artigo_maximo;
  RAISE NOTICE '================================================';
  RAISE NOTICE '✓ Números padronizados (1, 2, 3... sem º)';
  RAISE NOTICE '✓ Textos limpos de espaços duplos';
  RAISE NOTICE '✓ Estruturas com Número do Artigo = NULL';
  RAISE NOTICE '✓ Pronto para geração de conteúdo educacional';
  RAISE NOTICE '================================================';
END $$;
