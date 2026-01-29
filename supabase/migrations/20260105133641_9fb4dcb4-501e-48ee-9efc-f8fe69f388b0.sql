-- Limpar todas as capas de artigos políticos para regeneração
UPDATE politica_blog_orientacao 
SET imagem_url = NULL 
WHERE imagem_url IS NOT NULL;