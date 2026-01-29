-- Corrigir primeira_pagina_conteudo para começar na página 1
UPDATE leitura_livros_indice 
SET primeira_pagina_conteudo = 1 
WHERE livro_titulo ILIKE '%Exploradores de Cavernas%';