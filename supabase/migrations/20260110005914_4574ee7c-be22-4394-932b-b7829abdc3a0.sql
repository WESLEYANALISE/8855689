-- Tabela para rastrear acessos às bibliotecas
CREATE TABLE public.bibliotecas_acessos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biblioteca_tabela TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  area TEXT,
  livro TEXT,
  user_id UUID,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bibliotecas_acessos ENABLE ROW LEVEL SECURITY;

-- Policies - permitir inserção e leitura pública
CREATE POLICY "Permitir inserir acessos" ON public.bibliotecas_acessos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir ler acessos" ON public.bibliotecas_acessos
  FOR SELECT USING (true);

-- Índices para performance
CREATE INDEX idx_bibliotecas_acessos_tabela ON public.bibliotecas_acessos(biblioteca_tabela);
CREATE INDEX idx_bibliotecas_acessos_created ON public.bibliotecas_acessos(created_at);
CREATE INDEX idx_bibliotecas_acessos_item ON public.bibliotecas_acessos(biblioteca_tabela, item_id);