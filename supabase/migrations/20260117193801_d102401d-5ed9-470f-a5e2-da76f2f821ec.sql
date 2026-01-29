-- Adicionar colunas para armazenar conteúdo gerado pela IA
ALTER TABLE public.conceitos_livro_temas 
ADD COLUMN IF NOT EXISTS conteudo_markdown TEXT,
ADD COLUMN IF NOT EXISTS flashcards JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS questoes JSONB DEFAULT '[]'::jsonb;