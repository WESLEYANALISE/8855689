-- ============================================
-- CORREÇÃO DOS TÍTULOS DOS ARTIGOS DO CPM
-- Move títulos do final de cada artigo para o início do próximo
-- ============================================

-- ETAPA 1: Criar tabela temporária com artigos corrigidos
CREATE TEMP TABLE cpm_corrigido AS
WITH artigos_numerados AS (
  SELECT 
    id,
    "Número do Artigo",
    "Artigo",
    ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM "CPM – Código Penal Militar"
  WHERE "Número do Artigo" IS NOT NULL
  ORDER BY id
),
artigos_com_titulo_extraido AS (
  SELECT 
    id,
    "Número do Artigo",
    rn,
    -- Remove última linha que é o título do próximo (linhas isoladas < 60 chars após quebra dupla)
    CASE 
      WHEN "Artigo" ~ E'\\n\\n[A-ZÀ-Ú][^\\n]{1,80}$' 
      THEN TRIM(REGEXP_REPLACE("Artigo", E'\\n\\n[A-ZÀ-Ú][^\\n]{1,80}$', '', 'g'))
      ELSE "Artigo"
    END as artigo_limpo,
    -- Extrai o título que está no final (para passar ao próximo)
    CASE 
      WHEN "Artigo" ~ E'\\n\\n[A-ZÀ-Ú][^\\n]{1,80}$'
      THEN TRIM(REGEXP_REPLACE("Artigo", E'^.*\\n\\n([A-ZÀ-Ú][^\\n]{1,80})$', '\1', 'gs'))
      ELSE NULL
    END as titulo_para_proximo
  FROM artigos_numerados
),
artigos_finais AS (
  SELECT 
    a.id,
    a."Número do Artigo",
    CASE
      -- Art. 1: adicionar título específico
      WHEN a."Número do Artigo" = '1' THEN 
        'Princípio de legalidade' || E'\n\n' || a.artigo_limpo
      -- Demais artigos: adicionar título do artigo anterior
      WHEN LAG(a.titulo_para_proximo) OVER (ORDER BY a.rn) IS NOT NULL THEN
        LAG(a.titulo_para_proximo) OVER (ORDER BY a.rn) || E'\n\n' || a.artigo_limpo
      ELSE a.artigo_limpo
    END as artigo_final
  FROM artigos_com_titulo_extraido a
)
SELECT * FROM artigos_finais;

-- ETAPA 2: Atualizar os artigos numerados
UPDATE "CPM – Código Penal Militar" cpm
SET "Artigo" = c.artigo_final
FROM cpm_corrigido c
WHERE cpm.id = c.id;

-- ETAPA 3: Remover o registro separado com "Princípio de legalidade" (id 9)
DELETE FROM "CPM – Código Penal Militar"
WHERE "Número do Artigo" IS NULL 
  AND "Artigo" LIKE '%Princípio de legalidade%'
  AND LENGTH("Artigo") < 50;

-- ETAPA 4: Validação
DO $$
DECLARE
  total_artigos INTEGER;
  amostra_art1 TEXT;
  amostra_art2 TEXT;
  amostra_art3 TEXT;
BEGIN
  SELECT COUNT(*) INTO total_artigos
  FROM "CPM – Código Penal Militar"
  WHERE "Número do Artigo" IS NOT NULL;
  
  SELECT LEFT("Artigo", 100) INTO amostra_art1
  FROM "CPM – Código Penal Militar"
  WHERE "Número do Artigo" = '1';
  
  SELECT LEFT("Artigo", 100) INTO amostra_art2
  FROM "CPM – Código Penal Militar"
  WHERE "Número do Artigo" = '2';
  
  SELECT LEFT("Artigo", 100) INTO amostra_art3
  FROM "CPM – Código Penal Militar"
  WHERE "Número do Artigo" = '3';
  
  RAISE NOTICE '✅ CORREÇÃO CONCLUÍDA!';
  RAISE NOTICE '📊 Total de artigos: %', total_artigos;
  RAISE NOTICE '📝 Art. 1 inicia com: %', amostra_art1;
  RAISE NOTICE '📝 Art. 2 inicia com: %', amostra_art2;
  RAISE NOTICE '📝 Art. 3 inicia com: %', amostra_art3;
END $$;