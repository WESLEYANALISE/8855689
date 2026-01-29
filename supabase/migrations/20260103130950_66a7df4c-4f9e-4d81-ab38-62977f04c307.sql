-- Adicionar coluna para controle de saudação diária Premium na Evelyn
ALTER TABLE evelyn_usuarios 
ADD COLUMN IF NOT EXISTS ultima_saudacao_premium TIMESTAMPTZ;