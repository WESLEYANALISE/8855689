-- Limpeza das tabelas do Vade Mecum

-- ========================================
-- 1. ESTATUTO - TORCEDOR
-- ========================================

-- 1.1 Remover registros de teste
DELETE FROM "ESTATUTO - TORCEDOR" 
WHERE "Artigo" = 'artigo' AND "Número do Artigo" = 'numero';

-- 1.2 Remover linhas completamente vazias
DELETE FROM "ESTATUTO - TORCEDOR" 
WHERE ("Artigo" IS NULL OR TRIM("Artigo") = '') 
  AND ("Número do Artigo" IS NULL OR TRIM("Número do Artigo") = '');

-- 1.3 Remover duplicatas (manter apenas o registro com menor ID para cada artigo)
DELETE FROM "ESTATUTO - TORCEDOR" a
USING "ESTATUTO - TORCEDOR" b
WHERE a."Número do Artigo" = b."Número do Artigo"
  AND a.id > b.id
  AND a."Número do Artigo" IS NOT NULL 
  AND TRIM(a."Número do Artigo") != '';

-- ========================================
-- 2. ESTATUTO - PESSOA COM DEFICIÊNCIA
-- ========================================

DELETE FROM "ESTATUTO - PESSOA COM DEFICIÊNCIA" 
WHERE ("Artigo" IS NULL OR TRIM("Artigo") = '') 
  AND ("Número do Artigo" IS NULL OR TRIM("Número do Artigo") = '');

-- ========================================
-- 3. CPP – Código de Processo Penal
-- ========================================

DELETE FROM "CPP – Código de Processo Penal" 
WHERE ("Artigo" IS NULL OR TRIM("Artigo") = '') 
  AND ("Número do Artigo" IS NULL OR TRIM("Número do Artigo") = '');

-- ========================================
-- 4. CF - Constituição Federal
-- ========================================

DELETE FROM "CF - Constituição Federal" 
WHERE ("Artigo" IS NULL OR TRIM("Artigo") = '') 
  AND ("Número do Artigo" IS NULL OR TRIM("Número do Artigo") = '');