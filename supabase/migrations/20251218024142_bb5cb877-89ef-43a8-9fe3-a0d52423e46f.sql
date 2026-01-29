-- Deletar resumos e capas de hoje para regenerar
DELETE FROM resumos_diarios WHERE data IN ('2025-12-17', '2025-12-18');
DELETE FROM radar_capas_diarias WHERE data = '2025-12-18';