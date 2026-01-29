-- Criar tabela para audiências públicas
CREATE TABLE IF NOT EXISTS public.audiencias_publicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tribunal TEXT NOT NULL,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ,
  horario TEXT NOT NULL,
  local TEXT NOT NULL,
  endereco TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  link_inscricao TEXT,
  link_transmissao TEXT,
  eh_presencial BOOLEAN DEFAULT true,
  eh_virtual BOOLEAN DEFAULT false,
  emite_certificado BOOLEAN DEFAULT true,
  horas_complementares INTEGER DEFAULT 2,
  requer_inscricao BOOLEAN DEFAULT false,
  vagas_disponiveis INTEGER,
  tags TEXT[],
  contato_email TEXT,
  contato_telefone TEXT,
  observacoes TEXT,
  fonte TEXT NOT NULL,
  url_fonte TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela para eventos jurídicos
CREATE TABLE IF NOT EXISTS public.eventos_juridicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ,
  horario_inicio TEXT,
  horario_fim TEXT,
  local TEXT,
  endereco TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  organizador TEXT,
  palestrantes JSONB,
  programacao JSONB,
  eh_gratuito BOOLEAN DEFAULT true,
  preco_inteira DECIMAL(10,2),
  preco_meia DECIMAL(10,2),
  emite_certificado BOOLEAN DEFAULT true,
  horas_complementares INTEGER DEFAULT 2,
  vagas_total INTEGER,
  vagas_preenchidas INTEGER DEFAULT 0,
  link_inscricao TEXT,
  link_transmissao TEXT,
  imagem_capa TEXT,
  tags TEXT[],
  fonte TEXT NOT NULL,
  url_fonte TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_audiencias_data ON public.audiencias_publicas(data_inicio);
CREATE INDEX idx_audiencias_tribunal ON public.audiencias_publicas(tribunal);
CREATE INDEX idx_eventos_data ON public.eventos_juridicos(data_inicio);
CREATE INDEX idx_eventos_categoria ON public.eventos_juridicos(categoria);

-- Habilitar RLS
ALTER TABLE public.audiencias_publicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_juridicos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (público - somente leitura)
CREATE POLICY "Audiências públicas são visíveis para todos"
  ON public.audiencias_publicas FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Eventos são visíveis para todos"
  ON public.eventos_juridicos FOR SELECT
  TO public
  USING (true);

-- Popular com dados iniciais
INSERT INTO public.audiencias_publicas (tipo, titulo, descricao, tribunal, data_inicio, horario, local, endereco, latitude, longitude, eh_virtual, eh_presencial, emite_certificado, horas_complementares, fonte, url_fonte, link_transmissao) VALUES
('Audiência Pública', 'Inteligência Artificial no Poder Judiciário', 'Debate sobre uso de IA na análise de processos e tomada de decisões judiciais', 'CNJ', '2025-11-15 14:00:00-03', '14:00', 'Transmissão Online', 'YouTube CNJ', NULL, NULL, true, false, true, 3, 'manual', 'https://www.cnj.jus.br/audiencias-publicas/', 'https://www.youtube.com/CNJ'),
('Sessão de Julgamento', 'ADPF 709 - Marco Temporal Terras Indígenas', 'Julgamento sobre a tese do marco temporal para demarcação de terras indígenas', 'STF', '2025-11-08 14:00:00-03', '14:00', 'Supremo Tribunal Federal', 'Praça dos Três Poderes - Brasília, DF', -15.7998, -47.8645, true, true, false, 4, 'manual', 'https://portal.stf.jus.br', 'https://www.youtube.com/STF'),
('Audiência Pública', 'Direito do Consumidor na Era Digital', 'Discussão sobre proteção de dados, e-commerce e direitos do consumidor digital', 'TJRJ', '2025-11-12 10:00:00-03', '10:00', 'Tribunal de Justiça do Rio de Janeiro', 'Av. Erasmo Braga, 115 - Centro, Rio de Janeiro', -22.9068, -43.1729, true, true, true, 2, 'manual', 'https://www.tjrj.jus.br', 'https://www.youtube.com/tjrj'),
('Audiência de Conciliação', 'Semana Nacional de Conciliação 2025', 'Mutirão de conciliação para resolução de conflitos', 'CNJ', '2025-11-18 09:00:00-03', '09:00', 'Fóruns de todo o Brasil', 'Diversos', NULL, NULL, false, true, true, 5, 'manual', 'https://www.cnj.jus.br/programas-e-acoes/conciliacao/', NULL);

INSERT INTO public.eventos_juridicos (titulo, descricao, categoria, data_inicio, horario_inicio, local, endereco, organizador, eh_gratuito, emite_certificado, horas_complementares, link_inscricao, fonte, tags) VALUES
('Semana Nacional de Conciliação', 'Evento anual do CNJ promovendo a cultura da paz e resolução consensual de conflitos', 'Seminário', '2025-11-18 09:00:00-03', '09:00', 'Fóruns de todo o Brasil', 'Diversos', 'CNJ', true, true, 8, 'https://www.cnj.jus.br', 'manual', ARRAY['conciliação', 'mediação', 'justiça restaurativa']),
('Congresso Brasileiro de Direito Digital', 'Debates sobre LGPD, Inteligência Artificial e regulamentação do Metaverso', 'Congresso', '2025-12-05 08:00:00-03', '08:00', 'Centro de Convenções Rebouças', 'Av. Rebouças, 600 - Pinheiros, São Paulo - SP', 'OAB/SP', false, true, 16, 'https://www.oabsp.org.br', 'manual', ARRAY['direito digital', 'lgpd', 'inteligência artificial']),
('Workshop: Prática Trabalhista para Iniciantes', 'Elaboração de petições trabalhistas e preparação para audiências', 'Workshop', '2025-11-25 14:00:00-03', '14:00', 'OAB Rio de Janeiro', 'Av. Marechal Câmara, 150 - Centro, Rio de Janeiro - RJ', 'OAB/RJ', true, true, 4, 'https://www.oabrj.org.br', 'manual', ARRAY['direito trabalhista', 'petições', 'audiências']),
('Palestra: Advocacia 4.0 e Lawtech', 'Novas tecnologias aplicadas à advocacia e startups jurídicas', 'Palestra', '2025-11-20 19:00:00-03', '19:00', 'Evento Online', 'Zoom', 'Instituto de Tecnologia Jurídica', true, true, 2, 'https://itechjur.com.br', 'manual', ARRAY['lawtech', 'tecnologia jurídica', 'inovação']);