-- Limpar conteúdo gerado dos subtemas de "Constitucionalismo" para regenerar com novo prompt
UPDATE "RESUMO"
SET conteudo_gerado = NULL,
    ultima_atualizacao = now()
WHERE id IN (6682, 6683, 6684, 6685, 6686, 6687, 6688, 6689);

-- Limpar progresso para zerar barra
DELETE FROM oab_trilhas_estudo_progresso
WHERE topico_id IN (6682, 6683, 6684, 6685, 6686, 6687, 6688, 6689);