-- Criar tabela para armazenar questões raspadas do QConcursos
CREATE TABLE public."QUESTOES_RASPADAS" (
  id BIGSERIAL PRIMARY KEY,
  id_origem TEXT NOT NULL UNIQUE, -- ID original do QConcursos (ex: Q3768289)
  disciplina TEXT NOT NULL,
  assunto TEXT,
  ano INTEGER,
  banca TEXT,
  orgao TEXT,
  cargo TEXT,
  prova TEXT,
  enunciado TEXT NOT NULL,
  alternativa_a TEXT,
  alternativa_b TEXT,
  alternativa_c TEXT,
  alternativa_d TEXT,
  alternativa_e TEXT,
  resposta_correta CHAR(1), -- A, B, C, D ou E
  comentario TEXT,
  url_questao TEXT,
  fonte TEXT DEFAULT 'QConcursos',
  nivel_dificuldade TEXT,
  vezes_respondida INTEGER DEFAULT 0,
  acertos INTEGER DEFAULT 0,
  erros INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_questoes_raspadas_disciplina ON public."QUESTOES_RASPADAS" (disciplina);
CREATE INDEX idx_questoes_raspadas_banca ON public."QUESTOES_RASPADAS" (banca);
CREATE INDEX idx_questoes_raspadas_ano ON public."QUESTOES_RASPADAS" (ano);
CREATE INDEX idx_questoes_raspadas_assunto ON public."QUESTOES_RASPADAS" (assunto);
CREATE INDEX idx_questoes_raspadas_id_origem ON public."QUESTOES_RASPADAS" (id_origem);

-- Enable RLS
ALTER TABLE public."QUESTOES_RASPADAS" ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (questões são públicas)
CREATE POLICY "Questões raspadas são públicas para leitura"
ON public."QUESTOES_RASPADAS"
FOR SELECT
USING (true);

-- Política de inserção/atualização apenas via service role (edge functions)
CREATE POLICY "Apenas service role pode inserir/atualizar questões raspadas"
ON public."QUESTOES_RASPADAS"
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Trigger para updated_at
CREATE TRIGGER update_questoes_raspadas_updated_at
BEFORE UPDATE ON public."QUESTOES_RASPADAS"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentário na tabela
COMMENT ON TABLE public."QUESTOES_RASPADAS" IS 'Questões de concurso raspadas do QConcursos via Browserless';