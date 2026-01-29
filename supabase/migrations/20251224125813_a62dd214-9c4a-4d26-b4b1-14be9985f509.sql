-- Tabela de rankings de despesas de senadores
CREATE TABLE public.ranking_senadores_despesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  senador_codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  partido TEXT,
  uf TEXT,
  foto_url TEXT,
  total_gasto NUMERIC DEFAULT 0,
  mes INTEGER,
  ano INTEGER NOT NULL,
  posicao INTEGER,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(senador_codigo, mes, ano)
);

-- Tabela de rankings de discursos de senadores
CREATE TABLE public.ranking_senadores_discursos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  senador_codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  partido TEXT,
  uf TEXT,
  foto_url TEXT,
  total_discursos INTEGER DEFAULT 0,
  ano INTEGER NOT NULL,
  posicao INTEGER,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(senador_codigo, ano)
);

-- Tabela de rankings de comissões de senadores
CREATE TABLE public.ranking_senadores_comissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  senador_codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  partido TEXT,
  uf TEXT,
  foto_url TEXT,
  total_comissoes INTEGER DEFAULT 0,
  posicao INTEGER,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(senador_codigo)
);

-- Tabela de rankings de votações de senadores
CREATE TABLE public.ranking_senadores_votacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  senador_codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  partido TEXT,
  uf TEXT,
  foto_url TEXT,
  total_votacoes INTEGER DEFAULT 0,
  ano INTEGER NOT NULL,
  posicao INTEGER,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(senador_codigo, ano)
);

-- Tabela de rankings de matérias/proposições de senadores
CREATE TABLE public.ranking_senadores_materias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  senador_codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  partido TEXT,
  uf TEXT,
  foto_url TEXT,
  total_materias INTEGER DEFAULT 0,
  ano INTEGER NOT NULL,
  posicao INTEGER,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(senador_codigo, ano)
);

-- Índices para performance
CREATE INDEX idx_ranking_sen_despesas_ano ON public.ranking_senadores_despesas(ano);
CREATE INDEX idx_ranking_sen_despesas_posicao ON public.ranking_senadores_despesas(posicao);
CREATE INDEX idx_ranking_sen_discursos_ano ON public.ranking_senadores_discursos(ano);
CREATE INDEX idx_ranking_sen_discursos_posicao ON public.ranking_senadores_discursos(posicao);
CREATE INDEX idx_ranking_sen_comissoes_posicao ON public.ranking_senadores_comissoes(posicao);
CREATE INDEX idx_ranking_sen_votacoes_ano ON public.ranking_senadores_votacoes(ano);
CREATE INDEX idx_ranking_sen_votacoes_posicao ON public.ranking_senadores_votacoes(posicao);
CREATE INDEX idx_ranking_sen_materias_ano ON public.ranking_senadores_materias(ano);
CREATE INDEX idx_ranking_sen_materias_posicao ON public.ranking_senadores_materias(posicao);

-- Enable RLS
ALTER TABLE public.ranking_senadores_despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_senadores_discursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_senadores_comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_senadores_votacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_senadores_materias ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
CREATE POLICY "Ranking senadores despesas público" ON public.ranking_senadores_despesas FOR SELECT USING (true);
CREATE POLICY "Ranking senadores discursos público" ON public.ranking_senadores_discursos FOR SELECT USING (true);
CREATE POLICY "Ranking senadores comissões público" ON public.ranking_senadores_comissoes FOR SELECT USING (true);
CREATE POLICY "Ranking senadores votações público" ON public.ranking_senadores_votacoes FOR SELECT USING (true);
CREATE POLICY "Ranking senadores matérias público" ON public.ranking_senadores_materias FOR SELECT USING (true);