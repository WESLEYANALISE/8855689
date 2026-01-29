-- Criar tabela de mapeamento LID → Telefone
CREATE TABLE IF NOT EXISTS evelyn_lid_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lid TEXT UNIQUE NOT NULL,
  telefone TEXT,
  push_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna remote_jid na tabela de conversas (se não existir)
ALTER TABLE evelyn_conversas ADD COLUMN IF NOT EXISTS remote_jid TEXT;

-- Habilitar RLS
ALTER TABLE evelyn_lid_mapping ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso via service role
CREATE POLICY "Service role full access on evelyn_lid_mapping" 
ON evelyn_lid_mapping
FOR ALL 
USING (true)
WITH CHECK (true);

-- Índice para busca rápida por LID
CREATE INDEX IF NOT EXISTS idx_evelyn_lid_mapping_lid ON evelyn_lid_mapping(lid);

-- Índice para busca por telefone
CREATE INDEX IF NOT EXISTS idx_evelyn_lid_mapping_telefone ON evelyn_lid_mapping(telefone);