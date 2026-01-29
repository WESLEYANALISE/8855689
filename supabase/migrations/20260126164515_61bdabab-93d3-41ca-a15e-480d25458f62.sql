-- Resetar tópicos que ficaram travados com status 'erro' e tentativas = 0
UPDATE oab_trilhas_topicos 
SET status = 'pendente', 
    tentativas = 0, 
    conteudo_gerado = NULL,
    progresso = 0,
    posicao_fila = NULL,
    updated_at = NOW()
WHERE status = 'erro' 
  AND (tentativas = 0 OR tentativas IS NULL);