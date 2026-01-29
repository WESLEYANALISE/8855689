-- Tabela para rastrear jobs de extração em background
CREATE TABLE public.extracao_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, processando, concluido, erro, pausado
  modo TEXT NOT NULL DEFAULT 'pendentes', -- pendentes, erros, todas
  tamanho_lote INTEGER NOT NULL DEFAULT 100,
  total_pendentes INTEGER DEFAULT 0,
  total_processadas INTEGER DEFAULT 0,
  total_sucesso INTEGER DEFAULT 0,
  total_erros INTEGER DEFAULT 0,
  ultimo_erro TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finalizado_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.extracao_jobs ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (admin page)
CREATE POLICY "Allow public read" ON public.extracao_jobs FOR SELECT USING (true);

-- Política para permitir insert/update público
CREATE POLICY "Allow public insert" ON public.extracao_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.extracao_jobs FOR UPDATE USING (true);

-- Habilitar realtime para atualizações
ALTER TABLE public.extracao_jobs REPLICA IDENTITY FULL;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_extracao_jobs_updated_at
BEFORE UPDATE ON public.extracao_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();