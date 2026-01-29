-- Adicionar coluna de dificuldade na tabela de questões de artigos de lei
ALTER TABLE "QUESTOES_ARTIGOS_LEI" ADD COLUMN IF NOT EXISTS dificuldade TEXT DEFAULT 'media';