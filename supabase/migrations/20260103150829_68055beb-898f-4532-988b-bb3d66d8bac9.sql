-- Habilitar REPLICA IDENTITY FULL para capturar todos os dados nas mudanças
ALTER TABLE subscriptions REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação realtime para notificações em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;