-- Adicionar coluna topico_id à tabela conceitos_batch_jobs para rastrear qual tópico gerou o batch
ALTER TABLE public.conceitos_batch_jobs ADD COLUMN IF NOT EXISTS topico_id integer REFERENCES public.conceitos_topicos(id) ON DELETE SET NULL;

-- Criar índice para busca por topico_id
CREATE INDEX IF NOT EXISTS idx_conceitos_batch_jobs_topico_id ON public.conceitos_batch_jobs(topico_id);