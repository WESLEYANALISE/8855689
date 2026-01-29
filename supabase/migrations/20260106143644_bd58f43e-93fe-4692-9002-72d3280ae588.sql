-- Tabela para artigos do blog do Advogado
CREATE TABLE public.ADVOGADO_BLOG (
  id SERIAL PRIMARY KEY,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao_curta TEXT,
  topicos TEXT[],
  fonte_url TEXT,
  conteudo_gerado TEXT,
  url_capa TEXT,
  gerado_em TIMESTAMP WITH TIME ZONE,
  cache_validade TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para ordenação
CREATE INDEX idx_advogado_blog_ordem ON public.ADVOGADO_BLOG(ordem);

-- Enable RLS
ALTER TABLE public.ADVOGADO_BLOG ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Artigos do blog são públicos para leitura"
ON public.ADVOGADO_BLOG
FOR SELECT
USING (true);

-- Popular com os 18 artigos base do Aurum
INSERT INTO public.ADVOGADO_BLOG (ordem, titulo, descricao_curta, fonte_url) VALUES
(1, 'Advogado de Sucesso: 3 práticas indispensáveis', 'Descubra as práticas essenciais para se tornar um advogado de destaque no mercado jurídico', 'https://www.aurum.com.br/blog/advogado-de-sucesso/'),
(2, '8 dicas de como crescer na advocacia', 'Estratégias comprovadas para expandir seu escritório e conquistar mais clientes', 'https://www.aurum.com.br/blog/como-fazer-o-escritorio-de-advocacia-crescer/'),
(3, 'Gestão de escritório de advocacia', 'Guia completo sobre como administrar um escritório jurídico de forma eficiente', 'https://www.aurum.com.br/blog/gestao-de-escritorio-de-advocacia/'),
(4, 'Produtividade para advogados: 5 dicas', 'Técnicas práticas para aumentar sua produtividade e entregar mais resultados', 'https://www.aurum.com.br/blog/dicas-de-produtividade-para-advogados/'),
(5, 'Gestão jurídica: 6 dicas essenciais', 'Como organizar e otimizar a gestão do seu trabalho jurídico', 'https://www.aurum.com.br/blog/gestao-juridica/'),
(6, 'Planejamento estratégico para escritórios', 'Monte um plano de ação para o crescimento sustentável do seu escritório', 'https://www.aurum.com.br/blog/planejamento-estrategico-para-escritorios-de-advocacia/'),
(7, 'Guia completo para advogados autônomos', 'Tudo que você precisa saber para atuar de forma independente na advocacia', 'https://www.aurum.com.br/blog/advogado-autonomo/'),
(8, 'Advogado home office: como trabalhar de casa', 'Dicas e boas práticas para advocacia remota', 'https://www.aurum.com.br/blog/advogado-home-office/'),
(9, 'Audiência de instrução e julgamento', 'Entenda o procedimento completo e como se preparar adequadamente', 'https://www.aurum.com.br/blog/audiencia-de-instrucao-e-julgamento/'),
(10, 'Modelos de documentos jurídicos', 'Guia sobre os principais modelos e como utilizá-los corretamente', 'https://www.aurum.com.br/blog/modelos-de-documentos-juridicos/'),
(11, 'Como elaborar uma peça processual', 'Técnicas e estrutura para redigir peças processuais eficientes', 'https://www.aurum.com.br/blog/peca-processual/'),
(12, 'Sustentação oral: dicas e modelo', 'Prepare-se para fazer sustentações orais impactantes', 'https://www.aurum.com.br/blog/sustentacao-oral/'),
(13, 'Gestão de processos judiciais', 'Organize e acompanhe seus processos de forma eficiente', 'https://www.aurum.com.br/blog/gestao-de-processos-judiciais/'),
(14, 'Gestão de contratos na advocacia', 'Como gerenciar contratos de forma profissional', 'https://www.aurum.com.br/blog/gestao-de-contratos/'),
(15, 'Argumentação jurídica eficaz', 'Técnicas de argumentação para convencer juízes e tribunais', 'https://www.aurum.com.br/blog/argumentacao-juridica/'),
(16, 'Como fazer uma petição inicial', 'Passo a passo completo para elaborar petições iniciais', 'https://www.aurum.com.br/blog/como-fazer-peticao-inicial/'),
(17, 'Marketing jurídico: como atrair clientes', 'Estratégias éticas de marketing para advogados', 'https://www.aurum.com.br/blog/marketing-juridico/'),
(18, 'Assessoria jurídica empresarial', 'Como atuar como assessor jurídico de empresas', 'https://www.aurum.com.br/blog/assessoria-juridica/');