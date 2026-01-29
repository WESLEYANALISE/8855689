-- Forçar regeneração dos subtemas com formato antigo (4 páginas) para novo formato (6 páginas)
UPDATE "RESUMO"
SET conteudo_gerado = NULL,
    ultima_atualizacao = now()
WHERE id IN (6682, 6683);