-- Tabela para artigos favoritos
CREATE TABLE public.artigos_favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tabela_codigo TEXT NOT NULL,
  numero_artigo TEXT NOT NULL,
  artigo_id INTEGER NOT NULL,
  conteudo_preview TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tabela_codigo, numero_artigo)
);

-- RLS para favoritos
ALTER TABLE public.artigos_favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON public.artigos_favoritos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON public.artigos_favoritos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON public.artigos_favoritos
  FOR DELETE USING (auth.uid() = user_id);

-- Índices para favoritos
CREATE INDEX idx_artigos_favoritos_user ON public.artigos_favoritos(user_id);
CREATE INDEX idx_artigos_favoritos_codigo ON public.artigos_favoritos(user_id, tabela_codigo);

-- Tabela para grifos/highlights
CREATE TABLE public.artigos_grifos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tabela_codigo TEXT NOT NULL,
  numero_artigo TEXT NOT NULL,
  artigo_id INTEGER NOT NULL,
  highlights JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tabela_codigo, numero_artigo)
);

-- RLS para grifos
ALTER TABLE public.artigos_grifos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own highlights" ON public.artigos_grifos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own highlights" ON public.artigos_grifos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own highlights" ON public.artigos_grifos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own highlights" ON public.artigos_grifos
  FOR DELETE USING (auth.uid() = user_id);

-- Índices para grifos
CREATE INDEX idx_artigos_grifos_user ON public.artigos_grifos(user_id);
CREATE INDEX idx_artigos_grifos_codigo ON public.artigos_grifos(user_id, tabela_codigo);