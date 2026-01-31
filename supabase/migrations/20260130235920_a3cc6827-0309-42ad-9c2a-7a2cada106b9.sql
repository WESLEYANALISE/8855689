-- Reset completo de Conceitos
-- 1. Deletar todas as páginas de tópicos
DELETE FROM conceitos_topico_paginas;

-- 2. Deletar todos os tópicos
DELETE FROM conceitos_topicos;

-- 3. Deletar páginas extraídas das matérias
DELETE FROM conceitos_materia_paginas;

-- 4. Resetar status das matérias para reenvio de PDF
UPDATE conceitos_materias
SET 
  status_processamento = NULL,
  temas_identificados = NULL,
  total_paginas = NULL
WHERE 1=1;