-- Atualizar regras para subtítulos em CAIXA ALTA e proibir citação de artigos não presentes no fonte
INSERT INTO oab_geracao_regras (categoria, regra, prioridade) VALUES
('formatacao_titulos', 'SUBTITULOS PRINCIPAIS EM CAIXA ALTA: Quando usar ## para subtitulos principais de conceitos (ex: Poder Constituinte Originario), escreva em CAIXA ALTA: ## PODER CONSTITUINTE ORIGINÁRIO. Isso diferencia visualmente dos sub-subtitulos menores (###).', 20),

('fidelidade_absoluta', 'CITACOES DE ARTIGOS PROIBIDAS SEM FONTE: NUNCA cite artigos de lei (Art. 1, Art. 5, etc.) a menos que eles estejam EXPLICITAMENTE escritos no texto fonte do PDF. Se o texto fonte NAO menciona nenhum artigo, voce NAO PODE inventar ou adicionar citacoes de artigos. Isso e uma violacao grave de fidelidade.', 21),

('fidelidade_absoluta', 'VERIFICACAO ANTES DE CITAR: Antes de escrever qualquer citacao legal (Art. X, paragrafo Y), verifique: essa citacao existe no texto fonte? Se a resposta for NAO, REMOVA a citacao. E melhor explicar o conceito sem citacao do que inventar uma referencia legal.', 22);

-- Atualizar template de conteudo principal para reforcar essas regras
UPDATE oab_geracao_templates 
SET instrucoes = 'Este e o coracao do material. MINIMO 4000 palavras.

REGRA ABSOLUTA: 100% do conteudo do PDF deve estar aqui. Nada pode ser omitido.

FORMATACAO DE TITULOS:
- Use ## em CAIXA ALTA para conceitos principais: ## PODER CONSTITUINTE ORIGINÁRIO
- Use ### em caixa normal para subdivisoes: ### Características

FORMATACAO RICA OBRIGATORIA:
- Use **negrito** para termos essenciais
- Adicione callouts ao longo do texto:
  > 📌 **Ponto-Chave:** [para informacoes cruciais]
  > ⚠️ **Atencao:** [para pegadinhas e erros comuns]
  > 💡 **Dica:** [para insights de memorizacao]
  > 📊 **Dado:** [para numeros, prazos, estatisticas]

REGRA CRITICA DE CITACOES:
- So cite artigos de lei (Art. X) se eles estiverem ESCRITOS no texto fonte
- Se o PDF NAO menciona artigos, NAO invente citacoes
- E proibido adicionar referencias legais que nao existem no material original

Termos juridicos devem ser explicados inline: O habeas corpus *(instrumento para proteger a liberdade de locomocao)* permite que...

PROIBIDO: numeracao decimal (1.1, 1.2, 2.1.1) - use apenas Markdown.
PROIBIDO: adicionar conceitos, artigos ou leis que NAO estao no PDF fonte.'
WHERE tipo = 'conteudo_principal';

-- Atualizar template de introducao tambem
UPDATE oab_geracao_templates 
SET instrucoes = 'Conversa franca e acolhedora com o estudante.

FORMATO:
- Comece diretamente com "Ola, futuro(a) advogado(a)!" ou similar
- Explique o que sera estudado de forma envolvente
- Use linguagem acessivel e motivadora
- Se houver subdivisoes no tema, apresente-as como um "mapa" do que vira

FORMATACAO DE TITULOS:
- Se mencionar conceitos principais, use CAIXA ALTA: PODER CONSTITUINTE ORIGINÁRIO

REGRA CRITICA:
- NAO cite artigos de lei a menos que estejam EXPLICITAMENTE no texto fonte
- Se o PDF nao menciona artigos, a introducao tambem nao deve mencionar
- Foque em contextualizar o tema, nao em criar referencias legais

Maximo 400 palavras. Tom: professor amigo.'
WHERE tipo = 'introducao';