-- ═══════════════════════════════════════════════════════════════════════════
-- TABELAS DE LEGISLAÇÃO PARA VADE MECUM
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. DECRETOS
CREATE TABLE public."DECRETOS_VADEMECUM" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_lei TEXT NOT NULL,
  tipo_ato TEXT DEFAULT 'Decreto',
  ementa TEXT,
  data_publicacao DATE,
  data_dou DATE,
  url_planalto TEXT,
  texto_formatado TEXT,
  artigos JSONB DEFAULT '[]'::jsonb,
  areas_direito TEXT[] DEFAULT '{}',
  vigencia TEXT DEFAULT 'vigente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. LEIS ORDINÁRIAS
CREATE TABLE public."LEIS_ORDINARIAS_VADEMECUM" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_lei TEXT NOT NULL,
  tipo_ato TEXT DEFAULT 'Lei Ordinária',
  ementa TEXT,
  data_publicacao DATE,
  data_dou DATE,
  url_planalto TEXT,
  texto_formatado TEXT,
  artigos JSONB DEFAULT '[]'::jsonb,
  areas_direito TEXT[] DEFAULT '{}',
  vigencia TEXT DEFAULT 'vigente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. LEIS COMPLEMENTARES
CREATE TABLE public."LEIS_COMPLEMENTARES_VADEMECUM" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_lei TEXT NOT NULL,
  tipo_ato TEXT DEFAULT 'Lei Complementar',
  ementa TEXT,
  data_publicacao DATE,
  data_dou DATE,
  url_planalto TEXT,
  texto_formatado TEXT,
  artigos JSONB DEFAULT '[]'::jsonb,
  areas_direito TEXT[] DEFAULT '{}',
  vigencia TEXT DEFAULT 'vigente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. MEDIDAS PROVISÓRIAS
CREATE TABLE public."MEDIDAS_PROVISORIAS_VADEMECUM" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_lei TEXT NOT NULL,
  tipo_ato TEXT DEFAULT 'Medida Provisória',
  ementa TEXT,
  data_publicacao DATE,
  data_dou DATE,
  url_planalto TEXT,
  texto_formatado TEXT,
  artigos JSONB DEFAULT '[]'::jsonb,
  areas_direito TEXT[] DEFAULT '{}',
  vigencia TEXT DEFAULT 'vigente',
  situacao TEXT DEFAULT 'em_vigor', -- em_vigor, convertida, caducou, rejeitada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. PROJETOS DE LEI (PL)
CREATE TABLE public."PL_VADEMECUM" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_lei TEXT NOT NULL,
  tipo_ato TEXT DEFAULT 'Projeto de Lei',
  ementa TEXT,
  data_apresentacao DATE,
  url_camara TEXT,
  texto_formatado TEXT,
  artigos JSONB DEFAULT '[]'::jsonb,
  areas_direito TEXT[] DEFAULT '{}',
  situacao TEXT DEFAULT 'tramitando', -- tramitando, aprovado, arquivado, vetado
  autor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. PROJETOS DE LEI COMPLEMENTAR (PLP)
CREATE TABLE public."PLP_VADEMECUM" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_lei TEXT NOT NULL,
  tipo_ato TEXT DEFAULT 'Projeto de Lei Complementar',
  ementa TEXT,
  data_apresentacao DATE,
  url_camara TEXT,
  texto_formatado TEXT,
  artigos JSONB DEFAULT '[]'::jsonb,
  areas_direito TEXT[] DEFAULT '{}',
  situacao TEXT DEFAULT 'tramitando',
  autor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. PROPOSTAS DE EMENDA CONSTITUCIONAL (PEC)
CREATE TABLE public."PEC_VADEMECUM" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_lei TEXT NOT NULL,
  tipo_ato TEXT DEFAULT 'Proposta de Emenda Constitucional',
  ementa TEXT,
  data_apresentacao DATE,
  url_camara TEXT,
  texto_formatado TEXT,
  artigos JSONB DEFAULT '[]'::jsonb,
  areas_direito TEXT[] DEFAULT '{}',
  situacao TEXT DEFAULT 'tramitando', -- tramitando, promulgada, arquivada, rejeitada
  autor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA DE INSCRITOS PARA PUSH DE LEGISLAÇÃO (NEWSLETTER)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.push_legislacao_inscritos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nome TEXT,
  areas_interesse TEXT[] DEFAULT '{}',
  frequencia TEXT DEFAULT 'diario', -- diario, semanal
  ativo BOOLEAN DEFAULT true,
  confirmado BOOLEAN DEFAULT false,
  token_confirmacao TEXT,
  ultimo_envio TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- HABILITAR RLS E CRIAR POLÍTICAS
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar RLS
ALTER TABLE public."DECRETOS_VADEMECUM" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEIS_ORDINARIAS_VADEMECUM" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LEIS_COMPLEMENTARES_VADEMECUM" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MEDIDAS_PROVISORIAS_VADEMECUM" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PL_VADEMECUM" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PLP_VADEMECUM" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PEC_VADEMECUM" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_legislacao_inscritos ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública para legislação (conteúdo público)
CREATE POLICY "Legislação é pública para leitura" ON public."DECRETOS_VADEMECUM" FOR SELECT USING (true);
CREATE POLICY "Legislação é pública para leitura" ON public."LEIS_ORDINARIAS_VADEMECUM" FOR SELECT USING (true);
CREATE POLICY "Legislação é pública para leitura" ON public."LEIS_COMPLEMENTARES_VADEMECUM" FOR SELECT USING (true);
CREATE POLICY "Legislação é pública para leitura" ON public."MEDIDAS_PROVISORIAS_VADEMECUM" FOR SELECT USING (true);
CREATE POLICY "Legislação é pública para leitura" ON public."PL_VADEMECUM" FOR SELECT USING (true);
CREATE POLICY "Legislação é pública para leitura" ON public."PLP_VADEMECUM" FOR SELECT USING (true);
CREATE POLICY "Legislação é pública para leitura" ON public."PEC_VADEMECUM" FOR SELECT USING (true);

