-- Adicionar coluna base_legal na tabela FLASHCARDS_GERADOS
ALTER TABLE public."FLASHCARDS_GERADOS" ADD COLUMN IF NOT EXISTS base_legal TEXT;

-- Adicionar coluna base_legal na tabela FLASHCARDS - ARTIGOS LEI
ALTER TABLE public."FLASHCARDS - ARTIGOS LEI" ADD COLUMN IF NOT EXISTS base_legal TEXT;