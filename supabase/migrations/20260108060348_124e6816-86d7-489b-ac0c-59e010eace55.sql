-- Adicionar coluna perfil na tabela evelyn_usuarios
ALTER TABLE evelyn_usuarios 
ADD COLUMN IF NOT EXISTS perfil TEXT 
CHECK (perfil IN ('estudante', 'concurseiro', 'advogado'));

COMMENT ON COLUMN evelyn_usuarios.perfil IS 'Perfil do usuário: estudante, concurseiro ou advogado';