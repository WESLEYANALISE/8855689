-- Criar bucket para PDFs educacionais
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs-educacionais', 'pdfs-educacionais', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir que qualquer usuário possa ler os PDFs (bucket público)
CREATE POLICY "Permitir leitura pública de PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs-educacionais');

-- Permitir que edge functions façam upload (usando service role)
CREATE POLICY "Permitir upload via service role"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pdfs-educacionais');