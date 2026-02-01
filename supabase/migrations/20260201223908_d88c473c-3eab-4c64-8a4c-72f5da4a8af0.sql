-- Deletar o tópico 508 (Da Imputabilidade Penal e do Concurso de Pessoas) que é duplicado
DELETE FROM oab_trilhas_topicos WHERE id = 508;

-- Reordenar os tópicos restantes de Direito Penal para manter a sequência
UPDATE oab_trilhas_topicos 
SET ordem = ordem - 1 
WHERE materia_id = 14 AND ordem > 12;