-- Resetar matéria História do Direito para re-identificar com subtópicos individuais
DELETE FROM conceitos_topicos WHERE materia_id = 44;

UPDATE conceitos_materias 
SET status_processamento = 'extraindo',
    temas_identificados = NULL
WHERE id = 44;