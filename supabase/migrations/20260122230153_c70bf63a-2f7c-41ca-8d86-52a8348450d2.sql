-- Criar tabela para armazenar páginas extraídas do PDF de Ética
CREATE TABLE IF NOT EXISTS oab_etica_paginas (
  id SERIAL PRIMARY KEY,
  pagina INTEGER NOT NULL,
  conteudo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar colunas de paginação na tabela de temas de ética (se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oab_etica_temas' AND column_name = 'pagina_inicial') THEN
    ALTER TABLE oab_etica_temas ADD COLUMN pagina_inicial INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oab_etica_temas' AND column_name = 'pagina_final') THEN
    ALTER TABLE oab_etica_temas ADD COLUMN pagina_final INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oab_etica_temas' AND column_name = 'subtopicos') THEN
    ALTER TABLE oab_etica_temas ADD COLUMN subtopicos JSONB;
  END IF;
END $$;