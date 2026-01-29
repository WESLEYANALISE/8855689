-- Tabela para cache de artigos do blog político
CREATE TABLE IF NOT EXISTS public.BLOGGER_POLITICO (
  id SERIAL PRIMARY KEY,
  categoria TEXT NOT NULL,
  titulo TEXT NOT NULL,
  termo_wikipedia TEXT,
  fonte TEXT DEFAULT 'wikipedia',
  conteudo_gerado TEXT,
  descricao_curta TEXT,
  imagem_wikipedia TEXT,
  url_capa TEXT,
  url_audio TEXT,
  topicos TEXT[],
  fontes_referencia TEXT[],
  ordem INTEGER DEFAULT 0,
  gerado_em TIMESTAMP WITH TIME ZONE,
  cache_validade TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para cache de notícias políticas
CREATE TABLE IF NOT EXISTS public.noticias_politicas_cache (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  url TEXT NOT NULL,
  fonte TEXT NOT NULL,
  espectro TEXT, -- centro, centro-direita, centro-esquerda
  imagem_url TEXT,
  data_publicacao TIMESTAMP WITH TIME ZONE,
  relevancia_score INTEGER DEFAULT 0,
  resumo_executivo TEXT,
  pontos_principais TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_blogger_politico_categoria ON public.BLOGGER_POLITICO(categoria);
CREATE INDEX IF NOT EXISTS idx_blogger_politico_titulo ON public.BLOGGER_POLITICO(titulo);
CREATE INDEX IF NOT EXISTS idx_noticias_politicas_data ON public.noticias_politicas_cache(data_publicacao DESC);
CREATE INDEX IF NOT EXISTS idx_noticias_politicas_fonte ON public.noticias_politicas_cache(fonte);

-- Enable RLS
ALTER TABLE public.BLOGGER_POLITICO ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticias_politicas_cache ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (conteúdo público)
CREATE POLICY "BLOGGER_POLITICO é público para leitura" ON public.BLOGGER_POLITICO
  FOR SELECT USING (true);

CREATE POLICY "noticias_politicas_cache é público para leitura" ON public.noticias_politicas_cache
  FOR SELECT USING (true);

-- Políticas de inserção/atualização via service role
CREATE POLICY "BLOGGER_POLITICO insert via service" ON public.BLOGGER_POLITICO
  FOR INSERT WITH CHECK (true);

CREATE POLICY "BLOGGER_POLITICO update via service" ON public.BLOGGER_POLITICO
  FOR UPDATE USING (true);

CREATE POLICY "noticias_politicas_cache insert via service" ON public.noticias_politicas_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "noticias_politicas_cache update via service" ON public.noticias_politicas_cache
  FOR UPDATE USING (true);