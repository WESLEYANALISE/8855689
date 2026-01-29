-- Atualizar ordem dos templates existentes para abrir espaço para "Desmembrando" na posição 3
UPDATE oab_geracao_templates SET ordem = ordem + 1 WHERE ordem >= 3;

-- Inserir o novo template "Desmembrando" na posição 3
INSERT INTO oab_geracao_templates (titulo, tipo, ordem, instrucoes, palavras_minimas, ativo)
VALUES (
  'Desmembrando',
  'desmembrando',
  3,
  'Explique detalhadamente CADA termo, conceito ou expressão jurídica presente no texto original.
Organize em subtítulos (##) para cada termo.
Mantenha 100% de fidelidade ao conteúdo original - NÃO invente informações.
Esta página deve ser longa e completa, cobrindo TODOS os termos técnicos.
NÃO use numeração decimal (1.1, 1.2).',
  400,
  true
);