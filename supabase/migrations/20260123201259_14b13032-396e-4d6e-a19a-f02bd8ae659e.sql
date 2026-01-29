-- Apagar todos os tópicos das matérias OAB para regenerar via PDF
DELETE FROM oab_trilhas_topicos WHERE id > 0;

-- Resetar status de processamento das matérias para permitir novo upload de PDF
UPDATE oab_trilhas_materias 
SET status_processamento = NULL, 
    total_paginas = NULL,
    temas_identificados = NULL,
    updated_at = NOW()
WHERE id > 0;