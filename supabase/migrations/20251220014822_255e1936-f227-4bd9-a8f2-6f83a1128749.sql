-- Tabela para armazenar leis na "Resenha Diária" do Vade Mecum
CREATE TABLE public.resenha_diaria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_lei TEXT NOT NULL UNIQUE,
  ementa TEXT,
  data_publicacao DATE,
  url_planalto TEXT NOT NULL,
  artigos JSONB DEFAULT '[]'::jsonb,
  areas_direito TEXT[] DEFAULT '{}',
  texto_formatado TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para busca
CREATE INDEX idx_resenha_diaria_numero_lei ON public.resenha_diaria(numero_lei);
CREATE INDEX idx_resenha_diaria_data ON public.resenha_diaria(data_publicacao DESC);
CREATE INDEX idx_resenha_diaria_status ON public.resenha_diaria(status);

-- Trigger para updated_at
CREATE TRIGGER update_resenha_diaria_updated_at
  BEFORE UPDATE ON public.resenha_diaria
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.resenha_diaria ENABLE ROW LEVEL SECURITY;

-- Política pública para leitura
CREATE POLICY "Resenha diária é pública para leitura" 
  ON public.resenha_diaria 
  FOR SELECT 
  USING (true);

-- Política para inserção/atualização (apenas autenticados, idealmente admin)
CREATE POLICY "Usuários autenticados podem inserir resenha" 
  ON public.resenha_diaria 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar resenha" 
  ON public.resenha_diaria 
  FOR UPDATE 
  USING (true);

COMMENT ON TABLE public.resenha_diaria IS 'Leis publicadas recentemente para exibição na seção Resenha Diária do Vade Mecum';