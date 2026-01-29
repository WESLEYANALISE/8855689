-- Adicionar colunas para cache das explicações na tabela resenha_diaria
ALTER TABLE public.resenha_diaria 
ADD COLUMN IF NOT EXISTS explicacao_lei TEXT,
ADD COLUMN IF NOT EXISTS explicacoes_artigos JSONB DEFAULT '{}'::jsonb;

-- Comentários para documentação
COMMENT ON COLUMN public.resenha_diaria.explicacao_lei IS 'Cache da explicação da lei completa gerada pela IA';
COMMENT ON COLUMN public.resenha_diaria.explicacoes_artigos IS 'Cache das explicações individuais de cada artigo (formato: {"0": "explicação...", "1": "explicação..."})';
