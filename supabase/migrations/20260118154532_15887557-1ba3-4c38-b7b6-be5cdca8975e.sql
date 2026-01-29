-- Limpar conteúdo gerado para regeneração com novo prompt (mantém capas)
UPDATE conceitos_topicos
SET 
  conteudo_gerado = NULL,
  exemplos = NULL,
  termos = NULL,
  flashcards = NULL,
  questoes = NULL,
  url_narracao = NULL,
  status = 'pendente'
WHERE conteudo_gerado IS NOT NULL;