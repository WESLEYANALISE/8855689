-- Deletar capas do radar de hoje para regenerar com novo prompt
DELETE FROM radar_capas_diarias WHERE data = CURRENT_DATE;