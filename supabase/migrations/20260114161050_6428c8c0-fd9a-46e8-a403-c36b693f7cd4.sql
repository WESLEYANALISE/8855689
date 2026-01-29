-- Limpar dados antigos para reprocessar o livro com as correções

-- 1. Deletar OCR antigo (corrompido)
DELETE FROM "BIBLIOTECA-LEITURA-DINAMICA" 
WHERE "Titulo da Obra" = 'O Caso dos Exploradores de Cavernas';

-- 2. Deletar páginas formatadas antigas
DELETE FROM leitura_paginas_formatadas 
WHERE livro_titulo = 'O Caso dos Exploradores de Cavernas';

-- 3. Deletar índice de capítulos antigo
DELETE FROM leitura_livros_indice 
WHERE livro_titulo = 'O Caso dos Exploradores de Cavernas';