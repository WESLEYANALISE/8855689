-- Criar políticas para posts_juridicos

-- Permitir leitura pública de todos os posts
CREATE POLICY "Qualquer pessoa pode ler posts_juridicos" 
ON public.posts_juridicos 
FOR SELECT 
USING (true);

-- Permitir inserção pública (para admin criar posts)
CREATE POLICY "Qualquer pessoa pode inserir posts_juridicos" 
ON public.posts_juridicos 
FOR INSERT 
WITH CHECK (true);

-- Permitir atualização pública
CREATE POLICY "Qualquer pessoa pode atualizar posts_juridicos" 
ON public.posts_juridicos 
FOR UPDATE 
USING (true);

-- Permitir exclusão pública
CREATE POLICY "Qualquer pessoa pode excluir posts_juridicos" 
ON public.posts_juridicos 
FOR DELETE 
USING (true);