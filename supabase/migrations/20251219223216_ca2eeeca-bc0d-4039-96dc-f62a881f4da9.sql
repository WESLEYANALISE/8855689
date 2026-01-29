-- Adicionar políticas de INSERT e DELETE para CPI - Código de Propriedade Industrial
CREATE POLICY "Sistema pode inserir" ON public."CPI - Código de Propriedade Industrial" FOR INSERT WITH CHECK (true);
CREATE POLICY "Sistema pode deletar" ON public."CPI - Código de Propriedade Industrial" FOR DELETE USING (true);