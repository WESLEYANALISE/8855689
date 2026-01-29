-- Forçar regeneração dos 2 primeiros subtemas (conteúdo antigo)
UPDATE "RESUMO"
SET conteudo_gerado = NULL,
    ultima_atualizacao = now()
WHERE id IN (6682, 6683);