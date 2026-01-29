-- Limpar todas as capas geradas na biblioteca de estudos para regenerar com novo prompt
UPDATE public."BIBLIOTECA-ESTUDOS" 
SET "Capa-livro" = NULL, 
    "url_capa_gerada" = NULL 
WHERE "url_capa_gerada" IS NOT NULL 
   OR "Capa-livro" IS NOT NULL;