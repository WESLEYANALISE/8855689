-- Criar tabela de jogos jurídicos (cache)
CREATE TABLE IF NOT EXISTS public.jogos_juridicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('forca', 'cruzadas', 'caca_palavras', 'stop')),
  fonte_tipo TEXT NOT NULL CHECK (fonte_tipo IN ('artigo', 'tema')),
  fonte_id TEXT NOT NULL,
  fonte_nome TEXT NOT NULL,
  dificuldade TEXT NOT NULL CHECK (dificuldade IN ('facil', 'medio', 'dificil')),
  dados_jogo JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cache_validade TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  UNIQUE(tipo, fonte_tipo, fonte_id, dificuldade)
);

-- Criar tabela de estatísticas
CREATE TABLE IF NOT EXISTS public.estatisticas_jogos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  jogo_id UUID REFERENCES public.jogos_juridicos(id) ON DELETE CASCADE,
  tipo_jogo TEXT NOT NULL,
  pontuacao INTEGER NOT NULL DEFAULT 0,
  tempo_segundos INTEGER,
  estrelas INTEGER CHECK (estrelas >= 0 AND estrelas <= 3),
  precisao NUMERIC(5,2),
  completado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de ranking
CREATE TABLE IF NOT EXISTS public.ranking_jogos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_jogo TEXT NOT NULL,
  pontuacao_total INTEGER NOT NULL DEFAULT 0,
  jogos_completados INTEGER DEFAULT 0,
  media_estrelas NUMERIC(3,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, tipo_jogo)
);

-- Criar tabela de conquistas
CREATE TABLE IF NOT EXISTS public.conquistas_jogos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conquista_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT,
  desbloqueado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, conquista_id)
);

-- Enable RLS
ALTER TABLE public.jogos_juridicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estatisticas_jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conquistas_jogos ENABLE ROW LEVEL SECURITY;

-- Policies para jogos_juridicos (cache público para leitura)
CREATE POLICY "Jogos são públicos para leitura"
  ON public.jogos_juridicos FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode inserir jogos"
  ON public.jogos_juridicos FOR INSERT
  WITH CHECK (true);

-- Policies para estatisticas_jogos
CREATE POLICY "Usuários veem suas próprias estatísticas"
  ON public.estatisticas_jogos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas estatísticas"
  ON public.estatisticas_jogos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies para ranking_jogos
CREATE POLICY "Ranking é público para leitura"
  ON public.ranking_jogos FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio ranking"
  ON public.ranking_jogos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem modificar seu ranking"
  ON public.ranking_jogos FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies para conquistas
CREATE POLICY "Usuários veem suas próprias conquistas"
  ON public.conquistas_jogos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem desbloquear conquistas"
  ON public.conquistas_jogos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX idx_jogos_juridicos_tipo_fonte ON public.jogos_juridicos(tipo, fonte_tipo, fonte_id);
CREATE INDEX idx_estatisticas_user ON public.estatisticas_jogos(user_id);
CREATE INDEX idx_ranking_tipo ON public.ranking_jogos(tipo_jogo, pontuacao_total DESC);
CREATE INDEX idx_conquistas_user ON public.conquistas_jogos(user_id);