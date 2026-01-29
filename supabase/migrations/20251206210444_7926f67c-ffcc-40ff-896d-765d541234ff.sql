-- Deletar flashcards sem exemplo da tabela de artigos de lei
DELETE FROM "FLASHCARDS - ARTIGOS LEI" 
WHERE exemplo IS NULL OR exemplo = '';