-- Inserir todos os 153 registros da TABELA PARA EDITAR na LEI 9099 - JUIZADOS CIVEIS
INSERT INTO "LEI 9099 - JUIZADOS CIVEIS" (
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