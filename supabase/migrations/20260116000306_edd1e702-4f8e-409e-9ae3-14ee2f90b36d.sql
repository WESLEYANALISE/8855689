-- Tabela de áreas de estudo da OAB
CREATE TABLE public.oab_trilhas_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL UNIQUE,
  ordem INTEGER DEFAULT 0,
  icone TEXT DEFAULT 'Scale',
  cor TEXT DEFAULT 'red',
  pdf_url TEXT,
  status TEXT DEFAULT 'pendente',
  total_paginas INTEGER DEFAULT 0,
  total_temas INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de conteúdo bruto extraído via OCR
CREATE TABLE public.oab_trilhas_conteudo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,
  pagina INTEGER NOT NULL,
  conteudo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(area, pagina)
);

-- Tabela de temas formatados por área
CREATE TABLE public.oab_trilhas_temas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  titulo TEXT NOT NULL,
  conteudo_formatado TEXT,
  resumo TEXT,
  flashcards JSONB DEFAULT '[]'::jsonb,
  questoes JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de progresso do usuário por tema
CREATE TABLE public.oab_trilhas_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tema_id UUID REFERENCES public.oab_trilhas_temas(id) ON DELETE CASCADE,
  leitura_concluida BOOLEAN DEFAULT false,
  flashcards_vistos INTEGER DEFAULT 0,
  questoes_acertos INTEGER DEFAULT 0,
  questoes_total INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tema_id)
);

-- Habilitar RLS
ALTER TABLE public.oab_trilhas_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oab_trilhas_conteudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oab_trilhas_temas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oab_trilhas_progresso ENABLE ROW LEVEL SECURITY;

-- Políticas para áreas (leitura pública)
CREATE POLICY "Áreas são públicas para leitura" ON public.oab_trilhas_areas FOR SELECT USING (true);

-- Políticas para conteúdo (leitura pública)
CREATE POLICY "Conteúdo é público para leitura" ON public.oab_trilhas_conteudo FOR SELECT USING (true);

-- Políticas para temas (leitura pública)
CREATE POLICY "Temas são públicos para leitura" ON public.oab_trilhas_temas FOR SELECT USING (true);

-- Políticas para progresso do usuário
CREATE POLICY "Usuários podem ver seu próprio progresso" ON public.oab_trilhas_progresso FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir seu progresso" ON public.oab_trilhas_progresso FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seu progresso" ON public.oab_trilhas_progresso FOR UPDATE USING (auth.uid() = user_id);

-- Inserir áreas iniciais da OAB
INSERT INTO public.oab_trilhas_areas (area, ordem, icone, cor) VALUES
('Direito Constitucional', 1, 'Scale', 'blue'),
('Direito Civil', 2, 'Users', 'green'),
('Direito Penal', 3, 'Shield', 'red'),
('Direito Processual Civil', 4, 'FileText', 'purple'),
('Direito Processual Penal', 5, 'Gavel', 'orange'),
('Direito do Trabalho', 6, 'Briefcase', 'yellow'),
('Processo do Trabalho', 7, 'Clock', 'amber'),
('Direito Administrativo', 8, 'Building', 'slate'),
('Direito Tributário', 9, 'Receipt', 'emerald'),
('Direito Empresarial', 10, 'TrendingUp', 'cyan'),
('Direito Ambiental', 11, 'Leaf', 'lime'),
('Direito do Consumidor', 12, 'ShoppingCart', 'pink'),
('Estatuto da Criança e Adolescente', 13, 'Baby', 'rose'),
('Direitos Humanos', 14, 'Heart', 'indigo'),
('Ética Profissional', 15, 'Award', 'violet'),
('Filosofia do Direito', 16, 'BookOpen', 'fuchsia'),
('Direito Eleitoral', 17, 'Vote', 'teal'),
('Direito Internacional', 18, 'Globe', 'sky'),
('Direito Previdenciário', 19, 'Wallet', 'stone'),
('Direito Financeiro', 20, 'Coins', 'zinc')
ON CONFLICT (area) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_oab_trilhas_areas_updated_at
  BEFORE UPDATE ON public.oab_trilhas_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oab_trilhas_temas_updated_at
  BEFORE UPDATE ON public.oab_trilhas_temas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oab_trilhas_progresso_updated_at
  BEFORE UPDATE ON public.oab_trilhas_progresso
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();