-- Criar tabela LEITURA_FORMATADA para armazenar formatação organizada
CREATE TABLE "LEITURA_FORMATADA" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação do livro
  biblioteca_classicos_id BIGINT NOT NULL,
  livro_titulo TEXT NOT NULL,
  autor TEXT,
  capa_url TEXT,
  
  -- Páginas formatadas (array de objetos JSON)
  paginas JSONB NOT NULL DEFAULT '[]',
  
  -- Estrutura do livro (partes, livros, capítulos)
  estrutura JSONB NOT NULL DEFAULT '{}',
  
  -- Metadados
  total_paginas INTEGER NOT NULL DEFAULT 0,
  total_caracteres_original INTEGER,
  
  -- Status de formatação
  status TEXT NOT NULL DEFAULT 'pendente',
  progresso INTEGER DEFAULT 0,
  formatacao_iniciada_em TIMESTAMPTZ,
  formatacao_concluida_em TIMESTAMPTZ,
  erro_mensagem TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para leitura pública
ALTER TABLE "LEITURA_FORMATADA" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública formatada" 
ON "LEITURA_FORMATADA" FOR SELECT USING (true);

CREATE POLICY "Sistema pode inserir formatacao" 
ON "LEITURA_FORMATADA" FOR INSERT WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar formatacao" 
ON "LEITURA_FORMATADA" FOR UPDATE USING (true);

CREATE POLICY "Sistema pode deletar formatacao" 
ON "LEITURA_FORMATADA" FOR DELETE USING (true);

-- Índice único para busca rápida por livro
CREATE UNIQUE INDEX idx_leitura_formatada_livro ON "LEITURA_FORMATADA"(biblioteca_classicos_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_leitura_formatada_updated_at
BEFORE UPDATE ON "LEITURA_FORMATADA"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Corrigir nomes dos livros na AULAS INTERATIVAS
UPDATE "AULAS INTERATIVAS" 
SET "Livro" = 'O Contrato Social' 
WHERE "Livro" LIKE '%O contrato social%';

UPDATE "AULAS INTERATIVAS" 
SET "Livro" = 'Acesso à Justiça' 
WHERE "Livro" LIKE '%Acesso-à-Justiça%';

UPDATE "AULAS INTERATIVAS" 
SET "Livro" = 'Dos Delitos e das Penas' 
WHERE "Livro" LIKE '%Dos-delitos-e-das-penas%';

UPDATE "AULAS INTERATIVAS" 
SET "Livro" = 'Teoria Pura do Direito' 
WHERE "Livro" LIKE '%Teoria Pura do Direito%';