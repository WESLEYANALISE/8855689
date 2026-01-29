-- Adicionar colunas na tabela de obras para identificar origem e tipo
ALTER TABLE aprofundamento_obras 
ADD COLUMN IF NOT EXISTS fonte TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS tipo_obra TEXT;

-- Adicionar campo de curiosidades na tabela de ministros do STF
ALTER TABLE tres_poderes_ministros_stf 
ADD COLUMN IF NOT EXISTS curiosidades JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS curiosidades_atualizadas_em TIMESTAMP WITH TIME ZONE;

-- Criar tabela de cache para IDs Lattes de deputados e senadores
CREATE TABLE IF NOT EXISTS aprofundamento_lattes_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id UUID,
  membro_tipo TEXT NOT NULL CHECK (membro_tipo IN ('deputado', 'senador', 'ministro')),
  membro_nome TEXT NOT NULL,
  lattes_id TEXT,
  lattes_url TEXT,
  ultima_atualizacao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(membro_nome, membro_tipo)
);

-- Habilitar RLS
ALTER TABLE aprofundamento_lattes_cache ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Lattes cache é público para leitura" 
ON aprofundamento_lattes_cache 
FOR SELECT 
USING (true);

-- Criar tabela de log de atualizações do cron
CREATE TABLE IF NOT EXISTS aprofundamento_atualizacoes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('obras_stf', 'obras_lattes', 'curiosidades', 'cron_mensal')),
  status TEXT NOT NULL CHECK (status IN ('iniciado', 'processando', 'concluido', 'erro')),
  registros_processados INTEGER DEFAULT 0,
  registros_atualizados INTEGER DEFAULT 0,
  detalhes JSONB DEFAULT '{}'::jsonb,
  erro_mensagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  concluido_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE aprofundamento_atualizacoes_log ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública para logs
CREATE POLICY "Logs de atualização são públicos para leitura" 
ON aprofundamento_atualizacoes_log 
FOR SELECT 
USING (true);