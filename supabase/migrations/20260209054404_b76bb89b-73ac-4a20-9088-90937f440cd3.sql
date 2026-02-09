-- Atualizar constraint de intencao para aceitar os 4 novos valores
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_intencao_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_intencao_check 
  CHECK (intencao = ANY (ARRAY['universitario', 'concurseiro', 'oab', 'advogado', 'estudante']::text[]));