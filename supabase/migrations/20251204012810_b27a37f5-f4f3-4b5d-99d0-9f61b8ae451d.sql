-- Adicionar coluna url_pdf na tabela RESUMO para cache de PDFs gerados
ALTER TABLE "RESUMO" ADD COLUMN IF NOT EXISTS url_pdf TEXT;