-- Habilitar RLS na tabela LC 101 - LRF
ALTER TABLE "LC 101 - LRF" ENABLE ROW LEVEL SECURITY;

-- Criar política pública de leitura para LC 101 - LRF
CREATE POLICY "LRF é público para leitura" 
ON "LC 101 - LRF" 
FOR SELECT 
USING (true);

-- Criar política para sistema atualizar conteúdo gerado
CREATE POLICY "Sistema pode atualizar LRF" 
ON "LC 101 - LRF" 
FOR UPDATE 
USING (true);