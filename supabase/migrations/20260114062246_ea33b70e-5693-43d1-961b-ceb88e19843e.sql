-- Apagar dados de leitura dinâmica do livro "O Príncipe" para re-extração
DELETE FROM "BIBLIOTECA-LEITURA-DINAMICA" WHERE "Titulo da Obra" = 'O Príncipe';

-- Também apagar índice de capítulos se existir
DELETE FROM leitura_livros_indice WHERE livro_titulo = 'O Príncipe';

-- Apagar páginas formatadas se existir
DELETE FROM leitura_paginas_formatadas WHERE livro_titulo = 'O Príncipe';