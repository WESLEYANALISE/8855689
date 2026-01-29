-- Limpar dados formatados do livro para reformatar com Markdown correto
DELETE FROM leitura_paginas_formatadas WHERE livro_titulo ILIKE '%exploradores%';

-- Limpar também o índice para garantir uma nova análise
DELETE FROM leitura_livros_indice WHERE livro_titulo ILIKE '%exploradores%';