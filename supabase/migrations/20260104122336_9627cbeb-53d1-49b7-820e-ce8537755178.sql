-- Tabela de membros das instituições (ministros, deputados, senadores, etc.)
CREATE TABLE aprofundamento_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao TEXT NOT NULL, -- 'stf', 'stj', 'camara', 'senado', 'presidencia'
  nome TEXT NOT NULL,
  nome_completo TEXT,
  cargo TEXT,
  foto_url TEXT,
  foto_wikipedia TEXT,
  biografia TEXT,
  biografia_detalhada TEXT,
  data_posse DATE,
  indicado_por TEXT,
  formacao TEXT,
  obras_publicadas JSONB, -- Array de {titulo, ano, editora, isbn}
  links_externos JSONB, -- {wikipedia, lattes, curriculo_oficial}
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de notícias por instituição
CREATE TABLE aprofundamento_noticias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  conteudo_formatado TEXT,
  url TEXT,
  fonte TEXT, -- 'jota', 'conjur', 'migalhas', 'stf_oficial'
  imagem_url TEXT,
  imagem_webp TEXT,
  data_publicacao TIMESTAMPTZ,
  processado BOOLEAN DEFAULT false,
  analise_ia TEXT,
  termos JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de obras/livros publicados
CREATE TABLE aprofundamento_obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id UUID REFERENCES aprofundamento_membros(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  ano INTEGER,
  editora TEXT,
  isbn TEXT,
  descricao TEXT,
  capa_url TEXT,
  link_compra TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de artigos do blog de aprofundamento
CREATE TABLE aprofundamento_blog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao TEXT NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  resumo TEXT,
  wikipedia_url TEXT,
  categoria TEXT, -- 'historia', 'funcionamento', 'analise', 'personalidade'
  imagem_url TEXT,
  publicado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_aprofundamento_membros_instituicao ON aprofundamento_membros(instituicao);
CREATE INDEX idx_aprofundamento_noticias_instituicao ON aprofundamento_noticias(instituicao);
CREATE INDEX idx_aprofundamento_noticias_data ON aprofundamento_noticias(data_publicacao DESC);
CREATE INDEX idx_aprofundamento_blog_instituicao ON aprofundamento_blog(instituicao);

-- RLS Policies (leitura pública)
ALTER TABLE aprofundamento_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprofundamento_noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprofundamento_obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprofundamento_blog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros são públicos" ON aprofundamento_membros FOR SELECT USING (true);
CREATE POLICY "Notícias são públicas" ON aprofundamento_noticias FOR SELECT USING (true);
CREATE POLICY "Obras são públicas" ON aprofundamento_obras FOR SELECT USING (true);
CREATE POLICY "Blog é público" ON aprofundamento_blog FOR SELECT USING (true);