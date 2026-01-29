-- Correção CPM: Preservar quebras de linha e formatação original
-- Limpar tabela CPM
TRUNCATE TABLE "CPM – Código Penal Militar" RESTART IDENTITY;

-- Inserir dados preservando TODAS as quebras de linha
INSERT INTO "CPM – Código Penal Militar" ("Número do Artigo", "Artigo")
SELECT 
  -- Padronizar apenas o número do artigo (remover º)
  CASE 
    WHEN "Número do Artigo" IS NULL OR TRIM("Número do Artigo") = '' THEN NULL
    WHEN "Número do Artigo" LIKE '%º' THEN REPLACE("Número do Artigo", 'º', '')
    ELSE "Número do Artigo"
  END as "Número do Artigo",
  -- Copiar artigo SEM modificar quebras de linha
  "Artigo"
FROM "TABELA PARA EDITAR";

-- Validação
DO $$
DECLARE
  total_registros INTEGER;
  total_artigos INTEGER;
  exemplo_artigo TEXT;
BEGIN
  SELECT COUNT(*) INTO total_registros FROM "CPM – Código Penal Militar";
  SELECT COUNT("Número do Artigo") INTO total_artigos FROM "CPM – Código Penal Militar" WHERE "Número do Artigo" IS NOT NULL;
  SELECT "Artigo" INTO exemplo_artigo FROM "CPM – Código Penal Militar" WHERE "Número do Artigo" = '7' LIMIT 1;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ CPM MIGRADO COM FORMATAÇÃO PRESERVADA';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total de registros: %', total_registros;
  RAISE NOTICE 'Total de artigos: %', total_artigos;
  RAISE NOTICE 'Exemplo (Art. 7 primeiros 200 chars): %', LEFT(exemplo_artigo, 200);
  RAISE NOTICE '================================================';
END $$;