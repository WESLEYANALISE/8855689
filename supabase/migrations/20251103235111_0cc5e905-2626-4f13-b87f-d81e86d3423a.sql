-- ============================================
-- POPULAR LEI 12527 - ACESSO À INFORMAÇÃO
-- ============================================

-- Copiar toda a estrutura da Lei 12527 da TABELA PARA EDITAR
INSERT INTO "LEI 12527 - ACESSO INFORMACAO" ("Número do Artigo", "Artigo")
SELECT "Número do Artigo", "Artigo" 
FROM "TABELA PARA EDITAR" 
WHERE id BETWEEN 717 AND 786
ORDER BY id;

-- Validação
DO $$
DECLARE
  total_records INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_records FROM "LEI 12527 - ACESSO INFORMACAO";
  RAISE NOTICE '✅ Lei 12527 (Acesso à Informação) populada com % registros (esperado: 70)', total_records;
END $$;