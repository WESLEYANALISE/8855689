
-- Deletar páginas extraídas de "Dos Delitos e das Penas" e "Justiça: O que é fazer a coisa certa"
DELETE FROM "BIBLIOTECA-LEITURA-DINAMICA" 
WHERE "Titulo da Obra" ILIKE '%Justiça%' 
   OR "Titulo da Obra" ILIKE '%coisa certa%'
   OR "Titulo da Obra" ILIKE '%Delitos%' 
   OR "Titulo da Obra" ILIKE '%Penas%';

-- Deletar índices desses livros
DELETE FROM leitura_livros_indice 
WHERE livro_titulo ILIKE '%Justiça%' 
   OR livro_titulo ILIKE '%coisa certa%'
   OR livro_titulo ILIKE '%Delitos%' 
   OR livro_titulo ILIKE '%Penas%';
