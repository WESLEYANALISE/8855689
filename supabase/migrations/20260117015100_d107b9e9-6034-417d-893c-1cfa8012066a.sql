-- Resetar tópico 1 para regenerar com nova versão (diagramas via imagem)
UPDATE faculdade_topicos
SET
  conteudo_gerado = NULL,
  status = 'pendente',
  exemplos = NULL,
  termos = NULL,
  flashcards = NULL,
  questoes = NULL,
  imagens_diagramas = '[]'
WHERE id = 1;