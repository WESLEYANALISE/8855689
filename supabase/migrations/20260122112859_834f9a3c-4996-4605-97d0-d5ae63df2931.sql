-- Adicionar coluna para armazenar os subtópicos (tópicos) de cada tema
-- Os subtópicos serão usados na geração de conteúdo
ALTER TABLE conceitos_topicos 
ADD COLUMN IF NOT EXISTS topicos_indice JSONB;

-- Comentário explicativo
COMMENT ON COLUMN conceitos_topicos.topicos_indice IS 'Subtópicos extraídos do índice do PDF para este tema/capítulo. Usado na geração de conteúdo.';