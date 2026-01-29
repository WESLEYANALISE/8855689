-- Criar tabela para armazenar livros curados para iniciantes
CREATE TABLE public.biblioteca_iniciante (
  id BIGSERIAL PRIMARY KEY,
  livro_id BIGINT NOT NULL,
  biblioteca_origem TEXT NOT NULL CHECK (biblioteca_origem IN ('estudos', 'classicos')),
  titulo TEXT NOT NULL,
  autor TEXT,
  capa TEXT,
  area TEXT,
  justificativa TEXT,
  ordem INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_biblioteca_iniciante_origem ON public.biblioteca_iniciante(biblioteca_origem);
CREATE INDEX idx_biblioteca_iniciante_ordem ON public.biblioteca_iniciante(ordem);

-- RLS
ALTER TABLE public.biblioteca_iniciante ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (todos podem ver os livros curados)
CREATE POLICY "Todos podem ver livros para iniciantes" 
ON public.biblioteca_iniciante 
FOR SELECT 
USING (true);

-- Política de escrita apenas para administradores (via service role)
CREATE POLICY "Apenas admins podem gerenciar biblioteca iniciante"
ON public.biblioteca_iniciante
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND email = 'wn7corporation@gmail.com'
));

-- Trigger para updated_at
CREATE TRIGGER update_biblioteca_iniciante_updated_at
BEFORE UPDATE ON public.biblioteca_iniciante
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentário na tabela
COMMENT ON TABLE public.biblioteca_iniciante IS 'Livros curados por IA para estudantes iniciantes de Direito';