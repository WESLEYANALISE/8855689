-- Criar tabela de comentários políticos
CREATE TABLE public.politica_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artigo_id INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.politica_comentarios(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_politica_comentarios_artigo ON public.politica_comentarios(artigo_id);
CREATE INDEX idx_politica_comentarios_parent ON public.politica_comentarios(parent_id);
CREATE INDEX idx_politica_comentarios_user ON public.politica_comentarios(user_id);
CREATE INDEX idx_politica_comentarios_created ON public.politica_comentarios(created_at DESC);

-- RLS
ALTER TABLE public.politica_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentários visíveis para todos" 
ON public.politica_comentarios FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem criar comentários" 
ON public.politica_comentarios FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar próprios comentários" 
ON public.politica_comentarios FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar próprios comentários" 
ON public.politica_comentarios FOR DELETE 
USING (auth.uid() = user_id);

-- Tabela de likes
CREATE TABLE public.politica_comentarios_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comentario_id UUID NOT NULL REFERENCES public.politica_comentarios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comentario_id, user_id)
);

-- RLS para likes
ALTER TABLE public.politica_comentarios_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes visíveis para todos" 
ON public.politica_comentarios_likes FOR SELECT USING (true);

CREATE POLICY "Usuários podem dar like" 
ON public.politica_comentarios_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover próprio like" 
ON public.politica_comentarios_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para atualizar contador de likes
CREATE OR REPLACE FUNCTION public.update_comentario_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.politica_comentarios SET likes_count = likes_count + 1 WHERE id = NEW.comentario_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.politica_comentarios SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comentario_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_comentario_likes_count
AFTER INSERT OR DELETE ON public.politica_comentarios_likes
FOR EACH ROW EXECUTE FUNCTION public.update_comentario_likes_count();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_politica_comentarios_updated_at
BEFORE UPDATE ON public.politica_comentarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();