UPDATE public.conceitos_topicos
SET status = 'pendente',
    progresso = 0,
    tentativas = 0,
    updated_at = now()
WHERE status = 'concluido'
  AND slides_json IS NULL
  AND conteudo_gerado IS NULL;