-- Políticas de escrita via service role (edge functions)
CREATE POLICY "Service role pode inserir legislação" ON public."DECRETOS_VADEMECUM" FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role pode atualizar legislação" ON public."DECRETOS_VADEMECUM" FOR UPDATE USING (true);
CREATE POLICY "Service role pode inserir legislação" ON public."LEIS_ORDINARIAS_VADEMECUM" FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role pode atualizar legislação" ON public."LEIS_ORDINARIAS_VADEMECUM" FOR UPDATE USING (true);
CREATE POLICY "Service role pode inserir legislação" ON public."LEIS_COMPLEMENTARES_VADEMECUM" FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role pode atualizar legislação" ON public."LEIS_COMPLEMENTARES_VADEMECUM" FOR UPDATE USING (true);
CREATE POLICY "Service role pode inserir legislação" ON public."MEDIDAS_PROVISORIAS_VADEMECUM" FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role pode atualizar legislação" ON public."MEDIDAS_PROVISORIAS_VADEMECUM" FOR UPDATE USING (true);
CREATE POLICY "Service role pode inserir legislação" ON public."PL_VADEMECUM" FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role pode atualizar legislação" ON public."PL_VADEMECUM" FOR UPDATE USING (true);
CREATE POLICY "Service role pode inserir legislação" ON public."PLP_VADEMECUM" FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role pode atualizar legislação" ON public."PLP_VADEMECUM" FOR UPDATE USING (true);
CREATE POLICY "Service role pode inserir legislação" ON public."PEC_VADEMECUM" FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role pode atualizar legislação" ON public."PEC_VADEMECUM" FOR UPDATE USING (true);

-- Políticas para inscritos push (usuários podem se inscrever)
CREATE POLICY "Qualquer um pode se inscrever" ON public.push_legislacao_inscritos FOR INSERT WITH CHECK (true);
CREATE POLICY "Inscritos podem ver próprio registro" ON public.push_legislacao_inscritos FOR SELECT USING (true);
CREATE POLICY "Inscritos podem atualizar próprio registro" ON public.push_legislacao_inscritos FOR UPDATE USING (true);
CREATE POLICY "Inscritos podem cancelar inscrição" ON public.push_legislacao_inscritos FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS PARA UPDATED_AT
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TRIGGER update_decretos_vademecum_updated_at
  BEFORE UPDATE ON public."DECRETOS_VADEMECUM"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leis_ordinarias_vademecum_updated_at
  BEFORE UPDATE ON public."LEIS_ORDINARIAS_VADEMECUM"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leis_complementares_vademecum_updated_at
  BEFORE UPDATE ON public."LEIS_COMPLEMENTARES_VADEMECUM"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medidas_provisorias_vademecum_updated_at
  BEFORE UPDATE ON public."MEDIDAS_PROVISORIAS_VADEMECUM"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pl_vademecum_updated_at
  BEFORE UPDATE ON public."PL_VADEMECUM"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plp_vademecum_updated_at
  BEFORE UPDATE ON public."PLP_VADEMECUM"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pec_vademecum_updated_at
  BEFORE UPDATE ON public."PEC_VADEMECUM"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_push_legislacao_inscritos_updated_at
  BEFORE UPDATE ON public.push_legislacao_inscritos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- ÍNDICES PARA PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_decretos_numero ON public."DECRETOS_VADEMECUM" (numero_lei);
CREATE INDEX idx_decretos_data ON public."DECRETOS_VADEMECUM" (data_publicacao DESC);
CREATE INDEX idx_leis_ord_numero ON public."LEIS_ORDINARIAS_VADEMECUM" (numero_lei);
CREATE INDEX idx_leis_ord_data ON public."LEIS_ORDINARIAS_VADEMECUM" (data_publicacao DESC);
CREATE INDEX idx_leis_comp_numero ON public."LEIS_COMPLEMENTARES_VADEMECUM" (numero_lei);
CREATE INDEX idx_mps_numero ON public."MEDIDAS_PROVISORIAS_VADEMECUM" (numero_lei);
CREATE INDEX idx_pl_numero ON public."PL_VADEMECUM" (numero_lei);
CREATE INDEX idx_plp_numero ON public."PLP_VADEMECUM" (numero_lei);
CREATE INDEX idx_pec_numero ON public."PEC_VADEMECUM" (numero_lei);
CREATE INDEX idx_push_inscritos_email ON public.push_legislacao_inscritos (email);
CREATE INDEX idx_push_inscritos_ativo ON public.push_legislacao_inscritos (ativo, confirmado);