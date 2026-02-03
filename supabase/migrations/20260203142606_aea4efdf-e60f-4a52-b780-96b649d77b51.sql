-- Primeiro deletar os tópicos relacionados
DELETE FROM oab_trilhas_topicos WHERE materia_id = 37;

-- Depois deletar a matéria
DELETE FROM oab_trilhas_materias WHERE id = 37;