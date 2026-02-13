CREATE TABLE busca_leis_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  termo text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE busca_leis_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON busca_leis_historico FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history"
  ON busca_leis_historico FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);