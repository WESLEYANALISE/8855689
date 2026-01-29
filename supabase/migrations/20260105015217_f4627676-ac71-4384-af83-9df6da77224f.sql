-- Criar bucket para capas de artigos políticos
INSERT INTO storage.buckets (id, name, public)
VALUES ('politica-capas', 'politica-capas', true)
ON CONFLICT (id) DO NOTHING;

-- Política de acesso público para leitura
CREATE POLICY "Capas políticas são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'politica-capas');

-- Política para upload via service role (edge functions)
CREATE POLICY "Service role pode fazer upload de capas"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'politica-capas');

-- Política para delete via service role
CREATE POLICY "Service role pode deletar capas"
ON storage.objects FOR DELETE
USING (bucket_id = 'politica-capas');