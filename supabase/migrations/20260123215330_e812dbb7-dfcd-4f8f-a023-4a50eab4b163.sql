-- Limpar conteúdo gerado dos 8 subtemas de "Constitucionalismo e Classificação das Constituições"
UPDATE "RESUMO"
SET conteudo_gerado = NULL,
    ultima_atualizacao = now()
WHERE id IN (6682, 6683, 6684, 6685, 6686, 6687, 6688, 6689);

-- Limpar progresso de leitura desses subtemas para zerar a barra de progresso
DELETE FROM oab_trilhas_estudo_progresso
WHERE topico_id IN (6682, 6683, 6684, 6685, 6686, 6687, 6688, 6689);