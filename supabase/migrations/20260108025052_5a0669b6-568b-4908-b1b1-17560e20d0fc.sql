-- Deletar livros que NÃO estão nas pastas do Drive (sem link)
DELETE FROM "BIBLIOTECA-POLITICA" 
WHERE link IS NULL;