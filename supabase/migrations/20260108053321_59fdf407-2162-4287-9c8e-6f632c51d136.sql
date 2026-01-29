-- Criar pasta background no bucket audios (se não existir, criando um arquivo placeholder)
-- O arquivo real será enviado manualmente

-- Verificar se o bucket audios existe e é público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'audios';

-- Inserir bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('audios', 'audios', true)
ON CONFLICT (id) DO UPDATE SET public = true;