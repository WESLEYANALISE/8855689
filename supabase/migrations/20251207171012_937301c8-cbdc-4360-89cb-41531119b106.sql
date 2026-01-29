-- Atualizar configurações para refletir o sistema de fallback
UPDATE public."CONFIGURACOES_IA"
SET uso_descricao = 'Áudio TTS - Chave primária (fallback para GOOGLE_TTS_API_KEY)'
WHERE chave_api_nome = 'GER';

UPDATE public."CONFIGURACOES_IA"
SET uso_descricao = 'Áudio TTS - Chave secundária (fallback quando GER atinge limite)'
WHERE chave_api_nome = 'GOOGLE_TTS_API_KEY';

UPDATE public."CONFIGURACOES_IA"
SET uso_descricao = 'Imagem Gemini - Chave primária (fallback para RESERVA_API_KEY e RESERVA2_API_KEY)'
WHERE chave_api_nome = 'DIREITO_PREMIUM_API_KEY' AND tipo = 'imagem';

UPDATE public."CONFIGURACOES_IA"
SET uso_descricao = 'Imagem Gemini - Chave secundária (fallback para RESERVA2_API_KEY)'
WHERE chave_api_nome = 'RESERVA_API_KEY' AND tipo = 'imagem';

-- Adicionar RESERVA2_API_KEY para imagem se ainda não existe
INSERT INTO public."CONFIGURACOES_IA" (tipo, nome_servico, modelo, chave_api_nome, uso_descricao, voz_genero)
SELECT 'imagem', 'Google Gemini', 'gemini-2.0-flash-exp-image-generation', 'RESERVA2_API_KEY', 'Imagem Gemini - Terceira chave de fallback', NULL
WHERE NOT EXISTS (SELECT 1 FROM public."CONFIGURACOES_IA" WHERE chave_api_nome = 'RESERVA2_API_KEY' AND tipo = 'imagem');