-- Adicionar novas colunas de configuração avançada na evelyn_config
ALTER TABLE evelyn_config ADD COLUMN IF NOT EXISTS limite_caracteres INTEGER DEFAULT 1000;
ALTER TABLE evelyn_config ADD COLUMN IF NOT EXISTS estilo_resposta TEXT DEFAULT 'didático';
ALTER TABLE evelyn_config ADD COLUMN IF NOT EXISTS nivel_detalhamento TEXT DEFAULT 'normal';
ALTER TABLE evelyn_config ADD COLUMN IF NOT EXISTS usar_nome BOOLEAN DEFAULT true;
ALTER TABLE evelyn_config ADD COLUMN IF NOT EXISTS saudacao_horario BOOLEAN DEFAULT true;
ALTER TABLE evelyn_config ADD COLUMN IF NOT EXISTS perguntar_nome_inicio BOOLEAN DEFAULT true;
ALTER TABLE evelyn_config ADD COLUMN IF NOT EXISTS recomendar_livros BOOLEAN DEFAULT true;
ALTER TABLE evelyn_config ADD COLUMN IF NOT EXISTS feedback_audio_interativo BOOLEAN DEFAULT true;

-- Adicionar coluna para estado de aguardando nome na conversa
ALTER TABLE evelyn_conversas ADD COLUMN IF NOT EXISTS aguardando_nome BOOLEAN DEFAULT false;

-- Adicionar coluna de nome na evelyn_usuarios se não existir (para garantir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'evelyn_usuarios' AND column_name = 'nome') THEN
    ALTER TABLE evelyn_usuarios ADD COLUMN nome TEXT;
  END IF;
END $$;