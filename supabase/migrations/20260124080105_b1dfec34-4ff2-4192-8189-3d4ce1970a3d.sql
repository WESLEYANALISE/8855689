-- Limpar conteúdos gerados de todos os tópicos das trilhas OAB para regenerar com o novo prompt conversacional
UPDATE public.oab_trilhas_topicos
SET 
  conteudo_gerado = NULL,
  exemplos = NULL,
  termos = NULL,
  flashcards = NULL,
  questoes = NULL,
  status = 'pendente',
  updated_at = NOW()
WHERE conteudo_gerado IS NOT NULL;