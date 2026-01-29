-- Tabela para armazenar o índice de capítulos pré-analisados de cada livro
CREATE TABLE public.leitura_livros_indice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livro_titulo TEXT NOT NULL UNIQUE,
  indice_capitulos JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_capitulos INTEGER NOT NULL DEFAULT 0,
  total_paginas INTEGER NOT NULL DEFAULT 0,
  analise_concluida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca rápida por título
CREATE INDEX idx_leitura_livros_indice_titulo ON public.leitura_livros_indice(livro_titulo);

-- Enable RLS
ALTER TABLE public.leitura_livros_indice ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para leitura
CREATE POLICY "Índice de livros é público para leitura"
ON public.leitura_livros_indice
FOR SELECT
USING (true);

-- Sistema pode inserir/atualizar índices
CREATE POLICY "Sistema pode inserir índices de livros"
ON public.leitura_livros_indice
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar índices de livros"
ON public.leitura_livros_indice
FOR UPDATE
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_leitura_livros_indice_updated_at
BEFORE UPDATE ON public.leitura_livros_indice
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();