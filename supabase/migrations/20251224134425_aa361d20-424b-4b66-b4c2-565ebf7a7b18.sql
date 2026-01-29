-- Verificar e atualizar a constraint do tipo para permitir novos valores
-- Primeiro removemos a constraint existente se houver
DO $$ 
BEGIN
  -- Tentar remover constraint existente (se existir)
  ALTER TABLE resumos_diarios DROP CONSTRAINT IF EXISTS resumos_diarios_tipo_check;
EXCEPTION 
  WHEN undefined_object THEN 
    NULL; -- Ignora se não existir
END $$;

-- Adicionar constraint atualizada com todos os tipos
ALTER TABLE resumos_diarios ADD CONSTRAINT resumos_diarios_tipo_check 
  CHECK (tipo IN ('juridica', 'politica', 'direito', 'concurso'));

-- Criar índice para melhor performance nas queries por tipo
CREATE INDEX IF NOT EXISTS idx_resumos_diarios_tipo_data ON resumos_diarios(tipo, data DESC);