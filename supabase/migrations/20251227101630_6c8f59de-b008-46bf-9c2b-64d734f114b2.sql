-- Adicionar políticas de DELETE e UPDATE para as tabelas evelyn_*

-- evelyn_usuarios - permitir todas operações
DROP POLICY IF EXISTS "Allow all operations on evelyn_usuarios" ON evelyn_usuarios;
CREATE POLICY "Allow all operations on evelyn_usuarios" 
ON evelyn_usuarios
FOR ALL 
USING (true)
WITH CHECK (true);

-- evelyn_conversas - permitir todas operações
DROP POLICY IF EXISTS "Allow all operations on evelyn_conversas" ON evelyn_conversas;
CREATE POLICY "Allow all operations on evelyn_conversas" 
ON evelyn_conversas
FOR ALL 
USING (true)
WITH CHECK (true);

-- evelyn_mensagens - permitir todas operações
DROP POLICY IF EXISTS "Allow all operations on evelyn_mensagens" ON evelyn_mensagens;
CREATE POLICY "Allow all operations on evelyn_mensagens" 
ON evelyn_mensagens
FOR ALL 
USING (true)
WITH CHECK (true);

-- evelyn_config - permitir todas operações
DROP POLICY IF EXISTS "Allow all operations on evelyn_config" ON evelyn_config;
CREATE POLICY "Allow all operations on evelyn_config" 
ON evelyn_config
FOR ALL 
USING (true)
WITH CHECK (true);