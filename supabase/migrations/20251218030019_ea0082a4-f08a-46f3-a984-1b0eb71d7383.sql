-- Deletar resumos de hoje e ontem para regenerar com novo áudio
DELETE FROM resumos_diarios WHERE data >= CURRENT_DATE - INTERVAL '1 day';