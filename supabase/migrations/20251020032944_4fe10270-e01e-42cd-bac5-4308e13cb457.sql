-- Adicionar novas colunas em SIMULACAO_CASOS para suportar sistema dinâmico

ALTER TABLE "SIMULACAO_CASOS" 
ADD COLUMN IF NOT EXISTS genero_jogador text,
ADD COLUMN IF NOT EXISTS provas_visuais jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS template_respostas_juiza jsonb DEFAULT '{
  "forte": ["Excelente argumentação, Doutor(a).", "Muito bem fundamentado.", "Ponto bem colocado."],
  "media": ["Entendo. Prossiga.", "Registrado.", "Continue."],
  "fraca": ["Preciso de mais fundamentação.", "Esse ponto é frágil.", "Não vejo força nesse argumento."]
}'::jsonb,
ADD COLUMN IF NOT EXISTS template_respostas_adversario jsonb DEFAULT '{
  "contestacao": ["Com todo respeito, Excelência, esse argumento...", "Excelência, permita-me refutar...", "Discordo respeitosamente..."],
  "concordancia_parcial": ["Reconheço esse ponto, mas...", "É verdade, porém..."],
  "agressivo": ["Isso é um equívoco evidente!", "Não há base legal para isso!", "Totalmente improcedente!"]
}'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN "SIMULACAO_CASOS".genero_jogador IS 'Gênero do jogador para tratamento correto (masculino/feminino)';
COMMENT ON COLUMN "SIMULACAO_CASOS".provas_visuais IS 'Array de provas com imagens geradas pela IA';
COMMENT ON COLUMN "SIMULACAO_CASOS".template_respostas_juiza IS 'Variações de respostas da juíza baseadas na força do argumento';
COMMENT ON COLUMN "SIMULACAO_CASOS".template_respostas_adversario IS 'Variações de respostas do advogado adversário';