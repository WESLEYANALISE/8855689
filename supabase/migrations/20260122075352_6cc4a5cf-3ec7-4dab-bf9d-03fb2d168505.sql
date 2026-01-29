-- 1. Deletar TODOS os tópicos para reset completo
DELETE FROM conceitos_topicos;

-- 2. Deletar páginas extraídas para forçar reprocessamento do PDF
DELETE FROM conceitos_materia_paginas;

-- 3. Resetar status das matérias para permitir reprocessamento
UPDATE conceitos_materias 
SET 
  status_processamento = 'pendente',
  temas_identificados = NULL,
  total_paginas = NULL;