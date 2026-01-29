-- Limpar todo o conteúdo gerado dos tópicos da faculdade para regeneração
UPDATE faculdade_topicos
SET 
  conteudo_gerado = NULL,
  exemplos = NULL,
  termos = NULL,
  flashcards = NULL,
  questoes = NULL,
  status = 'pendente',
  imagens_diagramas = NULL
WHERE conteudo_gerado IS NOT NULL;