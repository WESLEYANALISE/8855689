-- Adicionar colunas de página inicial e final na tabela de temas
ALTER TABLE oab_trilhas_temas 
ADD COLUMN IF NOT EXISTS pagina_inicial INTEGER,
ADD COLUMN IF NOT EXISTS pagina_final INTEGER;