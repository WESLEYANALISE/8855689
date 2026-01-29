-- Criar tabelas para módulo Meu Brasil com Wikipedia

-- Cache de artigos da Wikipedia
CREATE TABLE IF NOT EXISTS public.wikipedia_cache (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT UNIQUE NOT NULL,
  conteudo JSONB NOT NULL,
  imagens JSONB DEFAULT '[]'::jsonb,
  links_relacionados JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Favoritos do usuário
CREATE TABLE IF NOT EXISTS public.wikipedia_favoritos (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, titulo)
);

-- Histórico de consultas
CREATE TABLE IF NOT EXISTS public.wikipedia_historico (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_wikipedia_cache_titulo ON public.wikipedia_cache(titulo);
CREATE INDEX IF NOT EXISTS idx_wikipedia_cache_created ON public.wikipedia_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_wikipedia_favoritos_user ON public.wikipedia_favoritos(user_id);
CREATE INDEX IF NOT EXISTS idx_wikipedia_historico_user ON public.wikipedia_historico(user_id);

-- RLS Policies
ALTER TABLE public.wikipedia_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wikipedia_favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wikipedia_historico ENABLE ROW LEVEL SECURITY;

-- Cache é público para leitura, sistema pode escrever
CREATE POLICY "Cache é público para leitura"
  ON public.wikipedia_cache
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode inserir cache"
  ON public.wikipedia_cache
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar cache"
  ON public.wikipedia_cache
  FOR UPDATE
  USING (true);

-- Favoritos: usuário gerencia apenas seus próprios
CREATE POLICY "Usuários veem seus favoritos"
  ON public.wikipedia_favoritos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem seus favoritos"
  ON public.wikipedia_favoritos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários deletam seus favoritos"
  ON public.wikipedia_favoritos
  FOR DELETE
  USING (auth.uid() = user_id);

-- Histórico: usuário gerencia apenas seu próprio
CREATE POLICY "Usuários veem seu histórico"
  ON public.wikipedia_historico
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem seu histórico"
  ON public.wikipedia_historico
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários deletam seu histórico"
  ON public.wikipedia_historico
  FOR DELETE
  USING (auth.uid() = user_id);