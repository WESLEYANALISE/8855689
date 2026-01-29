-- Criar função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Tabela para armazenar aulas interativas de livros
CREATE TABLE public.aulas_livros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  livro_id BIGINT NOT NULL,
  tema TEXT NOT NULL,
  area TEXT,
  titulo TEXT NOT NULL,
  descricao TEXT,
  estrutura_completa JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  visualizacoes INTEGER DEFAULT 0,
  aproveitamento_medio NUMERIC
);

-- Enable RLS
ALTER TABLE public.aulas_livros ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "Aulas de livros são públicas para leitura"
ON public.aulas_livros
FOR SELECT
USING (true);

-- Política para inserção
CREATE POLICY "Sistema pode criar aulas de livros"
ON public.aulas_livros
FOR INSERT
WITH CHECK (true);

-- Política para atualização
CREATE POLICY "Sistema pode atualizar aulas de livros"
ON public.aulas_livros
FOR UPDATE
USING (true);

-- Índice para busca rápida por livro
CREATE INDEX idx_aulas_livros_livro_id ON public.aulas_livros(livro_id);

-- Trigger para updated_at
CREATE TRIGGER update_aulas_livros_updated_at
BEFORE UPDATE ON public.aulas_livros
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();