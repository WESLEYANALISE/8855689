-- Habilitar RLS na tabela questoes_grifos_cache
ALTER TABLE public.questoes_grifos_cache ENABLE ROW LEVEL SECURITY;

-- Criar política de leitura pública (dados de cache são públicos)
CREATE POLICY "Permitir leitura pública de questoes_grifos_cache"
ON public.questoes_grifos_cache
FOR SELECT
USING (true);

-- Criar política de escrita apenas para service role (backend)
CREATE POLICY "Apenas service role pode inserir em questoes_grifos_cache"
ON public.questoes_grifos_cache
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Apenas service role pode atualizar questoes_grifos_cache"
ON public.questoes_grifos_cache
FOR UPDATE
USING (false);

CREATE POLICY "Apenas service role pode deletar questoes_grifos_cache"
ON public.questoes_grifos_cache
FOR DELETE
USING (false);