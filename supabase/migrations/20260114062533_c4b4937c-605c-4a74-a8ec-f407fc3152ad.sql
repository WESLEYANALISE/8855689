-- Apagar dados de leitura dinâmica do livro "O Caso dos Exploradores de Cavernas" para re-extração
DELETE FROM "BIBLIOTECA-LEITURA-DINAMICA" WHERE "Titulo da Obra" ILIKE '%Exploradores de Cavernas%';

-- Também apagar índice de capítulos se existir
DELETE FROM leitura_livros_indice WHERE livro_titulo ILIKE '%Exploradores de Cavernas%';

-- Apagar páginas formatadas se existir
DELETE FROM leitura_paginas_formatadas WHERE livro_titulo ILIKE '%Exploradores de Cavernas%';