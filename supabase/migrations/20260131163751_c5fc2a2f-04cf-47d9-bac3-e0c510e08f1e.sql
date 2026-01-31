-- Tabela para rastrear jobs de geração de imagens em batch
CREATE TABLE public.conceitos_batch_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('capas_topicos', 'imagens_slides')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_items INTEGER NOT NULL DEFAULT 0,
  completed_items INTEGER NOT NULL DEFAULT 0,
  input_file_uri TEXT,
  output_file_uri TEXT,
  materia_id INTEGER REFERENCES public.conceitos_materias(id) ON DELETE CASCADE,
  items_data JSONB, -- Array de {id, prompt, slideId} para processar
  results_data JSONB, -- Array de {id, url} após processamento
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX idx_conceitos_batch_jobs_status ON public.conceitos_batch_jobs(status);
CREATE INDEX idx_conceitos_batch_jobs_materia ON public.conceitos_batch_jobs(materia_id);

-- RLS
ALTER TABLE public.conceitos_batch_jobs ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (sistema interno)
CREATE POLICY "Anyone can read batch jobs"
ON public.conceitos_batch_jobs
FOR SELECT
USING (true);

-- Política para insert/update via service role (edge functions)
CREATE POLICY "Service role can manage batch jobs"
ON public.conceitos_batch_jobs
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_conceitos_batch_jobs_updated_at
BEFORE UPDATE ON public.conceitos_batch_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna slides_json na tabela conceitos_topicos para nova estrutura
ALTER TABLE public.conceitos_topicos
ADD COLUMN IF NOT EXISTS slides_json JSONB;

-- Comentário explicativo
COMMENT ON TABLE public.conceitos_batch_jobs IS 'Rastreia jobs de geração de imagens em batch via Gemini Batch API para economia de 50%';