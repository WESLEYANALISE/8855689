-- Adicionar colunas para controle de período de teste na tabela evelyn_usuarios
ALTER TABLE evelyn_usuarios 
ADD COLUMN IF NOT EXISTS data_primeiro_contato TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS periodo_teste_expirado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS aviso_teste_enviado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Criar índice para busca por telefone (otimização)
CREATE INDEX IF NOT EXISTS idx_evelyn_usuarios_telefone ON evelyn_usuarios(telefone);

-- Criar índice para busca por user_id
CREATE INDEX IF NOT EXISTS idx_evelyn_usuarios_user_id ON evelyn_usuarios(user_id);

-- Atualizar usuários existentes: definir data_primeiro_contato como created_at
UPDATE evelyn_usuarios 
SET data_primeiro_contato = created_at 
WHERE data_primeiro_contato IS NULL AND created_at IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN evelyn_usuarios.data_primeiro_contato IS 'Data do primeiro contato com a Evelyn - usado para calcular período de teste de 3 dias';
COMMENT ON COLUMN evelyn_usuarios.periodo_teste_expirado IS 'Indica se o período de teste de 3 dias já expirou';
COMMENT ON COLUMN evelyn_usuarios.aviso_teste_enviado IS 'Indica se já foi enviado o aviso de expiração do período de teste';
COMMENT ON COLUMN evelyn_usuarios.user_id IS 'Vínculo com usuário autenticado do app (se existir)';