-- Adicionar coluna de narração aos tópicos da faculdade
ALTER TABLE public.faculdade_topicos 
ADD COLUMN IF NOT EXISTS url_narracao TEXT;