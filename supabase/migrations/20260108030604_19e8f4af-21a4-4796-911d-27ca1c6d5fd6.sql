-- Atualizar a capa de "A Sociedade Aberta e Seus Inimigos" com URL do Google Books
UPDATE "BIBLIOTECA-POLITICA" 
SET imagem = 'https://books.google.com/books/content?id=4EJjCgAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' 
WHERE livro ILIKE '%sociedade aberta%';