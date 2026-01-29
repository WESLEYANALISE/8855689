-- Criar bucket para armazenar imagens geradas de assinatura
INSERT INTO storage.buckets (id, name, public)
VALUES ('gerador-imagens', 'gerador-imagens', true)
ON CONFLICT (id) DO NOTHING;

-- Política de leitura pública
CREATE POLICY "Imagens publicas para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gerador-imagens');

-- Política de upload para service role (Edge Functions)
CREATE POLICY "Service role pode fazer upload"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'gerador-imagens');

-- Política de atualização para service role
CREATE POLICY "Service role pode atualizar"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'gerador-imagens');