-- Reset do tópico "Surgimento do Direito" que está travado em gerando
UPDATE conceitos_topicos 
SET status = 'pendente', 
    tentativas = 0, 
    progresso = 0, 
    posicao_fila = NULL,
    updated_at = NOW()
WHERE id = 521;