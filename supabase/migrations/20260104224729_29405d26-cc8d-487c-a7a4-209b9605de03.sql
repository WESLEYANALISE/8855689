-- Adicionar colunas de dados profissionais do advogado na tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS oab_numero text,
ADD COLUMN IF NOT EXISTS oab_estado text,
ADD COLUMN IF NOT EXISTS endereco_escritorio text,
ADD COLUMN IF NOT EXISTS telefone_escritorio text,
ADD COLUMN IF NOT EXISTS email_escritorio text,
ADD COLUMN IF NOT EXISTS assinatura_url text;

-- Criar bucket para assinaturas digitais
INSERT INTO storage.buckets (id, name, public)
VALUES ('assinaturas', 'assinaturas', true)
ON CONFLICT (id) DO NOTHING;

-- Política: usuários podem ver suas próprias assinaturas
CREATE POLICY "Users can view own signatures"
ON storage.objects FOR SELECT
USING (bucket_id = 'assinaturas' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política: usuários podem fazer upload de suas próprias assinaturas
CREATE POLICY "Users can upload own signatures"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assinaturas' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política: usuários podem atualizar suas próprias assinaturas
CREATE POLICY "Users can update own signatures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'assinaturas' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política: usuários podem deletar suas próprias assinaturas
CREATE POLICY "Users can delete own signatures"
ON storage.objects FOR DELETE
USING (bucket_id = 'assinaturas' AND auth.uid()::text = (storage.foldername(name))[1]);