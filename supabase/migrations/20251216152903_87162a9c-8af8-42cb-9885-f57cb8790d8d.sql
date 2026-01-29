-- Criar tabela para armazenar verificações OCR
CREATE TABLE public.ocr_verificacao (
  id BIGSERIAL PRIMARY KEY,
  livro_id BIGINT NOT NULL,
  livro_titulo TEXT NOT NULL,
  pagina INT NOT NULL,
  texto_original TEXT,
  texto_novo_ocr TEXT,
  diferenca_percentual DECIMAL(5,2),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'verificado', 'corrigido', 'ignorado')),
  erros_detectados TEXT[],
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(livro_id, pagina)
);

-- Criar índices para performance
CREATE INDEX idx_ocr_verificacao_livro ON public.ocr_verificacao(livro_id);
CREATE INDEX idx_ocr_verificacao_status ON public.ocr_verificacao(status);
CREATE INDEX idx_ocr_verificacao_diferenca ON public.ocr_verificacao(diferenca_percentual DESC);

-- Enable RLS
ALTER TABLE public.ocr_verificacao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - acesso público para leitura e escrita (admin)
CREATE POLICY "OCR verificação é público para leitura"
ON public.ocr_verificacao FOR SELECT
USING (true);

CREATE POLICY "OCR verificação permite inserção"
ON public.ocr_verificacao FOR INSERT
WITH CHECK (true);

CREATE POLICY "OCR verificação permite atualização"
ON public.ocr_verificacao FOR UPDATE
USING (true);

CREATE POLICY "OCR verificação permite exclusão"
ON public.ocr_verificacao FOR DELETE
USING (true);

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_ocr_verificacao_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ocr_verificacao_timestamp
BEFORE UPDATE ON public.ocr_verificacao
FOR EACH ROW
EXECUTE FUNCTION public.update_ocr_verificacao_timestamp();