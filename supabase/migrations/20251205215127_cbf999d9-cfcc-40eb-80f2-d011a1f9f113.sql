-- Criar buckets para armazenamento de arquivos
INSERT INTO storage.buckets (id, name, public) VALUES ('imagens', 'imagens', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('audios', 'audios', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', true) ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para acesso público de leitura
CREATE POLICY "Imagens são públicas" ON storage.objects FOR SELECT USING (bucket_id = 'imagens');
CREATE POLICY "Audios são públicos" ON storage.objects FOR SELECT USING (bucket_id = 'audios');
CREATE POLICY "PDFs são públicos" ON storage.objects FOR SELECT USING (bucket_id = 'pdfs');

-- Políticas para inserção via service role (edge functions)
CREATE POLICY "Service role pode inserir imagens" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'imagens');
CREATE POLICY "Service role pode inserir audios" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audios');
CREATE POLICY "Service role pode inserir pdfs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pdfs');