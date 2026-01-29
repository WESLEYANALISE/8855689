-- Reset tópicos com erro na matéria 58 para testar nova mecânica
UPDATE public.conceitos_topicos 
SET 
  status = 'pendente', 
  progresso = 0, 
  tentativas = 0, 
  conteudo_gerado = NULL, 
  flashcards = NULL, 
  questoes = NULL, 
  termos = NULL, 
  exemplos = NULL, 
  posicao_fila = NULL, 
  updated_at = NOW()
WHERE materia_id = 58 AND status = 'erro';