-- Deletar o tópico "Direito Financeiro" (ordem 3) da área Direito Financeiro
DELETE FROM oab_trilhas_topicos WHERE id = 717;

-- Reordenar os tópicos restantes
UPDATE oab_trilhas_topicos SET ordem = ordem - 1 WHERE materia_id = 36 AND ordem > 3;