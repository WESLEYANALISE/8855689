-- Corrigir o índice do livro "Justiça: O que é fazer a coisa certa" para refletir que precisa de mais extração
-- O PDF tem 261 páginas, mas só foram extraídas ~40
UPDATE leitura_livros_indice 
SET 
  total_paginas = 261, -- O PDF real tem 261 páginas
  analise_concluida = false -- Marcar para reanálise após extração completa
WHERE livro_titulo ILIKE '%Justiça%' OR livro_titulo ILIKE '%coisa certa%';