-- Adicionar colunas para backgrounds responsivos
ALTER TABLE tres_poderes_config 
ADD COLUMN IF NOT EXISTS background_mobile TEXT,
ADD COLUMN IF NOT EXISTS background_tablet TEXT,
ADD COLUMN IF NOT EXISTS background_desktop TEXT;