-- Tabela para armazenar áreas do Dominando com ordem e capa
CREATE TABLE public.dominando_areas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ordem INTEGER NOT NULL,
  capa_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir as áreas na ordem cronológica de estudos
INSERT INTO public.dominando_areas (nome, ordem) VALUES
('Teoria E Filosofia Do Direito', 1),
('Direito Constitucional', 2),
('Direito Civil', 3),
('Direito Penal', 4),
('Direito Processual Civil', 5),
('Direito Processual Penal', 6),
('Direito Administrativo', 7),
('Direito Tributario', 8),
('Direito Do Trabalho', 9),
('Direito Processual Do Trabalho', 10),
('Direito Empresarial', 11),
('Direito Internacional Público', 12),
('Direito Internacional Privado', 13),
('Direitos Humanos', 14),
('Direito Ambiental', 15),
('Direito Previndenciario', 16),
('Direito Financeiro', 17),
('Direito Concorrencial', 18),
('Direito Desportivo', 19),
('Direito Urbanistico', 20),
('Lei Penal Especial', 21),
('Politicas Publicas', 22),
('Formação Complementar', 23),
('Pratica Profissional', 24);

-- Tabela para progresso do usuário no Dominando
CREATE TABLE public.dominando_progresso (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  disciplina_id INTEGER NOT NULL,
  concluido BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, disciplina_id)
);

-- Tabela para conteúdo gerado do Dominando
CREATE TABLE public.dominando_conteudo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  disciplina_id INTEGER NOT NULL UNIQUE,
  area TEXT NOT NULL,
  tema TEXT NOT NULL,
  introducao TEXT,
  conteudo_markdown TEXT,
  termos JSONB,
  flashcards JSONB,
  questoes JSONB,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.dominando_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dominando_progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dominando_conteudo ENABLE ROW LEVEL SECURITY;

-- Políticas para dominando_areas (leitura pública)
CREATE POLICY "Áreas são visíveis para todos" 
ON public.dominando_areas 
FOR SELECT 
USING (true);

-- Políticas para dominando_progresso (usuário só vê/edita o próprio)
CREATE POLICY "Usuários podem ver seu próprio progresso" 
ON public.dominando_progresso 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seu próprio progresso" 
ON public.dominando_progresso 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio progresso" 
ON public.dominando_progresso 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Políticas para dominando_conteudo (leitura pública)
CREATE POLICY "Conteúdo é visível para todos" 
ON public.dominando_conteudo 
FOR SELECT 
USING (true);

-- Política de inserção para service_role (edge functions)
CREATE POLICY "Service role pode inserir conteúdo" 
ON public.dominando_conteudo 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role pode atualizar conteúdo" 
ON public.dominando_conteudo 
FOR UPDATE 
USING (true);

-- Índices para performance
CREATE INDEX idx_dominando_areas_ordem ON public.dominando_areas(ordem);
CREATE INDEX idx_dominando_progresso_user ON public.dominando_progresso(user_id);
CREATE INDEX idx_dominando_conteudo_disciplina ON public.dominando_conteudo(disciplina_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_dominando_progresso_updated_at
BEFORE UPDATE ON public.dominando_progresso
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dominando_conteudo_updated_at
BEFORE UPDATE ON public.dominando_conteudo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();