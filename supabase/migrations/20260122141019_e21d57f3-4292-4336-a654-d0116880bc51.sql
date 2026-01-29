-- Tabela para persistir progresso de leitura dos tópicos de conceitos
CREATE TABLE public.conceitos_topicos_progresso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topico_id INTEGER NOT NULL REFERENCES conceitos_topicos(id) ON DELETE CASCADE,
  progresso_porcentagem INTEGER DEFAULT 0 CHECK (progresso_porcentagem >= 0 AND progresso_porcentagem <= 100),
  leitura_completa BOOLEAN DEFAULT FALSE,
  flashcards_completos BOOLEAN DEFAULT FALSE,
  pratica_completa BOOLEAN DEFAULT FALSE,
  ultimo_topico_lido INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topico_id)
);

-- Habilitar RLS
ALTER TABLE public.conceitos_topicos_progresso ENABLE ROW LEVEL SECURITY;

-- Política: usuário só vê seu próprio progresso
CREATE POLICY "Usuários podem ver seu próprio progresso"
ON public.conceitos_topicos_progresso
FOR SELECT
USING (auth.uid() = user_id);

-- Política: usuário só pode inserir seu próprio progresso
CREATE POLICY "Usuários podem inserir seu próprio progresso"
ON public.conceitos_topicos_progresso
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: usuário só pode atualizar seu próprio progresso
CREATE POLICY "Usuários podem atualizar seu próprio progresso"
ON public.conceitos_topicos_progresso
FOR UPDATE
USING (auth.uid() = user_id);

-- Política: usuário só pode deletar seu próprio progresso
CREATE POLICY "Usuários podem deletar seu próprio progresso"
ON public.conceitos_topicos_progresso
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_conceitos_topicos_progresso_updated_at
BEFORE UPDATE ON public.conceitos_topicos_progresso
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();