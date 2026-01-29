-- Limpar conteúdo gerado para regenerar com os novos templates
UPDATE "RESUMO" 
SET conteudo_gerado = NULL, 
    url_imagem_resumo = NULL 
WHERE conteudo_gerado IS NOT NULL;