-- Tabela para armazenar tokens FCM dos dispositivos
CREATE TABLE public.dispositivos_fcm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL UNIQUE,
  device_info JSONB,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para busca rápida
CREATE INDEX idx_dispositivos_fcm_ativo ON public.dispositivos_fcm(ativo) WHERE ativo = true;
CREATE INDEX idx_dispositivos_fcm_user_id ON public.dispositivos_fcm(user_id);

-- Tabela para histórico de notificações enviadas
CREATE TABLE public.notificacoes_push_enviadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  link TEXT,
  imagem_url TEXT,
  total_enviados INTEGER DEFAULT 0,
  total_sucesso INTEGER DEFAULT 0,
  total_falha INTEGER DEFAULT 0,
  enviado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dispositivos_fcm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_push_enviadas ENABLE ROW LEVEL SECURITY;

-- Políticas para dispositivos_fcm
CREATE POLICY "Usuarios podem ver seus dispositivos" ON public.dispositivos_fcm
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios podem inserir seus dispositivos" ON public.dispositivos_fcm
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios podem atualizar seus dispositivos" ON public.dispositivos_fcm
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role pode ler todos dispositivos" ON public.dispositivos_fcm
  FOR SELECT USING (true);

-- Política pública para notificacoes (apenas leitura para admin)
CREATE POLICY "Todos podem ver notificacoes" ON public.notificacoes_push_enviadas
  FOR SELECT USING (true);

CREATE POLICY "Autenticados podem inserir notificacoes" ON public.notificacoes_push_enviadas
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_dispositivos_fcm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dispositivos_fcm_updated_at
  BEFORE UPDATE ON public.dispositivos_fcm
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dispositivos_fcm_updated_at();