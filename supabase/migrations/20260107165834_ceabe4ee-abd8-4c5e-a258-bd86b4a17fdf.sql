-- Criar tabela para preferências de notificação da Evelyn
CREATE TABLE public.evelyn_preferencias_notificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES evelyn_usuarios(id) ON DELETE CASCADE,
  telefone TEXT NOT NULL,
  
  -- Tipos de notificação
  receber_resumo_dia BOOLEAN DEFAULT false,
  receber_noticias_concursos BOOLEAN DEFAULT false,
  receber_novas_leis BOOLEAN DEFAULT false,
  receber_atualizacoes_leis BOOLEAN DEFAULT false,
  
  -- Horário de envio
  horario_envio TEXT DEFAULT '18:00' CHECK (horario_envio IN ('18:00', '22:00')),
  
  -- Controle
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(telefone)
);

-- Habilitar RLS
ALTER TABLE public.evelyn_preferencias_notificacao ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura/escrita pública (já que não temos auth aqui, é via telefone)
CREATE POLICY "Permitir acesso público às preferências"
ON public.evelyn_preferencias_notificacao
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_evelyn_preferencias_updated_at
  BEFORE UPDATE ON public.evelyn_preferencias_notificacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_evelyn_updated_at();