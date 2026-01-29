-- Limpar conteúdo gerado dos tópicos de OAB Trilhas para regenerar
UPDATE "RESUMO" 
SET conteudo_gerado = NULL, url_imagem_resumo = NULL 
WHERE id IN (6645, 6646);

-- Também limpar os tópicos da tabela oab_trilhas_topicos que têm conteúdo
UPDATE oab_trilhas_topicos 
SET conteudo_gerado = NULL, capa_url = NULL, status = 'pendente'
WHERE conteudo_gerado IS NOT NULL;