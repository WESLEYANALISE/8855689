-- Criar tabela de configurações de modelos de IA
CREATE TABLE public."CONFIGURACOES_IA" (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('audio', 'imagem', 'texto')),
  nome_servico TEXT NOT NULL,
  modelo TEXT NOT NULL,
  chave_api_nome TEXT NOT NULL,
  uso_descricao TEXT NOT NULL,
  voz_genero TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public."CONFIGURACOES_IA" ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Configurações são públicas para leitura"
ON public."CONFIGURACOES_IA"
FOR SELECT
USING (true);

-- Inserir configurações de áudio
INSERT INTO public."CONFIGURACOES_IA" (tipo, nome_servico, modelo, chave_api_nome, uso_descricao, voz_genero) VALUES
('audio', 'Google Cloud TTS', 'pt-BR-Chirp3-HD-Aoede', 'GER', 'Perguntas de flashcard, comentários de questões, exemplos práticos, feedback de acerto/erro', 'FEMALE'),
('audio', 'Google Cloud TTS', 'pt-BR-Chirp3-HD-Charon', 'GER', 'Respostas de flashcard (voz diferente para distinguir)', 'FEMALE'),
('audio', 'Google Cloud TTS', 'pt-BR-Standard-A', 'GER', 'Narrações de resumos de artigos de lei (voz padrão)', 'FEMALE'),
('audio', 'Google Cloud TTS', 'pt-BR-Standard-A', 'GOOGLE_TTS_API_KEY', 'Áudios de aulas de artigos (slides)', 'FEMALE');

-- Inserir configurações de imagem
INSERT INTO public."CONFIGURACOES_IA" (tipo, nome_servico, modelo, chave_api_nome, uso_descricao, voz_genero) VALUES
('imagem', 'Google Gemini', 'gemini-2.0-flash-exp-image-generation', 'DIREITO_PREMIUM_API_KEY', 'Capas de resumos personalizados, mapas mentais, capas de capítulos de livros', NULL),
('imagem', 'Google Gemini', 'gemini-2.0-flash-exp-image-generation', 'RESERVA_API_KEY', 'Fallback quando cota da chave primária é excedida (429)', NULL),
('imagem', 'TinyPNG', 'tinify', 'TINYPNG_API_KEY', 'Compressão de imagens geradas', NULL);

-- Inserir configurações de texto (IA generativa)
INSERT INTO public."CONFIGURACOES_IA" (tipo, nome_servico, modelo, chave_api_nome, uso_descricao, voz_genero) VALUES
('texto', 'Google Gemini', 'gemini-2.5-flash', 'DIREITO_PREMIUM_API_KEY', 'Geração de resumos, explicações, questões, flashcards, conteúdo de blog jurídico', NULL),
('texto', 'Google Gemini', 'gemini-2.5-flash', 'RESERVA_API_KEY', 'Fallback para geração de texto quando cota é excedida', NULL),
('texto', 'Google Gemini', 'gemini-2.5-flash', 'RESERVA2_API_KEY', 'Segundo fallback para geração de texto', NULL),
('texto', 'Lovable AI Gateway', 'google/gemini-2.5-flash', 'LOVABLE_API_KEY', 'Assistente jurídico (chat)', NULL);