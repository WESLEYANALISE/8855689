-- ========================================
-- CORREÇÃO COMPLETA DA CLT
-- ========================================

-- ETAPA 1: Corrigir Art. 430 (mesclar ID 558 no ID 556)
UPDATE "CLT - Consolidação das Leis do Trabalho"
SET "Artigo" = "Artigo" || E'\n\nParágrafo único. Aos candidatos rejeitados pela seleção profissional deverá ser dada, tanto quanto possível, orientação profissional para ingresso em atividade mais adequada às qualidades e aptidões que tiverem demonstrado.'
WHERE id = 556;

-- Deletar duplicata do Art. 430
DELETE FROM "CLT - Consolidação das Leis do Trabalho" WHERE id = 558;

-- ETAPA 2: Corrigir Art. 511 (mesclar informação do ID 723 no ID 664)
UPDATE "CLT - Consolidação das Leis do Trabalho"
SET "Artigo" = REGEXP_REPLACE("Artigo", '(Parágrafo único\..*?)$', 
  E'\\1\n\n§ 2º As associações profissionais deverão ser constituídas por categoria econômica ou profissional, ou por categoria profissional diferenciada, na forma do art. 577 desta Consolidação.\n\n§ 3º O reconhecimento das centrais sindicais e das federações de trabalhadores dar-se-á mediante o registro no Ministério do Trabalho e Emprego.')
WHERE id = 664;

-- Deletar duplicata do Art. 511
DELETE FROM "CLT - Consolidação das Leis do Trabalho" WHERE id = 723;

-- ETAPA 3: Adicionar artigos revogados faltantes (177, 178, 180, 181, 182, 188, 195, 197)
INSERT INTO "CLT - Consolidação das Leis do Trabalho" ("Número do Artigo", "Artigo", "Aula")
VALUES
  ('177', 'Art. 177. (Revogado pela Lei nº 6.514, de 22 de dezembro de 1977)', 'CAPÍTULO V - SEGURANÇA E MEDICINA DO TRABALHO'),
  ('178', 'Art. 178. (Revogado pela Lei nº 6.514, de 22 de dezembro de 1977)', 'CAPÍTULO V - SEGURANÇA E MEDICINA DO TRABALHO'),
  ('180', 'Art. 180. (Revogado pela Lei nº 6.514, de 22 de dezembro de 1977)', 'CAPÍTULO V - SEGURANÇA E MEDICINA DO TRABALHO'),
  ('181', 'Art. 181. (Revogado pela Lei nº 6.514, de 22 de dezembro de 1977)', 'CAPÍTULO V - SEGURANÇA E MEDICINA DO TRABALHO'),
  ('182', 'Art. 182. (Revogado pela Lei nº 6.514, de 22 de dezembro de 1977)', 'CAPÍTULO V - SEGURANÇA E MEDICINA DO TRABALHO'),
  ('188', 'Art. 188. (Revogado pela Lei nº 6.514, de 22 de dezembro de 1977)', 'CAPÍTULO V - SEGURANÇA E MEDICINA DO TRABALHO'),
  ('195', 'Art. 195. (Revogado pela Lei nº 6.514, de 22 de dezembro de 1977)', 'CAPÍTULO V - SEGURANÇA E MEDICINA DO TRABALHO'),
  ('197', 'Art. 197. (Revogado pela Lei nº 6.514, de 22 de dezembro de 1977)', 'CAPÍTULO V - SEGURANÇA E MEDICINA DO TRABALHO');

-- ETAPA 4: Validação - Verificar duplicatas (deve retornar vazio)
DO $$
DECLARE
  v_duplicatas INTEGER;
  v_total_artigos INTEGER;
  v_artigos_faltantes TEXT;
BEGIN
  -- Contar duplicatas
  SELECT COUNT(*) INTO v_duplicatas
  FROM (
    SELECT "Número do Artigo", COUNT(*) as qtd
    FROM "CLT - Consolidação das Leis do Trabalho"
    WHERE "Número do Artigo" != ''
    GROUP BY "Número do Artigo"
    HAVING COUNT(*) > 1
  ) duplicatas;
  
  -- Contar total de artigos
  SELECT COUNT(*) INTO v_total_artigos
  FROM "CLT - Consolidação das Leis do Trabalho"
  WHERE "Número do Artigo" != '';
  
  -- Log dos resultados
  RAISE NOTICE '============================================';
  RAISE NOTICE 'CORREÇÃO CLT CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total de artigos: %', v_total_artigos;
  RAISE NOTICE 'Duplicatas encontradas: %', v_duplicatas;
  RAISE NOTICE '============================================';
  
  IF v_duplicatas > 0 THEN
    RAISE WARNING 'Ainda existem duplicatas! Revisar.';
  ELSE
    RAISE NOTICE '✓ Nenhuma duplicata encontrada';
  END IF;
  
  IF v_total_artigos >= 1023 THEN
    RAISE NOTICE '✓ Total de artigos correto (esperado: 1023)';
  ELSE
    RAISE WARNING 'Total de artigos abaixo do esperado';
  END IF;
END $$;