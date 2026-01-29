-- Apagar tópicos da matéria Direito Romano (id 63) para permitir reprocessamento do PDF
DELETE FROM conceitos_topicos WHERE materia_id = 63;

-- Resetar status da matéria para pendente
UPDATE conceitos_materias 
SET status_processamento = 'pendente', 
    temas_identificados = NULL,
    total_paginas = NULL
WHERE id = 63;