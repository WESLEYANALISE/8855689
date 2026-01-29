-- Remove NOT NULL constraint from livro_id to allow using livro_titulo instead
ALTER TABLE public.leitura_paginas_formatadas ALTER COLUMN livro_id DROP NOT NULL;