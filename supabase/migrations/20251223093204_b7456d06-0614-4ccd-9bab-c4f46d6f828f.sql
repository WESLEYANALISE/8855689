-- Criar tabela para armazenar documentários narrados de ministros/juristas
CREATE TABLE public.documentarios_ministros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministro_nome TEXT NOT NULL UNIQUE,
  texto_completo TEXT,
  cenas JSONB NOT NULL DEFAULT '[]'::jsonb,
  url_audio_completo TEXT,
  duracao_total INTEGER DEFAULT 0,
  imagens_disponiveis JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'gerando', 'pronto', 'erro')),
  erro_mensagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.documentarios_ministros ENABLE ROW LEVEL SECURITY;

-- Política pública para leitura (documentários são públicos)
CREATE POLICY "Documentários são públicos para leitura" 
ON public.documentarios_ministros 
FOR SELECT 
USING (true);

-- Política para inserção/atualização via service role (edge functions)
CREATE POLICY "Service role pode gerenciar documentários" 
ON public.documentarios_ministros 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_documentarios_ministros_updated_at
BEFORE UPDATE ON public.documentarios_ministros
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índice para buscas por nome
CREATE INDEX idx_documentarios_ministros_nome ON public.documentarios_ministros(ministro_nome);

-- Índice para filtrar por status
CREATE INDEX idx_documentarios_ministros_status ON public.documentarios_ministros(status);

-- Comentário explicativo
COMMENT ON TABLE public.documentarios_ministros IS 'Armazena documentários narrados com cenas sincronizadas de áudio e imagens para ministros/juristas';