-- Limpar capas de Direito Penal (materia_id = 14) para regenerar com novos prompts
UPDATE oab_trilhas_topicos 
SET capa_url = NULL 
WHERE materia_id = 14;