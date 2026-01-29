-- Criar função para atualizar updated_at se não existir
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar tabela para armazenar aulas geradas para artigos específicos
CREATE TABLE public.aulas_artigos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_tabela TEXT NOT NULL,
  numero_artigo TEXT NOT NULL,
  conteudo_artigo TEXT NOT NULL,
  estrutura_completa JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  visualizacoes INTEGER DEFAULT 0,
  aproveitamento_medio NUMERIC(5,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índice único para evitar duplicatas e busca rápida
CREATE UNIQUE INDEX idx_aulas_artigos_codigo_numero ON public.aulas_artigos(codigo_tabela, numero_artigo);

-- Criar índice para busca por código
CREATE INDEX idx_aulas_artigos_codigo ON public.aulas_artigos(codigo_tabela);

-- Enable RLS
ALTER TABLE public.aulas_artigos ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "Aulas de artigos são públicas para leitura"
ON public.aulas_artigos
FOR SELECT
USING (true);

-- Política para inserção
CREATE POLICY "Qualquer um pode criar aulas de artigos"
ON public.aulas_artigos
FOR INSERT
WITH CHECK (true);

-- Política para atualização
CREATE POLICY "Sistema pode atualizar aulas de artigos"
ON public.aulas_artigos
FOR UPDATE
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_aulas_artigos_updated_at
BEFORE UPDATE ON public.aulas_artigos
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();