-- Limpar cache dos artigos para regenerar sem título "O Fascinante Mundo..."
UPDATE lei_seca_explicacoes 
SET conteudo_gerado = NULL, 
    cache_validade = NULL, 
    gerado_em = NULL 
WHERE conteudo_gerado IS NOT NULL;