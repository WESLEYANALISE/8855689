-- Limpar todas as tabelas de conceitos para recomeçar do zero

-- Deletar tópicos (dependem de matérias)
DELETE FROM conceitos_topicos;

-- Deletar páginas extraídas de matérias
DELETE FROM conceitos_materia_paginas;

-- Deletar matérias
DELETE FROM conceitos_materias;

-- Deletar temas de livros (se existir)
DELETE FROM conceitos_livro_temas;

-- Deletar páginas de livros (se existir)
DELETE FROM conceitos_livro_paginas;

-- Deletar trilhas
DELETE FROM conceitos_trilhas;