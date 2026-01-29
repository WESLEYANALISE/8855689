-- Tabela de usuários do Evelyn WhatsApp
CREATE TABLE public.evelyn_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone TEXT UNIQUE NOT NULL,
  nome TEXT,
  ultimo_contato TIMESTAMPTZ DEFAULT NOW(),
  total_mensagens INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de conversas
CREATE TABLE public.evelyn_conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.evelyn_usuarios(id) ON DELETE CASCADE,
  telefone TEXT NOT NULL,
  status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'encerrada')),
  contexto JSONB DEFAULT '[]'::jsonb,
  instance_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE public.evelyn_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID REFERENCES public.evelyn_conversas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('texto', 'audio', 'imagem', 'documento', 'video')),
  conteudo TEXT,
  remetente TEXT NOT NULL CHECK (remetente IN ('usuario', 'evelyn')),
  metadata JSONB,
  processado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de configuração da instância
CREATE TABLE public.evelyn_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name TEXT UNIQUE NOT NULL,
  evolution_url TEXT,
  api_key_hash TEXT,
  status TEXT DEFAULT 'desconectado' CHECK (status IN ('conectado', 'desconectado', 'conectando')),
  qr_code TEXT,
  telefone_conectado TEXT,
  prompt_sistema TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_evelyn_usuarios_telefone ON public.evelyn_usuarios(telefone);
CREATE INDEX idx_evelyn_conversas_telefone ON public.evelyn_conversas(telefone);
CREATE INDEX idx_evelyn_conversas_status ON public.evelyn_conversas(status);
CREATE INDEX idx_evelyn_mensagens_conversa ON public.evelyn_mensagens(conversa_id);
CREATE INDEX idx_evelyn_mensagens_created ON public.evelyn_mensagens(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.evelyn_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evelyn_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evelyn_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evelyn_config ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para as edge functions (via service role)
CREATE POLICY "Permitir leitura pública evelyn_usuarios"
ON public.evelyn_usuarios FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública evelyn_usuarios"
ON public.evelyn_usuarios FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização pública evelyn_usuarios"
ON public.evelyn_usuarios FOR UPDATE USING (true);

CREATE POLICY "Permitir leitura pública evelyn_conversas"
ON public.evelyn_conversas FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública evelyn_conversas"
ON public.evelyn_conversas FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização pública evelyn_conversas"
ON public.evelyn_conversas FOR UPDATE USING (true);

CREATE POLICY "Permitir leitura pública evelyn_mensagens"
ON public.evelyn_mensagens FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública evelyn_mensagens"
ON public.evelyn_mensagens FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura pública evelyn_config"
ON public.evelyn_config FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública evelyn_config"
ON public.evelyn_config FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização pública evelyn_config"
ON public.evelyn_config FOR UPDATE USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_evelyn_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_evelyn_usuarios_updated_at
BEFORE UPDATE ON public.evelyn_usuarios
FOR EACH ROW EXECUTE FUNCTION public.update_evelyn_updated_at();

CREATE TRIGGER update_evelyn_conversas_updated_at
BEFORE UPDATE ON public.evelyn_conversas
FOR EACH ROW EXECUTE FUNCTION public.update_evelyn_updated_at();

CREATE TRIGGER update_evelyn_config_updated_at
BEFORE UPDATE ON public.evelyn_config
FOR EACH ROW EXECUTE FUNCTION public.update_evelyn_updated_at();