-- Adicionar coluna categoria na tabela documentarios_juridicos
ALTER TABLE public.documentarios_juridicos 
ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'destaque';

-- Criar índice para busca por categoria
CREATE INDEX IF NOT EXISTS idx_documentarios_categoria ON public.documentarios_juridicos(categoria);