-- Tabela de progresso do usuário na jornada
CREATE TABLE public.jornada_progresso_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dia_atual INTEGER DEFAULT 1,
  modo TEXT DEFAULT 'misto', -- 'misto' ou 'area'
  area_selecionada TEXT,
  dias_completos JSONB DEFAULT '[]'::jsonb,
  total_dias INTEGER DEFAULT 365,
  streak_atual INTEGER DEFAULT 0,
  maior_streak INTEGER DEFAULT 0,
  ultimo_estudo TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, modo, area_selecionada)
);

-- Enable RLS
ALTER TABLE public.jornada_progresso_usuario ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own jornada progress"
  ON public.jornada_progresso_usuario FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jornada progress"
  ON public.jornada_progresso_usuario FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jornada progress"
  ON public.jornada_progresso_usuario FOR UPDATE
  USING (auth.uid() = user_id);

-- Tabela de conteúdo dos dias (cache)
CREATE TABLE public.jornada_dias_conteudo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dia INTEGER NOT NULL,
  modo TEXT NOT NULL, -- 'misto' ou nome da area específica
  area TEXT NOT NULL,
  tema TEXT NOT NULL,
  codigo_tabela TEXT,
  resumo_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dia, modo)
);

-- Enable RLS (público para leitura)
ALTER TABLE public.jornada_dias_conteudo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read jornada content"
  ON public.jornada_dias_conteudo FOR SELECT
  USING (true);

-- Tabela de atividades do usuário por dia
CREATE TABLE public.jornada_atividades_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dia INTEGER NOT NULL,
  modo TEXT NOT NULL,
  etapa TEXT NOT NULL, -- 'leitura', 'pratica', 'conceitos', 'flashcards', 'quiz'
  completado BOOLEAN DEFAULT FALSE,
  pontuacao INTEGER DEFAULT 0,
  tempo_gasto INTEGER DEFAULT 0, -- segundos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, dia, modo, etapa)
);

-- Enable RLS
ALTER TABLE public.jornada_atividades_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jornada activities"
  ON public.jornada_atividades_usuario FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jornada activities"
  ON public.jornada_atividades_usuario FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jornada activities"
  ON public.jornada_atividades_usuario FOR UPDATE
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_jornada_progresso_user ON public.jornada_progresso_usuario(user_id);
CREATE INDEX idx_jornada_dias_modo ON public.jornada_dias_conteudo(modo, dia);
CREATE INDEX idx_jornada_atividades_user_dia ON public.jornada_atividades_usuario(user_id, dia, modo);

-- Trigger para updated_at
CREATE TRIGGER update_jornada_progresso_updated_at
  BEFORE UPDATE ON public.jornada_progresso_usuario
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();