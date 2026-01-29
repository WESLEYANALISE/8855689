-- Adicionar colunas para sistema de fila e retry (igual OAB Trilhas)
ALTER TABLE conceitos_topicos 
ADD COLUMN IF NOT EXISTS progresso integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS posicao_fila integer,
ADD COLUMN IF NOT EXISTS tentativas integer DEFAULT 0;

-- Limpar todo o conteúdo gerado (mantendo capas)
UPDATE conceitos_topicos
SET 
  conteudo_gerado = NULL,
  exemplos = NULL,
  termos = NULL,
  flashcards = NULL,
  questoes = NULL,
  status = 'pendente',
  progresso = 0,
  posicao_fila = NULL,
  tentativas = 0
WHERE conteudo_gerado IS NOT NULL;