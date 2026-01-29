-- Adicionar coluna para análise de IA nos documentários
ALTER TABLE public.documentarios_juridicos 
ADD COLUMN IF NOT EXISTS analise_ia TEXT;