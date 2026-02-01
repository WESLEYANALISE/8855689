-- Adicionar coluna slides_json na tabela RESUMO para armazenar conteúdo estruturado
ALTER TABLE public."RESUMO" 
ADD COLUMN IF NOT EXISTS slides_json JSONB;