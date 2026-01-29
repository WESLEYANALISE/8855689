-- Tabela para cache de documentários políticos
CREATE TABLE public.politica_documentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  thumbnail TEXT,
  canal TEXT,
  duracao TEXT,
  visualizacoes TEXT,
  publicado_em TEXT,
  orientacao TEXT NOT NULL,
  sobre TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.politica_documentarios ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Documentários são públicos para leitura" 
ON public.politica_documentarios 
FOR SELECT 
USING (true);

-- Política de escrita para service_role
CREATE POLICY "Service role pode gerenciar documentários" 
ON public.politica_documentarios 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Índices
CREATE INDEX idx_politica_documentarios_orientacao ON public.politica_documentarios(orientacao);
CREATE INDEX idx_politica_documentarios_video_id ON public.politica_documentarios(video_id);

-- Tabela para comentários nos documentários
CREATE TABLE public.politica_documentarios_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documentario_id UUID REFERENCES public.politica_documentarios(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  parent_id UUID REFERENCES public.politica_documentarios_comentarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.politica_documentarios_comentarios ENABLE ROW LEVEL SECURITY;

-- Políticas para comentários
CREATE POLICY "Comentários são públicos para leitura" 
ON public.politica_documentarios_comentarios 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários autenticados podem criar comentários" 
ON public.politica_documentarios_comentarios 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar próprios comentários" 
ON public.politica_documentarios_comentarios 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar próprios comentários" 
ON public.politica_documentarios_comentarios 
FOR DELETE 
USING (auth.uid() = user_id);

-- Tabela para reações nos documentários
CREATE TABLE public.politica_documentarios_reacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documentario_id UUID REFERENCES public.politica_documentarios(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('like', 'fogo', 'surpreso', 'pensativo')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(documentario_id, user_id, tipo)
);

-- Habilitar RLS
ALTER TABLE public.politica_documentarios_reacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para reações
CREATE POLICY "Reações são públicas para leitura" 
ON public.politica_documentarios_reacoes 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários autenticados podem reagir" 
ON public.politica_documentarios_reacoes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover próprias reações" 
ON public.politica_documentarios_reacoes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Tabela para likes nos comentários de documentários
CREATE TABLE public.politica_documentarios_comentarios_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comentario_id UUID REFERENCES public.politica_documentarios_comentarios(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comentario_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.politica_documentarios_comentarios_likes ENABLE ROW LEVEL SECURITY;

-- Políticas para likes
CREATE POLICY "Likes são públicos para leitura" 
ON public.politica_documentarios_comentarios_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários autenticados podem curtir" 
ON public.politica_documentarios_comentarios_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover próprios likes" 
ON public.politica_documentarios_comentarios_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Adicionar coluna de narração na tabela de artigos políticos (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'politica_blog_orientacao' AND column_name = 'narracao_url'
  ) THEN
    ALTER TABLE public.politica_blog_orientacao ADD COLUMN narracao_url TEXT;
  END IF;
END $$;