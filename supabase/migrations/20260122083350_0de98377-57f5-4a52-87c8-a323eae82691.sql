-- Apagar tópicos da matéria História do Direito (id 44)
DELETE FROM conceitos_topicos WHERE materia_id = 44;

-- Resetar status da matéria para pendente
UPDATE conceitos_materias 
SET status_processamento = 'pendente', total_paginas = NULL
WHERE id = 44;