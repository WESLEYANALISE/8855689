-- Tabela de templates de geração (estrutura das 6 páginas)
CREATE TABLE oab_geracao_templates (
  id SERIAL PRIMARY KEY,
  ordem INT NOT NULL,
  tipo TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  instrucoes TEXT NOT NULL,
  palavras_minimas INT DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de regras globais de geração
CREATE TABLE oab_geracao_regras (
  id SERIAL PRIMARY KEY,
  categoria TEXT NOT NULL,
  regra TEXT NOT NULL,
  prioridade INT DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir os 6 templates padrão
INSERT INTO oab_geracao_templates (ordem, tipo, titulo, instrucoes, palavras_minimas) VALUES
(1, 'introducao', 'Introdução', 
'Escreva 1-2 parágrafos (máximo 300 palavras) situando o estudante sobre o tema. 
Use linguagem 100% acessível, sem juridiquês. 
Explique por que esse tema é importante para a OAB.
NÃO use numeração decimal (1.1, 1.2).', 150),

(2, 'conteudo_principal', 'Conteúdo Completo',
'Este é o coração do material. MÍNIMO 4000 palavras.
REGRA ABSOLUTA: 100% do conteúdo do PDF deve estar aqui. Nada pode ser omitido.
Termos jurídicos devem ser explicados inline no formato: "O habeas corpus *(instrumento para proteger a liberdade de locomoção)* permite que..."
Use ## para títulos principais e ### para subtítulos.
PROIBIDO: numeração decimal (1.1, 1.2, 2.1.1) - use apenas Markdown.
PROIBIDO: adicionar conceitos que NÃO estão no PDF fonte.
Citações de artigos: use blockquote > Art. X...', 4000),

(3, 'entendendo_na_pratica', 'Entendendo na Prática',
'Crie 2-3 analogias do cotidiano que ilustrem os conceitos DO PDF.
Estrutura para cada analogia:
## [Título da Analogia]
**Situação do dia a dia:** [descrição]
**Aplicação no Direito:** [como se relaciona]
**Por que importa na OAB:** [relevância para prova]
PROIBIDO: criar exemplos sobre temas não presentes no PDF.', 400),

(4, 'quadro_comparativo', 'Quadro Comparativo',
'Crie tabelas Markdown comparando conceitos presentes no PDF.
Use o formato:
| Conceito A | Conceito B |
|------------|------------|
| diferença 1 | diferença 1 |

Se não houver pares naturais para comparar, faça uma tabela resumo dos pontos principais.
PROIBIDO: comparar com institutos não mencionados no PDF.', 200),

(5, 'dicas_provas', 'Dicas de Provas',
'Foque em como os temas DO PDF são cobrados na OAB/FGV.
Estrutura:
## Padrões de Questões
- Como a banca costuma perguntar sobre [tema do PDF]

## Pegadinhas Comuns
- Armadilhas frequentes relacionadas ao conteúdo

## O que Memorizar
- Pontos-chave para decorar

PROIBIDO: inventar pegadinhas sobre temas não presentes no PDF.', 300),

(6, 'sintese_final', 'Síntese Final',
'Duas partes obrigatórias:

## Resumo Narrativo
2-3 parágrafos sintetizando TODO o conteúdo estudado.

## Checklist de Revisão
Use o símbolo ◆ para cada item:
◆ Ponto essencial 1
◆ Ponto essencial 2
(mínimo 8 itens, máximo 15)

PROIBIDO: incluir itens sobre temas não presentes no PDF.', 400);

-- Inserir regras globais
INSERT INTO oab_geracao_regras (categoria, regra, prioridade) VALUES
('fidelidade', 'FIDELIDADE 100% AO PDF: Todo conteúdo gerado deve vir EXCLUSIVAMENTE do material fonte. Se o PDF fala apenas de habeas corpus, escreva APENAS sobre habeas corpus.', 1),
('fidelidade', 'PROIBIDO INVENTAR: Nunca adicione conceitos, artigos de lei, jurisprudências ou exemplos que não estejam explicitamente no PDF fonte.', 2),
('fidelidade', 'VERIFICAÇÃO: Antes de incluir qualquer informação, pergunte-se: "Isso está no PDF?" Se não estiver, NÃO inclua.', 3),
('proibicoes', 'PROIBIDO: Numeração decimal em qualquer lugar (1.1, 1.2, 2.1.1, etc). Use apenas ## e ### do Markdown.', 10),
('proibicoes', 'PROIBIDO: Criar subdivisões artificiais como "Tópico 1", "Parte 2". O conteúdo deve fluir naturalmente.', 11),
('proibicoes', 'PROIBIDO: Adicionar seções como "Jurisprudência Relacionada" ou "Doutrina" se não estiverem no PDF.', 12),
('formatacao', 'JSON: Escape aspas duplas como \" e quebras de linha como \n dentro de strings.', 20),
('formatacao', 'MARKDOWN: Use ## para títulos, ### para subtítulos, - para listas, | para tabelas, ** para negrito, * para itálico.', 21),
('formatacao', 'CITAÇÕES LEGAIS: Use blockquote para artigos: > Art. 5º, CF/88 - "texto do artigo..."', 22),
('formatacao', 'TERMOS TÉCNICOS: Explique inline usando parênteses itálicos: "mandado de segurança *(ação para proteger direito líquido e certo)*"', 23),
('estrutura', 'PÁGINAS: O conteúdo DEVE ser dividido em exatamente 6 páginas, cada uma com seu propósito específico.', 30),
('estrutura', 'ARRAY paginas: Retorne um array JSON com 6 objetos, cada um com "titulo" e "conteudo".', 31);

-- Índices para performance
CREATE INDEX idx_templates_ordem ON oab_geracao_templates(ordem) WHERE ativo = true;
CREATE INDEX idx_regras_prioridade ON oab_geracao_regras(prioridade) WHERE ativo = true;
CREATE INDEX idx_regras_categoria ON oab_geracao_regras(categoria) WHERE ativo = true;