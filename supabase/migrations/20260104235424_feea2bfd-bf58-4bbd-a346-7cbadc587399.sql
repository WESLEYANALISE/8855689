-- Tabela de templates de petição
CREATE TABLE public.peticao_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  area_direito TEXT NOT NULL,
  tipo_peticao TEXT NOT NULL,
  descricao TEXT,
  estrutura JSONB NOT NULL DEFAULT '{}',
  texto_sugerido TEXT,
  artigos_sugeridos TEXT[],
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de petições geradas/salvas
CREATE TABLE public.peticoes_geradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  area_direito TEXT,
  tipo_peticao TEXT,
  descricao_caso TEXT,
  conteudo_html TEXT,
  conteudo_texto TEXT,
  dados_autor JSONB DEFAULT '{}',
  dados_reu JSONB DEFAULT '{}',
  dados_advogado JSONB DEFAULT '{}',
  jurisprudencias JSONB DEFAULT '[]',
  artigos_citados JSONB DEFAULT '[]',
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'concluida', 'exportada')),
  pdf_url TEXT,
  versao INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.peticao_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peticoes_geradas ENABLE ROW LEVEL SECURITY;

-- Policies para templates (leitura pública, gerenciamento por admins)
CREATE POLICY "Templates de petição são públicos para leitura"
  ON public.peticao_templates FOR SELECT
  USING (ativo = true);

-- Policies para petições geradas (CRUD do próprio usuário)
CREATE POLICY "Usuários podem ver suas próprias petições"
  ON public.peticoes_geradas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas petições"
  ON public.peticoes_geradas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas petições"
  ON public.peticoes_geradas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas petições"
  ON public.peticoes_geradas FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_peticoes_geradas_updated_at
  BEFORE UPDATE ON public.peticoes_geradas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_peticao_templates_updated_at
  BEFORE UPDATE ON public.peticao_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Inserir templates iniciais
INSERT INTO public.peticao_templates (nome, area_direito, tipo_peticao, descricao, estrutura, texto_sugerido, artigos_sugeridos) VALUES
('Petição Inicial Cível Padrão', 'civil', 'Petição Inicial', 'Modelo completo para ações cíveis', 
 '{"secoes": ["ENDEREÇAMENTO", "QUALIFICAÇÃO DAS PARTES", "DOS FATOS", "DO DIREITO", "DOS PEDIDOS", "REQUERIMENTOS FINAIS", "VALOR DA CAUSA"]}',
 'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ___ VARA CÍVEL DA COMARCA DE ___',
 ARRAY['CC art. 186', 'CC art. 927', 'CPC art. 319']),

('Contestação Cível', 'civil', 'Contestação', 'Modelo de contestação para ações cíveis',
 '{"secoes": ["ENDEREÇAMENTO", "PREÂMBULO", "DA TEMPESTIVIDADE", "DAS PRELIMINARES", "DO MÉRITO", "DOS PEDIDOS"]}',
 'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ___ VARA CÍVEL DA COMARCA DE ___',
 ARRAY['CPC art. 336', 'CPC art. 337']),

('Recurso de Apelação', 'civil', 'Apelação', 'Modelo de apelação cível',
 '{"secoes": ["ENDEREÇAMENTO", "DO CABIMENTO E TEMPESTIVIDADE", "DO PREPARO", "DAS RAZÕES DO RECURSO", "DO PEDIDO DE REFORMA"]}',
 'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) DESEMBARGADOR(A) RELATOR(A) DO TRIBUNAL DE JUSTIÇA',
 ARRAY['CPC art. 1009', 'CPC art. 1010']),

('Embargos de Declaração', 'civil', 'Embargos de Declaração', 'Para sanar omissão, contradição ou obscuridade',
 '{"secoes": ["ENDEREÇAMENTO", "DO CABIMENTO E TEMPESTIVIDADE", "DA OMISSÃO/CONTRADIÇÃO/OBSCURIDADE", "DO PEDIDO"]}',
 'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO',
 ARRAY['CPC art. 1022', 'CPC art. 1023']),

('Reclamação Trabalhista', 'trabalhista', 'Petição Inicial', 'Modelo de reclamação trabalhista',
 '{"secoes": ["ENDEREÇAMENTO", "QUALIFICAÇÃO DAS PARTES", "DO CONTRATO DE TRABALHO", "DAS VERBAS RESCISÓRIAS", "DOS PEDIDOS"]}',
 'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DO TRABALHO DA ___ VARA DO TRABALHO DE ___',
 ARRAY['CLT art. 477', 'CLT art. 487', 'CF art. 7º']),

('Mandado de Segurança', 'administrativo', 'Mandado de Segurança', 'Proteção de direito líquido e certo',
 '{"secoes": ["ENDEREÇAMENTO", "QUALIFICAÇÃO DO IMPETRANTE", "DA AUTORIDADE COATORA", "DO ATO COATOR", "DO DIREITO LÍQUIDO E CERTO", "DA LIMINAR", "DOS PEDIDOS"]}',
 'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ___ VARA DA FAZENDA PÚBLICA',
 ARRAY['CF art. 5º LXIX', 'Lei 12016/2009']),

('Ação de Divórcio Consensual', 'familia', 'Petição Inicial', 'Divórcio consensual simplificado',
 '{"secoes": ["ENDEREÇAMENTO", "QUALIFICAÇÃO DAS PARTES", "DO CASAMENTO", "DA PARTILHA DE BENS", "DA GUARDA E ALIMENTOS", "DOS PEDIDOS"]}',
 'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ___ VARA DE FAMÍLIA',
 ARRAY['CC art. 1571', 'CC art. 1579', 'CPC art. 733']),

('Ação de Indenização por Danos Morais', 'consumidor', 'Petição Inicial', 'Ação de danos morais em relação de consumo',
 '{"secoes": ["ENDEREÇAMENTO", "QUALIFICAÇÃO DAS PARTES", "DOS FATOS", "DO DANO MORAL", "DO NEXO CAUSAL", "DO QUANTUM INDENIZATÓRIO", "DOS PEDIDOS"]}',
 'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DO JUIZADO ESPECIAL CÍVEL',
 ARRAY['CDC art. 6º', 'CDC art. 14', 'CC art. 186', 'CC art. 927']);

-- Índices para performance
CREATE INDEX idx_peticoes_geradas_user_id ON public.peticoes_geradas(user_id);
CREATE INDEX idx_peticoes_geradas_status ON public.peticoes_geradas(status);
CREATE INDEX idx_peticao_templates_area ON public.peticao_templates(area_direito);
CREATE INDEX idx_peticao_templates_tipo ON public.peticao_templates(tipo_peticao);