-- Adicionar coluna links_relacionados para instituições
ALTER TABLE meu_brasil_instituicoes 
ADD COLUMN IF NOT EXISTS links_relacionados jsonb DEFAULT '[]'::jsonb;