
-- Table to cache intro carousel narration audio URLs
CREATE TABLE public.intro_carousel_narrations (
  id SERIAL PRIMARY KEY,
  slide_index INTEGER NOT NULL UNIQUE,
  texto_narracao TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.intro_carousel_narrations ENABLE ROW LEVEL SECURITY;

-- Everyone can read (audio URLs are public content)
CREATE POLICY "Anyone can read intro narrations"
ON public.intro_carousel_narrations
FOR SELECT
USING (true);

-- Only service role can insert/update (edge function)
-- No insert/update policies needed for regular users

-- Pre-populate with narration texts for each slide
INSERT INTO public.intro_carousel_narrations (slide_index, texto_narracao) VALUES
(0, 'Bem-vindo ao Direito Premium! Sua jornada jurídica começa agora. Aqui você encontra a plataforma mais completa para estudantes de Direito, concurseiros, candidatos à OAB e advogados. Tudo que você precisa para se destacar, em um só lugar.'),
(1, 'Conheça nossas ferramentas inteligentes de estudo! Flashcards para memorização eficiente, Mapas Mentais para visualizar conexões entre temas, Resumos gerados por Inteligência Artificial e um Dicionário Jurídico completo. Aprenda de forma moderna e eficiente.'),
(2, 'Prepare-se para a OAB com nossas videoaulas completas! Trilhas organizadas por matéria, questões comentadas por especialistas e áudio-aulas para estudar em qualquer lugar. Tudo pensado para sua aprovação.'),
(3, 'Acesse nossa Biblioteca Jurídica e o Vade Mecum digital mais completo! Legislação sempre atualizada, súmulas dos tribunais superiores e livros clássicos do Direito. Todo o acervo que você precisa, na palma da sua mão.'),
(4, 'Pratique diariamente com nosso banco de questões e simulados! Questões no estilo OAB e concursos públicos, com estatísticas de desempenho para acompanhar sua evolução. A prática leva à aprovação!'),
(5, 'Conheça a Evelyn, sua assistente jurídica com Inteligência Artificial! Disponível vinte e quatro horas no WhatsApp, ela tira suas dúvidas, gera resumos instantâneos e te ajuda nos estudos a qualquer momento. É como ter uma tutora particular sempre ao seu lado.');

-- Create storage bucket for intro carousel audio (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('intro-carousel-audio', 'intro-carousel-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for the audio bucket
CREATE POLICY "Public read access for intro carousel audio"
ON storage.objects
FOR SELECT
USING (bucket_id = 'intro-carousel-audio');

-- Service role can upload
CREATE POLICY "Service role can upload intro carousel audio"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'intro-carousel-audio');

CREATE POLICY "Service role can update intro carousel audio"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'intro-carousel-audio');
