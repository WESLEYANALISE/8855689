-- Criar tabela para armazenar prioridades de artigos para narração
CREATE TABLE public.narracao_prioridades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tabela_lei TEXT NOT NULL,
  numero_artigo TEXT NOT NULL,
  prioridade TEXT NOT NULL CHECK (prioridade IN ('alta', 'media', 'baixa')),
  motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tabela_lei, numero_artigo)
);

-- Habilitar RLS
ALTER TABLE public.narracao_prioridades ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para leitura e escrita (admin)
CREATE POLICY "Qualquer um pode ler prioridades" 
ON public.narracao_prioridades 
FOR SELECT 
USING (true);

CREATE POLICY "Qualquer um pode inserir prioridades" 
ON public.narracao_prioridades 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Qualquer um pode atualizar prioridades" 
ON public.narracao_prioridades 
FOR UPDATE 
USING (true);

CREATE POLICY "Qualquer um pode deletar prioridades" 
ON public.narracao_prioridades 
FOR DELETE 
USING (true);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_narracao_prioridades_updated_at
BEFORE UPDATE ON public.narracao_prioridades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índice para busca rápida
CREATE INDEX idx_narracao_prioridades_tabela ON public.narracao_prioridades(tabela_lei);