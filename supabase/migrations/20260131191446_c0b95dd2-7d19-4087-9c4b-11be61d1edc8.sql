-- Corrigir tópicos "fantasmas": status concluído mas sem conteúdo
-- Isso permite que sejam regenerados automaticamente

UPDATE public.conceitos_topicos
SET 
  status = 'pendente',
  progresso = 0,
  tentativas = 0,
  posicao_fila = NULL,
  updated_at = now()
WHERE 
  status = 'concluido'
  AND slides_json IS NULL
  AND conteudo_gerado IS NULL;

-- Log da correção
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Tópicos fantasmas corrigidos: %', affected_count;
END $$;