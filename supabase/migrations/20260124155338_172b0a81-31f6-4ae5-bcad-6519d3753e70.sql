-- Atualizar template de correspondências para instruções claras e evitar duplicação
UPDATE oab_geracao_templates
SET instrucoes = 'Crie EXATAMENTE UMA página de correspondências para o exercício "Ligar Termos".

O campo "markdown" deve conter APENAS uma introdução CURTA (máximo 2 frases):
"Hora de testar o que você aprendeu! Conecte cada termo à sua definição correta."

NÃO liste os termos e definições no markdown - eles vão EXCLUSIVAMENTE no campo "dados_interativos".

O campo "dados_interativos" DEVE conter um JSON válido no formato:
{
  "pares": [
    { "termo": "Termo 1", "definicao": "Definição 1" },
    { "termo": "Termo 2", "definicao": "Definição 2" }
  ],
  "dica_estudo": "Uma dica de memorização"
}

REGRAS OBRIGATÓRIAS:
- Mínimo 8 pares termo/definição
- Use apenas termos que aparecem no PDF/conteúdo fonte
- Definições claras e concisas (máximo 2 frases cada)
- NÃO duplique esta página
- NÃO crie exercício de "ligar termos" no markdown
- O markdown é APENAS para introdução, os dados do jogo vão em dados_interativos',
titulo = 'Ligar Termos'
WHERE tipo = 'correspondencias';

-- Garantir ordem correta: ligar_termos (ordem 7) antes de sintese_final (ordem 8)
UPDATE oab_geracao_templates SET ordem = 7 WHERE tipo = 'correspondencias';
UPDATE oab_geracao_templates SET ordem = 8 WHERE tipo = 'sintese_final';

-- Limpar conteúdo gerado do tópico 6771 para regeneração
UPDATE "RESUMO" SET conteudo_gerado = NULL WHERE id = 6771;