-- Limpar todas as capas geradas para regenerar
UPDATE lei_seca_explicacoes SET url_capa = NULL WHERE url_capa IS NOT NULL;