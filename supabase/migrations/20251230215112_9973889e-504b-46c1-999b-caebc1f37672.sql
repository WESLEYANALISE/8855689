-- Atualizar o registro com 55 para autorizado=true
UPDATE evelyn_usuarios 
SET autorizado = true, updated_at = now()
WHERE telefone = '5511991897603';

-- Migrar conversas do registro que será deletado
UPDATE evelyn_conversas 
SET usuario_id = (SELECT id FROM evelyn_usuarios WHERE telefone = '5511991897603')
WHERE usuario_id = (SELECT id FROM evelyn_usuarios WHERE telefone = '11991897603');

-- Migrar memória do usuário
UPDATE evelyn_memoria_usuario 
SET usuario_id = (SELECT id FROM evelyn_usuarios WHERE telefone = '5511991897603')
WHERE usuario_id = (SELECT id FROM evelyn_usuarios WHERE telefone = '11991897603');

-- Migrar progresso do usuário
UPDATE evelyn_progresso_usuario 
SET usuario_id = (SELECT id FROM evelyn_usuarios WHERE telefone = '5511991897603')
WHERE usuario_id = (SELECT id FROM evelyn_usuarios WHERE telefone = '11991897603');

-- Deletar o registro sem o prefixo 55
DELETE FROM evelyn_usuarios WHERE telefone = '11991897603';

-- Normalizar todos os outros telefones que não começam com 55
UPDATE evelyn_usuarios
SET telefone = '55' || telefone
WHERE telefone NOT LIKE '55%' 
  AND LENGTH(telefone) >= 10 
  AND LENGTH(telefone) <= 11;

-- Adicionar coluna para rastrear confirmação de nome
ALTER TABLE evelyn_usuarios 
ADD COLUMN IF NOT EXISTS nome_confirmado BOOLEAN DEFAULT false;

-- Criar função para normalizar telefone
CREATE OR REPLACE FUNCTION public.normalizar_telefone_evelyn(telefone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  numeros TEXT;
BEGIN
  numeros := regexp_replace(telefone, '\D', '', 'g');
  
  IF numeros LIKE '55%' AND length(numeros) >= 12 AND length(numeros) <= 13 THEN
    RETURN numeros;
  END IF;
  
  IF length(numeros) >= 10 AND length(numeros) <= 11 THEN
    RETURN '55' || numeros;
  END IF;
  
  RETURN numeros;
END;
$$;