-- Tabela para armazenar páginas extraídas dos livros clássicos
CREATE TABLE IF NOT EXISTS biblioteca_classicos_paginas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livro_id bigint NOT NULL,
  pagina integer NOT NULL,
  conteudo text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(livro_id, pagina)
);

-- Tabela para armazenar temas/capítulos identificados
CREATE TABLE IF NOT EXISTS biblioteca_classicos_temas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livro_id bigint NOT NULL,
  ordem integer NOT NULL,
  titulo text NOT NULL,
  resumo text,
  pagina_inicial integer,
  pagina_final integer,
  status text DEFAULT 'pendente',
  conteudo_markdown text,
  flashcards jsonb,
  questoes jsonb,
  exemplos text,
  termos jsonb,
  capa_url text,
  audio_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar colunas de status à tabela principal BIBLIOTECA-CLASSICOS
ALTER TABLE "BIBLIOTECA-CLASSICOS" 
ADD COLUMN IF NOT EXISTS analise_status text DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS total_paginas integer,
ADD COLUMN IF NOT EXISTS total_temas integer;

-- Habilitar RLS nas novas tabelas
ALTER TABLE biblioteca_classicos_paginas ENABLE ROW LEVEL SECURITY;
ALTER TABLE biblioteca_classicos_temas ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para leitura (conteúdo educacional)
CREATE POLICY "Paginas são visíveis para todos" 
ON biblioteca_classicos_paginas 
FOR SELECT 
USING (true);

CREATE POLICY "Temas são visíveis para todos" 
ON biblioteca_classicos_temas 
FOR SELECT 
USING (true);

-- Políticas para operações via service role (inserção/atualização)
CREATE POLICY "Service role pode inserir paginas" 
ON biblioteca_classicos_paginas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role pode atualizar paginas" 
ON biblioteca_classicos_paginas 
FOR UPDATE 
USING (true);

CREATE POLICY "Service role pode deletar paginas" 
ON biblioteca_classicos_paginas 
FOR DELETE 
USING (true);

CREATE POLICY "Service role pode inserir temas" 
ON biblioteca_classicos_temas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role pode atualizar temas" 
ON biblioteca_classicos_temas 
FOR UPDATE 
USING (true);

CREATE POLICY "Service role pode deletar temas" 
ON biblioteca_classicos_temas 
FOR DELETE 
USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_classicos_paginas_livro ON biblioteca_classicos_paginas(livro_id);
CREATE INDEX IF NOT EXISTS idx_classicos_temas_livro ON biblioteca_classicos_temas(livro_id);
CREATE INDEX IF NOT EXISTS idx_classicos_temas_status ON biblioteca_classicos_temas(status);