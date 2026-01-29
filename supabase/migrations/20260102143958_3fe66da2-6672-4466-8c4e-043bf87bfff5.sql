-- Tabela para leis/códigos favoritos do usuário
CREATE TABLE public.leis_favoritas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL, -- 'codigos', 'estatutos', 'legislacao_penal', 'previdenciario', 'sumulas', 'leis_ordinarias'
  lei_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  sigla TEXT,
  cor TEXT,
  route TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, categoria, lei_id)
);

-- Índice para busca rápida
CREATE INDEX idx_leis_favoritas_user ON public.leis_favoritas(user_id, categoria);

-- RLS
ALTER TABLE public.leis_favoritas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver seus favoritos" 
ON public.leis_favoritas FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios podem inserir favoritos" 
ON public.leis_favoritas FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios podem deletar favoritos" 
ON public.leis_favoritas FOR DELETE 
USING (auth.uid() = user_id);

-- Tabela para leis/códigos recentes do usuário
CREATE TABLE public.leis_recentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  lei_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  sigla TEXT,
  cor TEXT,
  route TEXT NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, categoria, lei_id)
);

-- Índice para busca rápida e ordenação
CREATE INDEX idx_leis_recentes_user ON public.leis_recentes(user_id, categoria, accessed_at DESC);

-- RLS
ALTER TABLE public.leis_recentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver seus recentes" 
ON public.leis_recentes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios podem inserir recentes" 
ON public.leis_recentes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios podem atualizar recentes" 
ON public.leis_recentes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios podem deletar recentes" 
ON public.leis_recentes FOR DELETE 
USING (auth.uid() = user_id);