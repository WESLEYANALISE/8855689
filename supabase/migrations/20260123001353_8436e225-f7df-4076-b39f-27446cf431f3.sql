-- Limpar conteúdo gerado de todos os tópicos de Direito Constitucional para regerar
UPDATE oab_trilhas_topicos 
SET 
  conteudo_gerado = NULL,
  flashcards = NULL,
  questoes = NULL,
  termos = NULL,
  exemplos = NULL,
  capa_url = NULL,
  status = 'pendente'
WHERE materia_id = 3;