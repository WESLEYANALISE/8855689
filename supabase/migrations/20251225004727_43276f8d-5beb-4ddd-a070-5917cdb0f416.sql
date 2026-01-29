-- Criar bucket para backgrounds se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backgrounds', 'backgrounds', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Políticas para storage - dropar e recriar
DROP POLICY IF EXISTS "Backgrounds são públicos para leitura" ON storage.objects;
CREATE POLICY "Backgrounds são públicos para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'backgrounds');

DROP POLICY IF EXISTS "Service role pode fazer upload de backgrounds" ON storage.objects;
CREATE POLICY "Service role pode fazer upload de backgrounds"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'backgrounds');

DROP POLICY IF EXISTS "Service role pode atualizar backgrounds" ON storage.objects;
CREATE POLICY "Service role pode atualizar backgrounds"
ON storage.objects FOR UPDATE
USING (bucket_id = 'backgrounds');

DROP POLICY IF EXISTS "Service role pode deletar backgrounds" ON storage.objects;
CREATE POLICY "Service role pode deletar backgrounds"
ON storage.objects FOR DELETE
USING (bucket_id = 'backgrounds');

-- Garantir tabela de config existe
CREATE TABLE IF NOT EXISTS tres_poderes_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT UNIQUE NOT NULL,
  background_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para leitura pública
ALTER TABLE tres_poderes_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Config tres poderes é público para leitura" ON tres_poderes_config;
CREATE POLICY "Config tres poderes é público para leitura"
ON tres_poderes_config FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Config tres poderes pode ser inserido" ON tres_poderes_config;
CREATE POLICY "Config tres poderes pode ser inserido"
ON tres_poderes_config FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Config tres poderes pode ser atualizado" ON tres_poderes_config;
CREATE POLICY "Config tres poderes pode ser atualizado"
ON tres_poderes_config FOR UPDATE
USING (true);