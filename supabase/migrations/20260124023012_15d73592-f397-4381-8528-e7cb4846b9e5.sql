-- Adicionar novas regras de formatação rica para o conteúdo gerado
INSERT INTO oab_geracao_regras (categoria, regra, prioridade) VALUES
('formatacao_rica', 'CALLOUTS OBRIGATÓRIOS: Use blocos de destaque ao longo do texto:
> 📌 **Ponto-Chave:** [informação crucial para a prova]
> ⚠️ **Atenção:** [pegadinha ou erro comum]
> 💡 **Dica:** [insight prático para memorização]
> 📊 **Dado Importante:** [estatística, prazo ou número relevante]', 11),

('formatacao_rica', 'DESTAQUES NO TEXTO: Use **negrito** para termos essenciais e *itálico* para explicações. Exemplo: O **prazo decadencial** é de *2 anos* para...', 12),

('formatacao_rica', 'LISTAS VISUAIS: Para enumerar elementos importantes, use listas com emojis como check verde para o que PODE/DEVE, X vermelho para o que NAO PODE, balança para conceitos juridicos, calendario para prazos e datas, chave para palavras-chave', 13),

('formatacao_rica', 'BOXES DE RESUMO: Ao final de secoes importantes, adicione separadores horizontais --- seguidos de um resumo em negrito', 14),

('formatacao_rica', 'ESTATISTICAS E NUMEROS: Sempre destaque dados numericos de forma visual usando blockquotes com emojis de grafico', 15),

('formatacao_rica', 'CONEXOES VISUAIS: Use setas e simbolos para mostrar relacoes: A para B (consequencia), A diferente de B (diferenca), A igual B (equivalencia)', 16);

-- Atualizar template do conteudo principal para incluir formatacao rica
UPDATE oab_geracao_templates 
SET instrucoes = 'Este e o coracao do material. MINIMO 4000 palavras.

REGRA ABSOLUTA: 100% do conteudo do PDF deve estar aqui. Nada pode ser omitido.

FORMATACAO RICA OBRIGATORIA:
- Use **negrito** para termos essenciais
- Adicione callouts ao longo do texto:
  > 📌 **Ponto-Chave:** [para informacoes cruciais]
  > ⚠️ **Atencao:** [para pegadinhas e erros comuns]
  > 💡 **Dica:** [para insights de memorizacao]
  > 📊 **Dado:** [para numeros, prazos, estatisticas]

- Destaque numeros e prazos de forma visual
- Use listas com icones para organizar informacoes
- Ao final de secoes importantes, adicione um box de resumo

Termos juridicos devem ser explicados inline: O habeas corpus *(instrumento para proteger a liberdade de locomocao)* permite que...

Use ## para titulos principais e ### para subtitulos.

PROIBIDO: numeracao decimal (1.1, 1.2, 2.1.1) - use apenas Markdown.
PROIBIDO: adicionar conceitos que NAO estao no PDF fonte.

Citacoes de artigos: use blockquote > Art. X...'
WHERE tipo = 'conteudo_principal';

-- Atualizar template de Desmembrando
UPDATE oab_geracao_templates 
SET instrucoes = 'Explique detalhadamente CADA termo, conceito ou expressao juridica presente no texto original.

FORMATACAO:
- Organize em subtitulos (##) para cada termo
- Use > 📌 **Ponto-Chave:** para destacar o essencial de cada termo
- Inclua exemplos praticos quando relevante
- Destaque diferencas importantes com > ⚠️ **Atencao:**

Mantenha 100% de fidelidade ao conteudo original - NAO invente informacoes.
Esta pagina deve ser longa e completa, cobrindo TODOS os termos tecnicos.
NAO use numeracao decimal (1.1, 1.2).'
WHERE tipo = 'desmembrando';

-- Atualizar template de Dicas de Prova
UPDATE oab_geracao_templates 
SET instrucoes = 'Foco em TECNICAS DE MEMORIZACAO para os conceitos do PDF.

## Mnemonicos e Associacoes
- Crie siglas, frases ou associacoes para memorizar conceitos-chave
- Use tecnicas como acronimos, rimas ou historias curtas
- Destaque com > 💡 **Memorize assim:**

## Pontos que Mais Confundem
- Liste os conceitos que estudantes costumam confundir
- Use formato: Erro comum: X | Correto: Y
- Explique a diferenca de forma clara

## O que NAO Esquecer

> 📊 **Dados Essenciais:**
> - [Prazos importantes]
> - [Numeros que caem na prova]
> - [Excecoes as regras]

REGRAS:
- Foco total em AJUDAR A MEMORIZAR
- PROIBIDO inventar conteudo nao presente no PDF.'
WHERE tipo = 'dicas_provas';