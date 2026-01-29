-- Adicionar coluna complemento na tabela faculdade_topicos
ALTER TABLE public.faculdade_topicos 
ADD COLUMN IF NOT EXISTS complemento TEXT;