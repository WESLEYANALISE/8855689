-- Resetar conteúdo existente dos tópicos de conceitos para regeneração com novas funcionalidades
UPDATE conceitos_topicos
SET 
  conteudo_gerado = NULL,
  exemplos = NULL,
  termos = NULL,
  flashcards = NULL,
  questoes = NULL,
  url_narracao = NULL,
  status = 'pendente',
  updated_at = now()
WHERE conteudo_gerado IS NOT NULL;