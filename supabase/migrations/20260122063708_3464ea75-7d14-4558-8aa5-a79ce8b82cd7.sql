-- Adicionar campos de processamento PDF na tabela conceitos_materias
ALTER TABLE conceitos_materias 
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS status_processamento TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS total_paginas INTEGER,
ADD COLUMN IF NOT EXISTS temas_identificados JSONB DEFAULT '[]';

COMMENT ON COLUMN conceitos_materias.status_processamento IS 'pendente | extraindo | identificando | aguardando_confirmacao | pronto';

-- Criar tabela para armazenar páginas extraídas do PDF
CREATE TABLE IF NOT EXISTS conceitos_materia_paginas (
  id SERIAL PRIMARY KEY,
  materia_id INTEGER REFERENCES conceitos_materias(id) ON DELETE CASCADE,
  pagina INTEGER NOT NULL,
  conteudo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(materia_id, pagina)
);

-- Habilitar RLS
ALTER TABLE conceitos_materia_paginas ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Leitura pública das páginas" ON conceitos_materia_paginas
FOR SELECT USING (true);

-- Política de inserção para service role
CREATE POLICY "Service role pode inserir páginas" ON conceitos_materia_paginas
FOR INSERT WITH CHECK (true);

-- Política de atualização para service role
CREATE POLICY "Service role pode atualizar páginas" ON conceitos_materia_paginas
FOR UPDATE USING (true);

-- Política de deleção para service role
CREATE POLICY "Service role pode deletar páginas" ON conceitos_materia_paginas
FOR DELETE USING (true);

-- Índice para busca rápida por matéria
CREATE INDEX IF NOT EXISTS idx_conceitos_materia_paginas_materia_id ON conceitos_materia_paginas(materia_id);
CREATE INDEX IF NOT EXISTS idx_conceitos_materia_paginas_pagina ON conceitos_materia_paginas(materia_id, pagina);