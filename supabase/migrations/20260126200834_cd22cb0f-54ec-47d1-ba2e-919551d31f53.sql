-- Corrigir tópicos travados na fila após estourar tentativas
UPDATE public.conceitos_topicos
SET
  status = 'erro',
  progresso = 0,
  posicao_fila = NULL,
  updated_at = now()
WHERE
  coalesce(tentativas, 0) >= 3
  AND coalesce(conteudo_gerado::text, '') = ''
  AND status IN ('na_fila', 'gerando');

-- Normalizar fila: garantir que apenas status='na_fila' tenha posicao_fila
UPDATE public.conceitos_topicos
SET posicao_fila = NULL
WHERE status <> 'na_fila' AND posicao_fila IS NOT NULL;