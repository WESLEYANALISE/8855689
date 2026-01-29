-- Criar tabela para armazenar aulas interativas
CREATE TABLE IF NOT EXISTS public.aulas_interativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,
  tema TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  estrutura_completa JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  visualizacoes INTEGER DEFAULT 0,
  aproveitamento_medio NUMERIC(5,2)
);

-- Criar tabela para rastrear progresso dos usuários nas aulas
CREATE TABLE IF NOT EXISTS public.aulas_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  aula_id UUID REFERENCES public.aulas_interativas(id) ON DELETE CASCADE,
  modulo_atual INTEGER DEFAULT 1,
  etapa_atual TEXT DEFAULT 'teoria1',
  progresso_percentual NUMERIC(5,2) DEFAULT 0,
  nota_prova_final NUMERIC(5,2),
  concluida BOOLEAN DEFAULT false,
  tempo_total_minutos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, aula_id)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.aulas_interativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas_progresso ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para aulas_interativas
CREATE POLICY "Aulas são públicas para leitura"
  ON public.aulas_interativas
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode inserir aulas"
  ON public.aulas_interativas
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar aulas"
  ON public.aulas_interativas
  FOR UPDATE
  USING (true);

-- Políticas RLS para aulas_progresso
CREATE POLICY "Usuários veem apenas seu progresso"
  ON public.aulas_progresso
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu progresso"
  ON public.aulas_progresso
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu progresso"
  ON public.aulas_progresso
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_aulas_interativas_area ON public.aulas_interativas(area);
CREATE INDEX IF NOT EXISTS idx_aulas_interativas_created_at ON public.aulas_interativas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aulas_progresso_user_id ON public.aulas_progresso(user_id);
CREATE INDEX IF NOT EXISTS idx_aulas_progresso_aula_id ON public.aulas_progresso(aula_id);