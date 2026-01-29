-- Tabela para armazenar petições do Google Drive (30k+ arquivos)
CREATE TABLE public.peticoes_modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  link_direto TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho_bytes BIGINT,
  arquivo_drive_id TEXT UNIQUE NOT NULL,
  pasta_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para busca rápida
CREATE INDEX idx_peticoes_modelos_categoria ON public.peticoes_modelos(categoria);
CREATE INDEX idx_peticoes_modelos_nome ON public.peticoes_modelos USING gin(to_tsvector('portuguese', nome_arquivo));
CREATE INDEX idx_peticoes_modelos_drive_id ON public.peticoes_modelos(arquivo_drive_id);

-- RLS habilitado mas com acesso público para leitura
ALTER TABLE public.peticoes_modelos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de petições" 
ON public.peticoes_modelos 
FOR SELECT 
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_peticoes_modelos_updated_at
BEFORE UPDATE ON public.peticoes_modelos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para log de sincronização
CREATE TABLE public.peticoes_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running',
  total_arquivos INTEGER DEFAULT 0,
  novos_arquivos INTEGER DEFAULT 0,
  atualizados INTEGER DEFAULT 0,
  erros INTEGER DEFAULT 0,
  detalhes JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.peticoes_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de sync log" 
ON public.peticoes_sync_log 
FOR SELECT 
USING (true);