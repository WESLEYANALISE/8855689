-- Limpar todas as URLs de capas da tabela lei_seca_explicacoes
UPDATE public.lei_seca_explicacoes SET url_capa = NULL;

-- Deletar arquivos do bucket gerador-imagens/explicacoes
DELETE FROM storage.objects 
WHERE bucket_id = 'gerador-imagens' 
  AND name LIKE 'explicacoes/explicacao_%';