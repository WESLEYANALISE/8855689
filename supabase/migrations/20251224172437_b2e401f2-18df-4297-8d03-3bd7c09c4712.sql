-- Tabela para rastrear tarefas de background
CREATE TABLE IF NOT EXISTS public.tres_poderes_tarefas_background (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  total INTEGER DEFAULT 0,
  processados INTEGER DEFAULT 0,
  ultimo_processado TEXT,
  deputado_inicial_id INTEGER,
  erro TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  concluido_em TIMESTAMP WITH TIME ZONE
);

-- RLS policies
ALTER TABLE public.tres_poderes_tarefas_background ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública
CREATE POLICY "Tarefas são públicas para leitura"
ON public.tres_poderes_tarefas_background
FOR SELECT
USING (true);

-- Permitir inserção pública (para a edge function)
CREATE POLICY "Permitir inserção de tarefas"
ON public.tres_poderes_tarefas_background
FOR INSERT
WITH CHECK (true);

-- Permitir atualização pública (para a edge function)
CREATE POLICY "Permitir atualização de tarefas"
ON public.tres_poderes_tarefas_background
FOR UPDATE
USING (true);