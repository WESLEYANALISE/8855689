-- Resetar tópico para regenerar com diagramas corretos
UPDATE faculdade_topicos
SET
  conteudo_gerado = NULL,
  status = 'pendente',
  exemplos = NULL,
  termos = NULL,
  flashcards = NULL,
  questoes = NULL
WHERE id = 2;