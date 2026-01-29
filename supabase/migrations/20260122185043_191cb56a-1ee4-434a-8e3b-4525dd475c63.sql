-- Limpar conteúdo dos tópicos de História do Direito (materia_id = 58) para regeneração
UPDATE conceitos_topicos 
SET 
  conteudo_gerado = NULL,
  exemplos = NULL,
  termos = NULL,
  flashcards = NULL,
  questoes = NULL,
  status = 'pendente'
WHERE materia_id = 58;