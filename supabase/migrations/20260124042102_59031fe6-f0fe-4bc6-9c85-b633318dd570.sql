-- Criar tabela para armazenar conteúdo extraído do PDF por subtema
CREATE TABLE public.conteudo_oab_revisao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tema TEXT NOT NULL,
  subtema TEXT NOT NULL,
  pagina_inicial INTEGER,
  pagina_final INTEGER,
  conteudo_original TEXT NOT NULL,
  area TEXT,
  topico_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tema, subtema)
);

-- Criar índices para busca rápida
CREATE INDEX idx_conteudo_oab_revisao_tema ON public.conteudo_oab_revisao(tema);
CREATE INDEX idx_conteudo_oab_revisao_topico ON public.conteudo_oab_revisao(topico_id);

-- Habilitar RLS
ALTER TABLE public.conteudo_oab_revisao ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (conteúdo educacional)
CREATE POLICY "Conteúdo OAB revisão é público para leitura"
ON public.conteudo_oab_revisao
FOR SELECT
USING (true);

-- Política de escrita apenas via service role (edge functions)
CREATE POLICY "Apenas service role pode inserir/atualizar"
ON public.conteudo_oab_revisao
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_conteudo_oab_revisao_updated_at
BEFORE UPDATE ON public.conteudo_oab_revisao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();