-- Habilitar Realtime para a tabela CURSOS-APP
-- Isso permitirá atualizações automáticas quando novos cursos forem adicionados

-- 1. Habilitar REPLICA IDENTITY FULL para capturar todos os dados nas mudanças
ALTER TABLE "CURSOS-APP" REPLICA IDENTITY FULL;

-- 2. Adicionar tabela à publicação realtime do Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE "CURSOS-APP";