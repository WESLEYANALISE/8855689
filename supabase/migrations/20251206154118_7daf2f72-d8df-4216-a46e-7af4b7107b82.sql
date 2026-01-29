-- Limpar todas as URLs de capas geradas para permitir nova geração
UPDATE public."BIBLIOTECA-ESTUDOS" 
SET url_capa_gerada = NULL 
WHERE url_capa_gerada IS NOT NULL;