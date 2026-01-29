-- Criar tabela de jurisprudências favoritas
CREATE TABLE IF NOT EXISTS public.jurisprudencias_favoritas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  numero_processo TEXT NOT NULL,
  tribunal TEXT NOT NULL,
  orgao_julgador TEXT,
  data_julgamento DATE,
  ementa TEXT NOT NULL,
  link TEXT NOT NULL,
  tema_juridico TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, numero_processo)
);

-- Habilitar RLS
ALTER TABLE public.jurisprudencias_favoritas ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seus próprios favoritos
CREATE POLICY "Users can view own favorites"
  ON public.jurisprudencias_favoritas
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuários podem adicionar favoritos
CREATE POLICY "Users can insert own favorites"
  ON public.jurisprudencias_favoritas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem deletar seus favoritos
CREATE POLICY "Users can delete own favorites"
  ON public.jurisprudencias_favoritas
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Usuários podem atualizar seus favoritos
CREATE POLICY "Users can update own favorites"
  ON public.jurisprudencias_favoritas
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX idx_jurisprudencias_user_id ON public.jurisprudencias_favoritas(user_id);
CREATE INDEX idx_jurisprudencias_tema ON public.jurisprudencias_favoritas(tema_juridico);
CREATE INDEX idx_jurisprudencias_tribunal ON public.jurisprudencias_favoritas(tribunal);
CREATE INDEX idx_jurisprudencias_created_at ON public.jurisprudencias_favoritas(created_at DESC);