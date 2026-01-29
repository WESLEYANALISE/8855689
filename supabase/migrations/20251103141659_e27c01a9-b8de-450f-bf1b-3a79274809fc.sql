-- Criar tabela para Simulados TJSP
CREATE TABLE "SIMULADO-TJSP" (
  id BIGSERIAL PRIMARY KEY,
  numero_questao INTEGER NOT NULL,
  enunciado TEXT NOT NULL,
  alternativa_a TEXT NOT NULL,
  alternativa_b TEXT NOT NULL,
  alternativa_c TEXT NOT NULL,
  alternativa_d TEXT NOT NULL,
  alternativa_e TEXT NOT NULL,
  resposta TEXT NOT NULL,
  comentario TEXT,
  area TEXT NOT NULL,
  ano INTEGER NOT NULL,
  prova TEXT NOT NULL,
  questao_narrada TEXT,
  alternativas_narradas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE "SIMULADO-TJSP" ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Simulados TJSP são públicos" 
ON "SIMULADO-TJSP" 
FOR SELECT 
USING (true);

-- Política para sistema atualizar
CREATE POLICY "Sistema pode atualizar TJSP" 
ON "SIMULADO-TJSP" 
FOR UPDATE 
USING (true);

-- Política para sistema inserir
CREATE POLICY "Sistema pode inserir TJSP" 
ON "SIMULADO-TJSP" 
FOR INSERT 
WITH CHECK (true);

-- Criar índices para melhor performance
CREATE INDEX idx_simulado_tjsp_area ON "SIMULADO-TJSP"(area);
CREATE INDEX idx_simulado_tjsp_ano ON "SIMULADO-TJSP"(ano);
CREATE INDEX idx_simulado_tjsp_prova ON "SIMULADO-TJSP"(prova);