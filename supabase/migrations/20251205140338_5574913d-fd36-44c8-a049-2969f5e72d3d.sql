-- Adicionar colunas para comentário e exemplo na tabela SIMULADO-OAB
ALTER TABLE "SIMULADO-OAB" ADD COLUMN IF NOT EXISTS "comentario" text;
ALTER TABLE "SIMULADO-OAB" ADD COLUMN IF NOT EXISTS "exemplo_pratico" text;
ALTER TABLE "SIMULADO-OAB" ADD COLUMN IF NOT EXISTS "url_audio_comentario" text;
ALTER TABLE "SIMULADO-OAB" ADD COLUMN IF NOT EXISTS "url_audio_exemplo" text;
ALTER TABLE "SIMULADO-OAB" ADD COLUMN IF NOT EXISTS "url_imagem_exemplo" text;