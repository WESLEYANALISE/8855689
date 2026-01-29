-- Adicionar campos de processamento de PDF na tabela oab_trilhas_materias
ALTER TABLE oab_trilhas_materias
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS status_processamento TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS total_paginas INTEGER,
ADD COLUMN IF NOT EXISTS temas_identificados JSONB;

-- Criar tabela para armazenar páginas extraídas do PDF
CREATE TABLE IF NOT EXISTS oab_trilhas_materia_paginas (
  id SERIAL PRIMARY KEY,
  materia_id INTEGER REFERENCES oab_trilhas_materias(id) ON DELETE CASCADE,
  pagina INTEGER NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(materia_id, pagina)
);

-- Habilitar RLS
ALTER TABLE oab_trilhas_materia_paginas ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (conteúdo educacional)
CREATE POLICY "Páginas são visíveis para todos" 
ON oab_trilhas_materia_paginas 
FOR SELECT 
USING (true);

-- Adicionar campos de paginação em oab_trilhas_topicos
ALTER TABLE oab_trilhas_topicos
ADD COLUMN IF NOT EXISTS pagina_inicial INTEGER,
ADD COLUMN IF NOT EXISTS pagina_final INTEGER,
ADD COLUMN IF NOT EXISTS subtopicos JSONB;