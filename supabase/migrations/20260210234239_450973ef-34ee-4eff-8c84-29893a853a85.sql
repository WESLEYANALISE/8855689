CREATE POLICY "Admin pode ver todas as assinaturas"
  ON subscriptions FOR SELECT
  USING (is_admin(auth.uid()));