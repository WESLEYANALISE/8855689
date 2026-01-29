-- Tabela de disciplinas da faculdade
CREATE TABLE public.faculdade_disciplinas (
  id SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  nome_ingles TEXT,
  departamento TEXT,
  semestre INTEGER NOT NULL,
  carga_horaria INTEGER,
  ementa TEXT,
  objetivos TEXT,
  conteudo_programatico TEXT,
  bibliografia TEXT,
  url_jupiter TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de tópicos de cada disciplina
CREATE TABLE public.faculdade_topicos (
  id SERIAL PRIMARY KEY,
  disciplina_id INTEGER REFERENCES public.faculdade_disciplinas(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  conteudo_gerado TEXT,
  exemplos JSONB,
  termos JSONB,
  flashcards JSONB,
  questoes JSONB,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de progresso do usuário
CREATE TABLE public.faculdade_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topico_id INTEGER REFERENCES public.faculdade_topicos(id) ON DELETE CASCADE,
  concluido BOOLEAN DEFAULT false,
  data_conclusao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topico_id)
);

-- Índices para performance
CREATE INDEX idx_faculdade_disciplinas_semestre ON public.faculdade_disciplinas(semestre);
CREATE INDEX idx_faculdade_topicos_disciplina ON public.faculdade_topicos(disciplina_id);
CREATE INDEX idx_faculdade_topicos_status ON public.faculdade_topicos(status);
CREATE INDEX idx_faculdade_progresso_user ON public.faculdade_progresso(user_id);

-- RLS
ALTER TABLE public.faculdade_disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculdade_topicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculdade_progresso ENABLE ROW LEVEL SECURITY;

-- Políticas para disciplinas e tópicos (leitura pública)
CREATE POLICY "Disciplinas são públicas para leitura" 
ON public.faculdade_disciplinas FOR SELECT USING (true);

CREATE POLICY "Tópicos são públicos para leitura" 
ON public.faculdade_topicos FOR SELECT USING (true);

-- Políticas para progresso (privado por usuário)
CREATE POLICY "Usuários podem ver seu próprio progresso" 
ON public.faculdade_progresso FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio progresso" 
ON public.faculdade_progresso FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio progresso" 
ON public.faculdade_progresso FOR UPDATE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_faculdade_disciplinas_updated_at
BEFORE UPDATE ON public.faculdade_disciplinas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faculdade_topicos_updated_at
BEFORE UPDATE ON public.faculdade_topicos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faculdade_progresso_updated_at
BEFORE UPDATE ON public.faculdade_progresso
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();