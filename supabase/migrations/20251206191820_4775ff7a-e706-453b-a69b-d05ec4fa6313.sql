-- Adicionar colunas para suportar imagens e áudio do exemplo nos flashcards de artigos de lei
ALTER TABLE public."FLASHCARDS - ARTIGOS LEI"
ADD COLUMN IF NOT EXISTS id SERIAL,
ADD COLUMN IF NOT EXISTS url_imagem_exemplo TEXT,
ADD COLUMN IF NOT EXISTS url_audio_exemplo TEXT;

-- Garantir que a coluna id é a primary key (se ainda não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'FLASHCARDS - ARTIGOS LEI' 
    AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE public."FLASHCARDS - ARTIGOS LEI" ADD PRIMARY KEY (id);
  END IF;
END $$;