-- Habilitar REPLICA IDENTITY FULL para realtime
ALTER TABLE peticoes_sync_log REPLICA IDENTITY FULL;
ALTER TABLE peticoes_modelos REPLICA IDENTITY FULL;

-- Adicionar à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE peticoes_sync_log;
ALTER PUBLICATION supabase_realtime ADD TABLE peticoes_modelos;

-- Resetar sincronizações travadas
UPDATE peticoes_sync_log 
SET status = 'failed', finished_at = NOW() 
WHERE status = 'running' AND finished_at IS NULL;