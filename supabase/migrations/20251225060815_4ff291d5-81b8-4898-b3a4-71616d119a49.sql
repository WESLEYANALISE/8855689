-- Criar tabela para rascunhos de leis extraídas
CREATE TABLE public.rascunhos_leis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_lei TEXT NOT NULL,
  tabela_destino TEXT NOT NULL,
  artigos JSONB NOT NULL,
  total_artigos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para buscar por tabela
CREATE INDEX idx_rascunhos_leis_tabela ON public.rascunhos_leis(tabela_destino);

-- Permitir acesso público (sem autenticação)
ALTER TABLE public.rascunhos_leis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rascunhos são públicos para leitura" 
  ON public.rascunhos_leis 
  FOR SELECT 
  USING (true);

CREATE POLICY "Rascunhos são públicos para inserção" 
  ON public.rascunhos_leis 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Rascunhos são públicos para update" 
  ON public.rascunhos_leis 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Rascunhos são públicos para delete" 
  ON public.rascunhos_leis 
  FOR DELETE 
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_rascunhos_leis_updated_at
  BEFORE UPDATE ON public.rascunhos_leis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();