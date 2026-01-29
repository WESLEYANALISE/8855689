-- Tabela para persistir o estado da automação de formatação de leis
CREATE TABLE public.automacao_formatacao_leis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'paused', 'completed')),
  dia_atual INTEGER,
  mes_atual INTEGER,
  ano_atual INTEGER,
  lei_atual_id UUID,
  leis_processadas INTEGER DEFAULT 0,
  leis_total INTEGER DEFAULT 0,
  leis_com_erro INTEGER DEFAULT 0,
  ultima_lei_processada TEXT,
  erros JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Apenas uma linha de estado (singleton)
INSERT INTO public.automacao_formatacao_leis (id, status) VALUES ('00000000-0000-0000-0000-000000000001', 'idle');

-- Habilitar RLS
ALTER TABLE public.automacao_formatacao_leis ENABLE ROW LEVEL SECURITY;

-- Políticas - acesso público para leitura e escrita (pois é estado de app, não dados de usuário)
CREATE POLICY "Permitir leitura pública" ON public.automacao_formatacao_leis FOR SELECT USING (true);
CREATE POLICY "Permitir atualização pública" ON public.automacao_formatacao_leis FOR UPDATE USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_automacao_formatacao_leis_updated_at
BEFORE UPDATE ON public.automacao_formatacao_leis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();