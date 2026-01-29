-- Adicionar colunas para análise de estrutura
ALTER TABLE public.leitura_livros_indice 
ADD COLUMN IF NOT EXISTS paginas_ignoradas integer[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS primeira_pagina_conteudo integer DEFAULT 1;