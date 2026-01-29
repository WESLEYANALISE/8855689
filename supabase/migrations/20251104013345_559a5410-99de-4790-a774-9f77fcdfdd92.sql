-- Limpar tabela da Lei de Mediação
DELETE FROM "LEI 13140 - MEDIACAO";

-- Inserir todos os registros da TABELA PARA EDITAR na Lei de Mediação
INSERT INTO "LEI 13140 - MEDIACAO" (
  "Número do Artigo",
  "Artigo",
  "Narração",
  "Comentario",
  "Aula",
  "explicacao_tecnico",
  "explicacao_resumido",
  "explicacao_simples_menor16",
  "explicacao_simples_maior16",
  "exemplo",
  "versao_conteudo",
  "termos",
  "termos_aprofundados",
  "flashcards",
  "questoes",
  "ultima_atualizacao",
  "visualizacoes",
  "ultima_visualizacao"
)
SELECT 
  "Número do Artigo",
  "Artigo",
  NULL as "Narração",
  NULL as "Comentario",
  NULL as "Aula",
  NULL as "explicacao_tecnico",
  NULL as "explicacao_resumido",
  NULL as "explicacao_simples_menor16",
  NULL as "explicacao_simples_maior16",
  NULL as "exemplo",
  1 as "versao_conteudo",
  NULL as "termos",
  '{}'::jsonb as "termos_aprofundados",
  NULL as "flashcards",
  NULL as "questoes",
  NULL as "ultima_atualizacao",
  0 as "visualizacoes",
  NULL as "ultima_visualizacao"
FROM "TABELA PARA EDITAR"
ORDER BY id;

-- Validação
DO $$
DECLARE
  total_count INTEGER;
  titulos_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM "LEI 13140 - MEDIACAO";
  SELECT COUNT(*) INTO titulos_count FROM "LEI 13140 - MEDIACAO" WHERE "Número do Artigo" IS NULL;
  
  RAISE NOTICE '✅ Lei 13.140/2015 - Lei de Mediação importada!';
  RAISE NOTICE '📊 Total de registros: %', total_count;
  RAISE NOTICE '📑 Títulos de seção: %', titulos_count;
  RAISE NOTICE '📜 Artigos numerados: %', (total_count - titulos_count);
END $$;