-- Desativar a matéria "Direito Financeiro" das Trilhas OAB
UPDATE oab_trilhas_materias
SET ativo = false
WHERE id = 36;