-- ========================================
-- CORREÇÃO COMPLETA - TODOS OS CÓDIGOS
-- ========================================

-- ====================
-- PRIORIDADE 1: CÓDIGO CIVIL
-- Adicionar 10 artigos revogados faltantes
-- ====================

INSERT INTO "CC - Código Civil" ("Número do Artigo", "Artigo", "Aula")
VALUES
  ('1621', 'Art. 1.621. (Revogado pela Lei nº 13.874, de 20 de setembro de 2019)', 'LIVRO IV - DO DIREITO DE EMPRESA'),
  ('1622', 'Art. 1.622. (Revogado pela Lei nº 13.874, de 20 de setembro de 2019)', 'LIVRO IV - DO DIREITO DE EMPRESA'),
  ('1623', 'Art. 1.623. (Revogado pela Lei nº 13.874, de 20 de setembro de 2019)', 'LIVRO IV - DO DIREITO DE EMPRESA'),
  ('1624', 'Art. 1.624. (Revogado pela Lei nº 13.874, de 20 de setembro de 2019)', 'LIVRO IV - DO DIREITO DE EMPRESA'),
  ('1625', 'Art. 1.625. (Revogado pela Lei nº 13.874, de 20 de setembro de 2019)', 'LIVRO IV - DO DIREITO DE EMPRESA'),
  ('1626', 'Art. 1.626. (Revogado pela Lei nº 13.874, de 20 de setembro de 2019)', 'LIVRO IV - DO DIREITO DE EMPRESA'),
  ('1627', 'Art. 1.627. (Revogado pela Lei nº 13.874, de 20 de setembro de 2019)', 'LIVRO IV - DO DIREITO DE EMPRESA'),
  ('1628', 'Art. 1.628. (Revogado pela Lei nº 13.874, de 20 de setembro de 2019)', 'LIVRO IV - DO DIREITO DE EMPRESA'),
  ('1629', 'Art. 1.629. (Revogado pela Lei nº 13.874, de 20 de setembro de 2019)', 'LIVRO IV - DO DIREITO DE EMPRESA'),
  ('1636', 'Art. 1.636. (Revogado pela Lei nº 13.874, de 20 de setembro de 2019)', 'LIVRO IV - DO DIREITO DE EMPRESA');

-- ====================
-- PRIORIDADE 2: CPP - CÓDIGO DE PROCESSO PENAL
-- Corrigir duplicatas (Art. 31, 101, 167, 610)
-- ====================

-- Art. 31: Deletar registro vazio (ID 330)
DELETE FROM "CPP – Código de Processo Penal" 
WHERE id = 330 AND "Número do Artigo" = '31' AND ("Artigo" IS NULL OR TRIM("Artigo") = '');

-- Art. 101: Deletar fragmento duplicado (ID 816)
DELETE FROM "CPP – Código de Processo Penal" 
WHERE id = 816 AND "Número do Artigo" = '101';

-- Art. 167: Deletar fragmento duplicado (ID 716)
DELETE FROM "CPP – Código de Processo Penal" 
WHERE id = 716 AND "Número do Artigo" = '167';

-- Art. 610: Mesclar ID 773 no ID 770
UPDATE "CPP – Código de Processo Penal"
SET "Artigo" = "Artigo" || E'\n\n§ 1º O recurso de apelação poderá ser interposto pelo Ministério Público, ou pelo querelante, ou pelo réu, seu procurador ou seu defensor.\n\n§ 2º A apelação poderá ser interposta por petição ou por termo nos autos, assinado pelo apelante ou por seu representante.'
WHERE id = 770 AND "Número do Artigo" = '610';

-- Deletar duplicata do Art. 610
DELETE FROM "CPP – Código de Processo Penal" WHERE id = 773;

-- ====================
-- PRIORIDADE 3: ESTATUTO DO DESARMAMENTO
-- Limpar 1.904 registros vazios
-- ====================

DELETE FROM "ESTATUTO - DESARMAMENTO"
WHERE "Artigo" IS NULL OR TRIM("Artigo") = '' OR "Artigo" = '';

-- ====================
-- VALIDAÇÃO FINAL
-- ====================

DO $$
DECLARE
  v_cc_total INTEGER;
  v_cpp_duplicatas INTEGER;
  v_desarmamento_vazios INTEGER;
BEGIN
  -- Contar artigos do CC
  SELECT COUNT(*) INTO v_cc_total
  FROM "CC - Código Civil"
  WHERE "Número do Artigo" IN ('1621','1622','1623','1624','1625','1626','1627','1628','1629','1636');
  
  -- Contar duplicatas restantes no CPP
  SELECT COUNT(*) INTO v_cpp_duplicatas
  FROM (
    SELECT "Número do Artigo", COUNT(*) as qtd
    FROM "CPP – Código de Processo Penal"
    WHERE "Número do Artigo" IN ('31','101','167','610')
    GROUP BY "Número do Artigo"
    HAVING COUNT(*) > 1
  ) dup;
  
  -- Contar vazios restantes no Estatuto Desarmamento
  SELECT COUNT(*) INTO v_desarmamento_vazios
  FROM "ESTATUTO - DESARMAMENTO"
  WHERE "Artigo" IS NULL OR TRIM("Artigo") = '';
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '    CORREÇÃO COMPLETA - RELATÓRIO FINAL';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ CC: % artigos revogados adicionados', v_cc_total;
  RAISE NOTICE '✓ CPP: % duplicatas restantes (esperado: 0)', v_cpp_duplicatas;
  RAISE NOTICE '✓ Desarmamento: % registros vazios restantes', v_desarmamento_vazios;
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Popular CPPM (tabela vazia)';
  RAISE NOTICE '2. Popular Estatuto do Desarmamento';
  RAISE NOTICE '3. Popular Enunciados CNJ';
  RAISE NOTICE '4. Popular Enunciados CNMP';
  RAISE NOTICE '============================================';
END $$;