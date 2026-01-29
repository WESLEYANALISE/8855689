-- ============================================
-- POPULAR LEI 9784 - PROCESSO ADMINISTRATIVO
-- ============================================

-- Copiar toda a estrutura da Lei 9784 da TABELA PARA EDITAR
INSERT INTO "LEI 9784 - PROCESSO ADMINISTRATIVO" ("Número do Artigo", "Artigo")
SELECT "Número do Artigo", "Artigo" 
FROM "TABELA PARA EDITAR" 
WHERE id BETWEEN 608 AND 716
ORDER BY id;

-- Validação
DO $$
DECLARE
  total_records INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_records FROM "LEI 9784 - PROCESSO ADMINISTRATIVO";
  RAISE NOTICE '✅ Lei 9784 populada com % registros (esperado: 109)', total_records;
END $$;