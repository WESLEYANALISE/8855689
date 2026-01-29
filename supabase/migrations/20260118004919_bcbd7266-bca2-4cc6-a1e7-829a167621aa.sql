-- Resetar todos os tópicos da matéria História do Direito (id=18)
UPDATE conceitos_topicos 
SET 
  status = 'pendente',
  conteudo_gerado = NULL,
  exemplos = NULL,
  termos = NULL,
  flashcards = NULL,
  questoes = NULL,
  capa_url = NULL,
  url_narracao = NULL,
  updated_at = now()
WHERE materia_id = 18;