-- Habilitar RLS na tabela de backup
ALTER TABLE "LEI6015_backup_import" ENABLE ROW LEVEL SECURITY;

-- Criar política de leitura pública
CREATE POLICY "Backup Lei 6015 é público para leitura"
ON "LEI6015_backup_import"
FOR SELECT
USING (true);