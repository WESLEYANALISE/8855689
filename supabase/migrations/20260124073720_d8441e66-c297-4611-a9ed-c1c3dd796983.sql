-- Limpar conteúdo gerado do tópico 501 para permitir regeneração
UPDATE oab_trilhas_topicos 
SET conteudo_gerado = NULL, 
    exemplos = NULL, 
    termos = NULL, 
    flashcards = NULL, 
    questoes = NULL, 
    status = 'pendente',
    updated_at = NOW()
WHERE id = 501;