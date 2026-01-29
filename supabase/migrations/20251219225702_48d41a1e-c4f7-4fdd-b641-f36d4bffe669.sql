-- Tabela para rastrear jobs de narração em lote
CREATE TABLE public.narracao_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tabela_lei TEXT NOT NULL,
  artigos_ids INTEGER[] NOT NULL,
  artigos_total INTEGER NOT NULL,
  artigos_processados INTEGER NOT NULL DEFAULT 0,
  artigo_atual INTEGER,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'pausado', 'concluido', 'cancelado', 'erro')),
  velocidade NUMERIC NOT NULL DEFAULT 1.0,
  erro_mensagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.narracao_jobs ENABLE ROW LEVEL SECURITY;

-- Política para acesso público (admin)
CREATE POLICY "Acesso público para narracao_jobs" 
ON public.narracao_jobs 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_narracao_jobs_updated_at
BEFORE UPDATE ON public.narracao_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();