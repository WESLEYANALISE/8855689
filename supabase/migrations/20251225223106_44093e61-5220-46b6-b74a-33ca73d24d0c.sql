-- Adicionar campo para data de modificação do Planalto
ALTER TABLE public.monitoramento_leis 
ADD COLUMN IF NOT EXISTS data_modificacao_planalto DATE,
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'codigo';

-- Atualizar categorias das leis existentes
UPDATE public.monitoramento_leis SET categoria = 'constituicao' WHERE tabela_lei LIKE 'CF -%';
UPDATE public.monitoramento_leis SET categoria = 'codigo' WHERE tabela_lei LIKE 'C% -%' AND tabela_lei NOT LIKE 'CF -%';
UPDATE public.monitoramento_leis SET categoria = 'codigo' WHERE tabela_lei LIKE '%Código%';
UPDATE public.monitoramento_leis SET categoria = 'estatuto' WHERE tabela_lei LIKE 'ESTATUTO%';
UPDATE public.monitoramento_leis SET categoria = 'lei' WHERE tabela_lei LIKE 'Lei %';
UPDATE public.monitoramento_leis SET categoria = 'lei' WHERE tabela_lei LIKE 'CLT%';