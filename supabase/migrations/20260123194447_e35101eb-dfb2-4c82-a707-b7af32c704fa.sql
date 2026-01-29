-- Limpar conteúdo gerado dos tópicos para regenerar com nova estrutura
UPDATE oab_trilhas_topicos 
SET 
  conteudo_gerado = NULL, 
  exemplos = NULL, 
  termos = NULL, 
  flashcards = NULL, 
  questoes = NULL, 
  status = 'pendente',
  updated_at = NOW()
WHERE conteudo_gerado IS NOT NULL 
   OR status IN ('concluido', 'gerando', 'erro');