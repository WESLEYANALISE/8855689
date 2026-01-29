-- Deletar boletins de hoje e ontem para permitir regeneração
DELETE FROM resumos_diarios 
WHERE data >= CURRENT_DATE - INTERVAL '1 day';