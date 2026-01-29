-- Adicionar colunas extras se não existirem
ALTER TABLE public.leitura_interativa 
ADD COLUMN IF NOT EXISTS capas_capitulos JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS texto_formatado_cache JSONB DEFAULT NULL;

-- Atualizar URL da capa do livro O Espírito das Leis
UPDATE public.leitura_interativa 
SET capa_url = 'https://m.media-amazon.com/images/I/71ZE6Xl4y6L._SL1500_.jpg'
WHERE biblioteca_classicos_id = 130;