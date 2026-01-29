-- Adicionar coluna para imagem do comentário na tabela SIMULADO-OAB
ALTER TABLE public."SIMULADO-OAB" 
ADD COLUMN IF NOT EXISTS url_imagem_comentario TEXT;