-- Adicionar colunas de flashcards e questões à tabela CURSOS-APP
ALTER TABLE "CURSOS-APP" 
ADD COLUMN IF NOT EXISTS flashcards jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS questoes jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS conteudo_gerado_em timestamp with time zone DEFAULT NULL;

-- Comentários para documentar as colunas
COMMENT ON COLUMN "CURSOS-APP".flashcards IS 'Flashcards gerados pela IA para o tema da aula';
COMMENT ON COLUMN "CURSOS-APP".questoes IS 'Questões de múltipla escolha geradas pela IA para o tema da aula';
COMMENT ON COLUMN "CURSOS-APP".conteudo_gerado_em IS 'Data e hora em que o conteúdo foi gerado pela primeira vez';