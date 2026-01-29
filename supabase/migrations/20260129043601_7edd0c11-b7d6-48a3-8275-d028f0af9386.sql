-- Reset dos 3 tópicos para regenerar com 8 páginas
UPDATE conceitos_topicos 
SET 
  status = 'pendente',
  progresso = 0,
  tentativas = 0,
  conteudo_gerado = NULL,
  posicao_fila = NULL,
  updated_at = NOW()
WHERE id IN (521, 523, 524);

-- Também limpar outros campos gerados
UPDATE conceitos_topicos 
SET 
  flashcards = NULL,
  questoes = NULL,
  exemplos = NULL,
  termos = NULL
WHERE id IN (521, 523, 524);