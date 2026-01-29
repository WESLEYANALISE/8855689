-- Limpar capas existentes para regenerar com novo estilo cartoon
UPDATE lei_seca_explicacoes
SET url_capa = NULL
WHERE url_capa IS NOT NULL;