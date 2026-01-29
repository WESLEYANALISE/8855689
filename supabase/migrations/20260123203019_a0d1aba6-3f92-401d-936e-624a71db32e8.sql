-- Limpar conteudo_gerado do registro específico para forçar regeneração com novo formato
UPDATE "RESUMO"
SET conteudo_gerado = NULL,
    ultima_atualizacao = now()
WHERE id = 6682;