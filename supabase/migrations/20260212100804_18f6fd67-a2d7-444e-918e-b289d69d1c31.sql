
-- Tabela de matérias por categoria
CREATE TABLE public.categorias_materias (
  id SERIAL PRIMARY KEY,
  categoria TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  capa_url TEXT,
  pdf_url TEXT,
  ativo BOOLEAN DEFAULT true,
  status_processamento TEXT DEFAULT 'pendente',
  total_paginas INTEGER,
  temas_identificados JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de tópicos (conteúdo gerado)
CREATE TABLE public.categorias_topicos (
  id SERIAL PRIMARY KEY,
  materia_id INTEGER NOT NULL REFERENCES public.categorias_materias(id) ON DELETE CASCADE,
  ordem INTEGER DEFAULT 0,
  titulo TEXT NOT NULL,
  descricao TEXT,
  conteudo_gerado JSONB,
  exemplos JSONB,
  termos JSONB,
  flashcards JSONB,
  questoes JSONB,
  capa_url TEXT,
  url_narracao TEXT,
  status TEXT DEFAULT 'pendente',
  pagina_inicial INTEGER,
  pagina_final INTEGER,
  subtopicos JSONB,
  progresso INTEGER DEFAULT 0,
  posicao_fila INTEGER,
  tentativas INTEGER DEFAULT 0,
  capa_versao INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de progresso do usuário
CREATE TABLE public.categorias_progresso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_id INTEGER REFERENCES public.categorias_materias(id) ON DELETE CASCADE,
  topico_id INTEGER REFERENCES public.categorias_topicos(id) ON DELETE CASCADE,
  leitura_concluida BOOLEAN DEFAULT false,
  flashcards_concluidos BOOLEAN DEFAULT false,
  questoes_concluidas BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, topico_id)
);

-- Tabela de páginas extraídas do PDF (para geração de conteúdo)
CREATE TABLE public.categorias_topico_paginas (
  id SERIAL PRIMARY KEY,
  topico_id INTEGER NOT NULL REFERENCES public.categorias_topicos(id) ON DELETE CASCADE,
  pagina INTEGER NOT NULL,
  conteudo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.categorias_materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_topicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_topico_paginas ENABLE ROW LEVEL SECURITY;

-- Leitura pública para matérias e tópicos
CREATE POLICY "Leitura pública categorias_materias" ON public.categorias_materias FOR SELECT USING (true);
CREATE POLICY "Leitura pública categorias_topicos" ON public.categorias_topicos FOR SELECT USING (true);
CREATE POLICY "Leitura pública categorias_topico_paginas" ON public.categorias_topico_paginas FOR SELECT USING (true);

-- Admin pode tudo em matérias e tópicos
CREATE POLICY "Admin gerencia categorias_materias" ON public.categorias_materias FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin gerencia categorias_topicos" ON public.categorias_topicos FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin gerencia categorias_topico_paginas" ON public.categorias_topico_paginas FOR ALL USING (public.is_admin(auth.uid()));

-- Progresso restrito ao usuário
CREATE POLICY "Usuário lê próprio progresso categorias" ON public.categorias_progresso FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuário insere próprio progresso categorias" ON public.categorias_progresso FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza próprio progresso categorias" ON public.categorias_progresso FOR UPDATE USING (auth.uid() = user_id);

-- Triggers de updated_at
CREATE TRIGGER update_categorias_materias_updated_at BEFORE UPDATE ON public.categorias_materias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categorias_topicos_updated_at BEFORE UPDATE ON public.categorias_topicos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categorias_progresso_updated_at BEFORE UPDATE ON public.categorias_progresso FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_categorias_materias_categoria ON public.categorias_materias(categoria);
CREATE INDEX idx_categorias_topicos_materia_id ON public.categorias_topicos(materia_id);
CREATE INDEX idx_categorias_progresso_user_id ON public.categorias_progresso(user_id);
CREATE INDEX idx_categorias_topico_paginas_topico_id ON public.categorias_topico_paginas(topico_id);
