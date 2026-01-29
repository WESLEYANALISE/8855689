-- Adicionar coluna para armazenar imagens de diagramas geradas via IA
ALTER TABLE faculdade_topicos
ADD COLUMN IF NOT EXISTS imagens_diagramas JSONB DEFAULT '[]';

-- Adicionar comentário explicativo
COMMENT ON COLUMN faculdade_topicos.imagens_diagramas IS 'Array de objetos com {tipo, titulo, url} das imagens de diagramas geradas via NanoBanana';

-- Resetar tópico 2 para teste do novo sistema
UPDATE faculdade_topicos
SET
  conteudo_gerado = NULL,
  status = 'pendente',
  exemplos = NULL,
  termos = NULL,
  flashcards = NULL,
  questoes = NULL,
  imagens_diagramas = '[]'
WHERE id = 2;