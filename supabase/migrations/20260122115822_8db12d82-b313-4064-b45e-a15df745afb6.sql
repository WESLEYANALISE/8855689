-- Limpar conteúdo gerado dos tópicos de "História do Direito" (materia_id = 58)
-- para forçar regeneração a partir do PDF
UPDATE conceitos_topicos
SET
  conteudo_gerado = NULL,
  status = 'pendente',
  capa_url = NULL,
  exemplos = NULL,
  termos = NULL,
  flashcards = NULL,
  questoes = NULL,
  updated_at = now()
WHERE materia_id = 58;