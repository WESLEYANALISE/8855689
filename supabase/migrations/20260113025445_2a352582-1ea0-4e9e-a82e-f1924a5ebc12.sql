-- Criar tabela para o blog de carreira do advogado iniciante
CREATE TABLE public.oab_carreira_blog (
  id SERIAL PRIMARY KEY,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao_curta TEXT,
  pdf_url TEXT,
  texto_ocr TEXT,
  conteudo_gerado TEXT,
  url_capa TEXT,
  url_audio TEXT,
  topicos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gerado_em TIMESTAMP WITH TIME ZONE,
  cache_validade TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.oab_carreira_blog ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Leitura pública dos artigos de carreira OAB"
ON public.oab_carreira_blog
FOR SELECT
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_oab_carreira_blog_updated_at
BEFORE UPDATE ON public.oab_carreira_blog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir os 11 PDFs identificados na pasta do Google Drive
INSERT INTO public.oab_carreira_blog (ordem, titulo, pdf_url) VALUES
(1, 'Noções Introdutórias e Gestão de Escritório', 'https://drive.google.com/file/d/1IrED9BkbpPy5Prg5257BGolEMMeda_de/01'),
(2, 'Decisões Iniciais, Networking e Publicidade', 'https://drive.google.com/file/d/1IrED9BkbpPy5Prg5257BGolEMMeda_de/02'),
(3, 'Noções de Compliance', 'https://drive.google.com/file/d/1IrED9BkbpPy5Prg5257BGolEMMeda_de/04'),
(4, 'Noções de Atuação em Direito Penal', 'https://drive.google.com/file/d/1IrED9BkbpPy5Prg5257BGolEMMeda_de/07'),
(5, 'Noções de Atuação em Direito Empresarial', 'https://drive.google.com/file/d/1IrED9BkbpPy5Prg5257BGolEMMeda_de/09'),
(6, 'Noções de Atuação em Direito Administrativo', 'https://drive.google.com/file/d/1IrED9BkbpPy5Prg5257BGolEMMeda_de/10'),
(7, 'Noções de Atuação em Direito Tributário', 'https://drive.google.com/file/d/1IrED9BkbpPy5Prg5257BGolEMMeda_de/11'),
(8, 'Noções de Atuação em Família e Sucessões', 'https://drive.google.com/file/d/1IrED9BkbpPy5Prg5257BGolEMMeda_de/12'),
(9, 'Modelo de Contrato de Honorários', 'https://drive.google.com/file/d/1IrED9BkbpPy5Prg5257BGolEMMeda_de/contrato'),
(10, 'Modelo de Folha de Entrevista', 'https://drive.google.com/file/d/1IrED9BkbpPy5Prg5257BGolEMMeda_de/entrevista'),
(11, 'Modelo de Procuração', 'https://drive.google.com/file/d/1IrED9BkbpPy5Prg5257BGolEMMeda_de/procuracao');