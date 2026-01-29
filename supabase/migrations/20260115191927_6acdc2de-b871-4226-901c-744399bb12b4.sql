-- Inserir livros de Português na tabela exclusiva
INSERT INTO "BIBLIOTECA-PORTUGUES" (area, livro, autor, link, imagem, sobre, download, "Capa-area")
SELECT 'Português' as area, "Tema" as livro, NULL as autor, "Link" as link, "Capa-livro" as imagem, "Sobre" as sobre, "Download" as download, "Capa-area"
FROM "BIBLIOTECA-ESTUDOS" 
WHERE "Área" = 'Portugues';

-- Inserir livros de Pesquisa Científica na tabela exclusiva
INSERT INTO "BIBLIOTECA-PESQUISA-CIENTIFICA" (area, livro, autor, link, imagem, sobre, download, "Capa-area")
SELECT 'Pesquisa Científica' as area, "Tema" as livro, NULL as autor, "Link" as link, "Capa-livro" as imagem, "Sobre" as sobre, "Download" as download, "Capa-area"
FROM "BIBLIOTECA-ESTUDOS" 
WHERE "Área" = 'Pesquisa Científica';

-- Inserir capas na tabela de capas
INSERT INTO "CAPA-BIBILIOTECA" (id, "Biblioteca", capa) VALUES
(102, 'Biblioteca de Português', 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/CAPAS/biblioteca-estudos/1423-1765977562671.webp'),
(103, 'Biblioteca de Pesquisa Científica', 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/CAPAS/biblioteca-estudos/1407-1768502865328.webp');