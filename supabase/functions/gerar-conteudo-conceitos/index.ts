import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Configuração das páginas a serem geradas (estrutura ALINHADA com OAB Trilhas - TOM CONVERSACIONAL)
const PAGINAS_CONFIG = [
  { 
    tipo: "introducao", 
    titulo: "Introdução", 
    promptExtra: `Esta é a ÚNICA página que deve ter saudação acolhedora.

Comece com algo acolhedor e motivador:
"Vamos falar sobre um tema super importante pra você entender..."
"Esse é um assunto que todo estudante de Direito precisa dominar..."

Escreva 150-250 palavras MÁXIMO contendo:
1. Saudação acolhedora e motivadora (1-2 frases)
2. Contexto: por que isso é relevante para o estudante de Direito (1-2 frases)
3. Lista de 3-5 pontos-chave que serão abordados na trilha:
   - Ponto 1
   - Ponto 2
   - Ponto 3
4. Frase de encerramento: "Ao final dessa trilha, você vai dominar..."

Termine OBRIGATORIAMENTE com:
> 🎯 **VOCÊ SABIA?:** [curiosidade relevante sobre o tema - uma frase]

⛔ NÃO escreva parágrafos longos. Seja ENXUTO mas acolhedor.` 
  },
  { 
    tipo: "conteudo_principal", 
    titulo: "Conteúdo Completo", 
    promptExtra: `Vá DIRETO ao conteúdo (a introdução já fez a saudação).
Escreva com tom CONVERSACIONAL e FLUIDO - como se explicasse para um amigo.

### ⚡ PROFUNDIDADE DE CONTEÚDO OBRIGATÓRIA (CRÍTICO!):

Esta é a página PRINCIPAL - deve ser EXTREMAMENTE COMPLETA e DETALHADA.
Você DEVE escrever **mínimo 5000-7000 palavras** nesta seção.

Para CADA conceito do PDF:
1. **Defina claramente** o que é o conceito (mínimo 3 parágrafos)
2. **Explique POR QUE é importante** no contexto jurídico brasileiro
3. **Dê MÚLTIPLOS EXEMPLOS PRÁTICOS** imediatamente (mínimo 2 exemplos por conceito)
4. **Traduza e explique TODOS os termos em latim** com aplicação prática
5. **Inclua jurisprudência/doutrina** quando citada no PDF
6. **Faça transições naturais** conectando um conceito ao próximo

### REGRAS OBRIGATÓRIAS DE FLUIDEZ E DIDÁTICA:

1. **EXEMPLOS PRÁTICOS EM ABUNDÂNCIA (OBRIGATÓRIO)**
   A cada conceito novo, dê PELO MENOS 2 exemplos práticos:
   "Por exemplo, imagine que Maria compra um celular pela internet..."
   "Outro caso comum: João assina um contrato de aluguel e..."
   "Na prática, funciona assim: quando você vai ao cartório..."
   
   ⚠️ NÃO deixe nenhum conceito sem múltiplos exemplos!

2. **EXPLICAÇÃO DETALHADA DE TERMOS EM LATIM E JURIDIQUÊS (OBRIGATÓRIO)**
   Sempre que usar termo técnico, em latim ou juridiquês, EXPLIQUE imediatamente COM CONTEXTO:
   
   Formato para termos em latim:
   "...a *pacta sunt servanda* (que significa 'os pactos devem ser cumpridos'). Na prática, isso significa que quando você assina um contrato, está juridicamente obrigado a cumprir todas as cláusulas, mesmo que depois se arrependa. Por exemplo, se João assinou contrato de aluguel por 12 meses, não pode simplesmente sair no 3º mês sem pagar a multa."
   
   Formato para juridiquês:
   "...a capacidade civil (aptidão para exercer direitos pessoalmente). Isso é diferente da capacidade de direito! Capacidade de direito TODO MUNDO tem ao nascer com vida. Já a capacidade civil plena só vem aos 18 anos. Por exemplo, um menor de 16 anos PODE ter um imóvel em seu nome (capacidade de direito), mas NÃO PODE vendê-lo sozinho (falta capacidade civil)."

3. **TRANSIÇÕES NATURAIS E ENGAJANTES:**
   "Agora que você entendeu X, vamos ver como funciona Y na prática..."
   "Percebeu a lógica? Esse é o pulo do gato! O próximo passo é entender..."
   "Antes de avançar, deixa eu te dar mais um exemplo importante..."

4. **ANTECIPE DÚVIDAS COMUNS:**
   "Você pode estar pensando: e se...? A resposta é..."
   "Uma confusão muito comum aqui é achar que... mas na verdade..."
   "Cuidado! Muita gente confunde isso com..."

5. **APROFUNDE CADA TEMA:**
   - Não passe superficialmente pelos conceitos
   - Explique as CONSEQUÊNCIAS JURÍDICAS de cada instituto
   - Mostre a EVOLUÇÃO HISTÓRICA quando relevante
   - Compare com situações semelhantes para diferenciar

### TÍTULOS E SUBTÍTULOS OBRIGATÓRIOS:
Use os MESMOS títulos e subtítulos que aparecem no PDF.
Se o PDF tiver "1. Escola Clássica", use "## 1. Escola Clássica".
Mantenha a ESTRUTURA ORIGINAL do material do PDF.

### CITAÇÕES OBRIGATÓRIAS:
Sempre que o PDF contiver citações de doutrinadores, jurisprudência ou enunciados, INCLUA-AS:

> "A tutela da dignidade da pessoa humana na sociedade da informação inclui o direito ao esquecimento" (Enunciado n. 531 da VI Jornada de Direito Civil)

> "O STJ entendeu que..." (STJ, REsp 613.374/MG)

### TABELAS COMPARATIVAS:
Quando houver institutos para comparar, use tabelas Markdown.

### ELEMENTOS VISUAIS (use > no início) - USE ABUNDANTEMENTE:
> ⚠️ **ATENÇÃO:** [ponto importante - cai muito em prova!]
> 💡 **DICA:** [dica prática de memorização]
> 📌 **EM RESUMO:** [síntese do que foi explicado]
> 💼 **CASO PRÁTICO:** [exemplo prático detalhado]
> 📚 **EXEMPLO RÁPIDO:** [exemplo curto inline]
> 🎯 **VOCÊ SABIA?:** [curiosidade relevante]

**MÍNIMO 5000-7000 palavras.** Use pelo menos 15-20 elementos visuais.
CADA conceito deve ter: explicação completa + múltiplos exemplos + explicação de termos técnicos + consequências jurídicas.` 
  },
  { 
    tipo: "desmembrando", 
    titulo: "Desmembrando o Tema", 
    promptExtra: `Vá DIRETO ao conteúdo (sem saudações - a introdução já fez isso).

Pegue os conceitos-chave do PDF e DESTRINCHE cada um com tom de conversa.
Escreva 1200-1800 palavras no total.

Para CADA conceito principal (identifique 5-7 do PDF):

### [Nome do Conceito]

"Olha, isso parece complicado, mas vou te mostrar passo a passo..."

Explique o conceito de forma FLUIDA, como se estivesse conversando com um amigo.
NÃO use listas rígidas - escreva em parágrafos naturais e envolventes.
Cite exemplos práticos DURANTE a explicação.

INCLUA citações do PDF quando relevantes:
> "Citação do doutrinador ou jurisprudência" (AUTOR, ano)

Use perguntas retóricas para engajar:
"E por que isso é tão importante? Porque..."
"Percebeu a diferença? Esse é o pulo do gato!"

Faça analogias com o dia a dia:
"Pense como se fosse..."
"É como quando você..."

Ao final de cada conceito, faça um resumo rápido:
"Então, resumindo: [conceito] significa [explicação breve]."

### [Próximo Conceito]
...

⛔ NÃO use estrutura rígida de bullets (Premissas, Aplicação, Consequências).
✅ USE parágrafos fluidos e conversacionais com exemplos inline.
✅ INCLUA todas as citações de doutrinadores e jurisprudências do PDF.` 
  },
  { 
    tipo: "entendendo_na_pratica", 
    titulo: "Entendendo na Prática", 
    promptExtra: `Vá DIRETO aos casos práticos (sem saudações).

Crie casos práticos usando ESPECIFICAMENTE o tema estudado no PDF.
NÃO invente situações genéricas - use os conceitos que estão no material.

Escreva 800-1200 palavras com 4-5 casos práticos.

Estrutura para cada caso:

### Caso 1: [Título relacionado ao tema do PDF]

"Imagina a seguinte situação..."

> 💼 **CASO PRÁTICO:** [Situação real baseada ESPECIFICAMENTE no tema do PDF]

**Análise:** Como aplicar o que foi estudado - conecte diretamente com o conteúdo do PDF.
**Conclusão:** O que acontece juridicamente.

### Caso 2: [Título]
...

IMPORTANTE: Os casos devem refletir o DIA A DIA da aplicação do tema.
- Se o tema é "Escolas Penais", crie casos sobre como cada escola interpretaria um crime específico.
- Se o tema é "Personalidade Civil", crie casos sobre início/fim da personalidade.
- Se o tema é "Contratos", crie casos sobre formação, execução e rescisão.

⛔ NÃO crie situações genéricas desconectadas do PDF.
✅ USE os conceitos específicos do material para criar os casos.` 
  },
  { 
    tipo: "quadro_comparativo", 
    titulo: "Quadro Comparativo", 
    promptExtra: `⛔ ATENÇÃO CRÍTICA: Esta página DEVE conter tabelas Markdown.
Se você não gerar tabelas, a página ficará VAZIA e INUTILIZÁVEL.

Comece DIRETAMENTE com a primeira tabela Markdown (sem texto introdutório).

CRIE OBRIGATORIAMENTE pelo menos 3 TABELAS COMPARATIVAS distintas.

MESMO que o tema pareça não ter comparações óbvias, CRIE tabelas:
- Compare conceitos vs exceções
- Compare requisitos de diferentes situações
- Compare efeitos jurídicos de diferentes hipóteses
- Compare posicionamentos doutrinários
- Compare classificações do tema

⛔ NUNCA escreva "Conteúdo não disponível".
⛔ NUNCA deixe esta página sem tabelas.

### TABELA 1: [Título da comparação principal]

| Aspecto | Instituto A | Instituto B |
|---------|-------------|-------------|
| Definição | [texto claro] | [texto claro] |
| Requisitos | [lista objetiva] | [lista objetiva] |
| Efeitos Jurídicos | [consequências] | [consequências] |
| Previsão Legal | [artigos] | [artigos] |
| Exemplo Prático | [situação] | [situação] |

### TABELA 2: [Outro comparativo do tema]

| Critério | Conceito X | Conceito Y | Conceito Z |
|----------|------------|------------|------------|
| ... | ... | ... | ... |

### TABELA 3: [Terceiro comparativo]

| Característica | Tipo 1 | Tipo 2 |
|----------------|--------|--------|
| ... | ... | ... |

REGRAS:
- Mínimo 3 tabelas, máximo 5
- Cada tabela com mínimo 4 linhas de dados
- NÃO escreva texto explicativo, APENAS tabelas` 
  },
  { 
    tipo: "dicas_provas", 
    titulo: "Dicas para Memorizar", 
    promptExtra: `Vá DIRETO às dicas (sem saudações).

"Olha esse truque que vai salvar sua vida na prova..."

Forneça dicas de memorização com tom AMIGÁVEL (400-600 palavras):

### Mnemônicos que Funcionam

"Quer uma dica? Pensa assim: [SIGLA] = [Significado]"
"Decora assim que não esquece nunca mais..."

- **[SIGLA]** = [Significado] (Ex: LIMPE = Legalidade, Impessoalidade, Moralidade...)

### Pegadinhas que Sempre Caem

"Cuidado com essa aqui..."

> ⚠️ **PEGADINHA:** [ponto que confunde em provas]
> ⚠️ **PEGADINHA:** [outro ponto]

### Macetes de Prova

"Quando você ver [X] na questão, já sabe que..."

> 💡 **DICA:** [macete específico]
> 💡 **DICA:** [outro macete]

Use linguagem AMIGÁVEL, não acadêmica.
Escreva como se estivesse dando dicas pra um amigo antes da prova.
"Se cair isso, lembra que..."
"A banca adora cobrar..."` 
  },
  { 
    tipo: "correspondencias", 
    titulo: "Ligar Termos", 
    promptExtra: `Vá DIRETO à instrução (sem saudações).

Escreva APENAS uma breve instrução (2-3 frases) para um exercício interativo:

"Conecte cada termo à sua definição correta. Este exercício vai ajudar você a fixar os conceitos principais que estudamos."

NOTA: Os dados do jogo (pares termo/definição) serão gerados separadamente com mínimo 8 pares.` 
  },
  { 
    tipo: "sintese_final", 
    titulo: "Síntese Final", 
    promptExtra: `Vá DIRETO à síntese (sem saudações).

Comece assim: "Recapitulando tudo que vimos..."

Faça um resumo conciso de tudo que foi abordado (400-600 palavras).
Destaque os pontos principais e conecte os conceitos.

Use:
> 📌 **EM RESUMO:** [síntese dos pontos principais]

Inclua um checklist final:
- [ ] Conceito X compreendido
- [ ] Diferença entre A e B clara
- [ ] Requisitos memorizados

Encerre de forma motivadora:
"Agora você já domina os principais pontos sobre [tema]. Continue praticando!"` 
  },
];

// Páginas extras que geram JSON estruturado
const EXTRAS_CONFIG = [
  { tipo: "correspondencias", minimo: 8 },
  { tipo: "exemplos", minimo: 5 },
  { tipo: "termos", minimo: 10 },
  { tipo: "flashcards", minimo: 15 },
  { tipo: "questoes", minimo: 8 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let topicoIdForCatch: number | null = null;
  let supabaseForCatch: any = null;

  try {
    const { topico_id, force_restart } = await req.json();
    topicoIdForCatch = topico_id ?? null;
    
    if (!topico_id) {
      return new Response(
        JSON.stringify({ error: "topico_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    supabaseForCatch = supabase;

    // ============================================
    // SISTEMA DE FILA
    // ============================================
    const { data: gerandoAtivo } = await supabase
      .from("conceitos_topicos")
      .select("id, titulo")
      .eq("status", "gerando")
      .neq("id", topico_id)
      .limit(1);

    if (gerandoAtivo && gerandoAtivo.length > 0) {
      console.log(`[Conceitos Fila] Geração ativa: ${gerandoAtivo[0].titulo}`);
      
      const { data: maxPosicao } = await supabase
        .from("conceitos_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      const { data: jaEnfileirado } = await supabase
        .from("conceitos_topicos")
        .select("posicao_fila, status")
        .eq("id", topico_id)
        .single();
      
      if (jaEnfileirado?.status === "na_fila") {
        return new Response(
          JSON.stringify({ queued: true, position: jaEnfileirado.posicao_fila }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      await supabase
        .from("conceitos_topicos")
        .update({ status: "na_fila", posicao_fila: novaPosicao })
        .eq("id", topico_id);
      
      return new Response(
        JSON.stringify({ queued: true, position: novaPosicao }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // BUSCAR TÓPICO
    // ============================================
    const { data: topico, error: topicoError } = await supabase
      .from("conceitos_topicos")
      .select(`*, materia:conceitos_materias(id, nome, codigo)`)
      .eq("id", topico_id)
      .single();

    if (topicoError || !topico) {
      return new Response(
        JSON.stringify({ error: "Tópico não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topico.status === "gerando" && !force_restart) {
      return new Response(
        JSON.stringify({ message: "Geração já em andamento" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Marcar como gerando
    await supabase
      .from("conceitos_topicos")
      .update({ status: "gerando", progresso: 5, posicao_fila: null })
      .eq("id", topico_id);

    const materiaNome = topico.materia?.nome || "";
    const topicoTitulo = topico.titulo;
    console.log(`[Conceitos] Iniciando geração página-por-página: ${topicoTitulo}`);

    // ============================================
    // BUSCAR CONTEÚDO DO PDF
    // ============================================
    const { data: paginas } = await supabase
      .from("conceitos_topico_paginas")
      .select("pagina, conteudo")
      .eq("topico_id", topico_id)
      .order("pagina", { ascending: true });

    let conteudoPDF = "";
    if (paginas && paginas.length > 0) {
      conteudoPDF = paginas
        .filter(p => p.conteudo && p.conteudo.trim().length > 0)
        .map(p => `\n--- PÁGINA ${p.pagina} ---\n${p.conteudo}`)
        .join("\n\n");
      console.log(`[Conceitos] PDF: ${paginas.length} páginas, ${conteudoPDF.length} chars`);
    }

    // ============================================
    // CONFIGURAR GEMINI
    // ============================================
    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
      Deno.env.get("GEMINI_KEY_3"),
    ].filter(Boolean);
    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const genAI = new GoogleGenerativeAI(geminiKey!);
    // Usando gemini-2.5-flash-lite para geração de conteúdo de conceitos (mais rápido e econômico)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Função para atualizar progresso
    const updateProgress = async (value: number) => {
      await supabase
        .from("conceitos_topicos")
        .update({ progresso: value })
        .eq("id", topico_id);
    };

    // Função para sanitizar JSON
    function sanitizeJsonString(str: string): string {
      let result = "";
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const code = str.charCodeAt(i);
        
        if (escapeNext) { result += char; escapeNext = false; continue; }
        if (char === '\\') { result += char; escapeNext = true; continue; }
        if (char === '"') { inString = !inString; result += char; continue; }
        
        if (inString) {
          if (code === 0x0A) result += '\\n';
          else if (code === 0x0D) result += '\\r';
          else if (code === 0x09) result += '\\t';
          else if (code < 0x20 || code === 0x7F) continue;
          else result += char;
        } else {
          if (char === '\n' || char === '\r' || char === '\t' || char === ' ') result += char;
          else if (code < 0x20 || code === 0x7F) continue;
          else result += char;
        }
      }
      return result;
    }

    // Função para gerar e fazer parse de JSON
    async function gerarJSON(prompt: string): Promise<any> {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.5 },
      });
      
      let text = result.response.text();
      text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      
      const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!match) throw new Error("JSON não encontrado na resposta");
      
      const sanitized = sanitizeJsonString(match[0]);
      
      try {
        return JSON.parse(sanitized);
      } catch {
        const fixed = sanitized.replace(/,\s*([}\]])/g, "$1");
        return JSON.parse(fixed);
      }
    }

    // Função para limpar instruções vazadas no texto
    function limparInstrucoesVazadas(texto: string): string {
      const padroesRemover = [
        /^(Não inclua|INSTRUÇÕES|Retorne APENAS|REGRAS|PROIBIDO)[^\n]*\n*/gi,
        /^(Comece diretamente|O título será|O título da seção)[^\n]*\n*/gi,
        /^(Aqui está|Segue o conteúdo|Segue abaixo)[^\n]*\n*/gi,
        /^(Observação:|Nota:|OBS:)[^\n]*\n*/gi,
        /^(Esta seção|Nesta seção)[^\n]*\n*/gi,
        /^---\s*$/gm, // Remove linhas só com ---
      ];
      
      let limpo = texto.trim();
      for (const padrao of padroesRemover) {
        limpo = limpo.replace(padrao, '');
      }
      // Limpar múltiplas quebras de linha no início
      limpo = limpo.replace(/^\n+/, '');
      return limpo.trim();
    }

    // Função para gerar texto markdown
    async function gerarTexto(prompt: string): Promise<string> {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 16384, temperature: 0.6 },
      });
      const textoRaw = result.response.text();
      return limparInstrucoesVazadas(textoRaw);
    }

    // ============================================
    // GERAR PÁGINA POR PÁGINA
    // ============================================
    const paginasGeradas: { titulo: string; tipo: string; markdown: string }[] = [];
    const baseProgress = 10;
    const progressPerPage = 70 / PAGINAS_CONFIG.length;

    const promptBase = `Você é um professor de Direito descontraído, didático e apaixonado por ensinar.
Seu estilo é como uma CONVERSA COM UM AMIGO - você explica os conceitos como se estivesse tomando um café e ajudando um colega a entender a matéria.

## 🎯 SEU ESTILO DE ESCRITA OBRIGATÓRIO:

### ✅ FAÇA SEMPRE:
- Escreva como se estivesse CONVERSANDO com o estudante
- Use expressões naturais (varie, não repita a mesma mais de 2x):
  • "Olha só, é assim que funciona..."
  • "Veja bem, isso é super importante porque..."
  • "Percebeu a diferença? Esse é o pulo do gato!"
  • "Agora vem a parte interessante..."
  • "Resumindo pra você não esquecer..."
- Use perguntas retóricas para engajar ("E por que isso importa tanto?")
- Faça analogias com situações do dia a dia
- A cada termo técnico, EXPLIQUE o que significa COM DETALHES E EXEMPLOS:
  "...a personalidade civil (ou seja, a capacidade de ser titular de direitos). Por exemplo, um bebê recém-nascido já pode herdar bens..."
  "...o dolo eventual (isto é, quando o agente assume o risco de produzir o resultado). Imagine alguém dirigindo a 200km/h em área escolar..."
- Cite MÚLTIPLOS exemplos DURANTE a explicação, não depois
- Após conceitos complexos, faça um breve resumo informal

### 📖 PROFUNDIDADE DE CONTEÚDO (CRÍTICO!):

Para CADA página de tipo "texto" ou "conteudo_principal":
1. Comece explicando O QUE É o conceito (definição clara e completa)
2. Explique POR QUE é importante (contexto jurídico brasileiro)
3. Dê MÚLTIPLOS EXEMPLOS PRÁTICOS imediatamente (mínimo 2 por conceito)
4. Se tiver termo em latim, EXPLIQUE com aplicação: "*pacta sunt servanda* (pactos devem ser cumpridos) - na prática, significa que se você assinou um contrato de 12 meses, não pode sair no 3º mês sem consequências..."
5. Se o PDF citar doutrina/jurisprudência, INCLUA: > "Citação..." (AUTOR)
6. Se for ponto de prova, marque: > ⚠️ **ATENÇÃO:** Este tema cai com frequência em provas!
7. Faça transições naturais: "Agora que entendemos X, veja como Y se relaciona..."
8. Aprofunde cada tema - não passe superficialmente pelos conceitos

### ❌ NÃO FAÇA:
- Linguagem excessivamente formal/acadêmica (parecer livro jurídico)
- Parágrafos longos e densos sem pausas
- Repetir vícios de linguagem (não use a mesma expressão mais de 2x no texto)
- **NUNCA USE EMOJIS NO TEXTO CORRIDO** (emojis SÓ nos elementos visuais como > 💡 **DICA:**)
- NÃO seja superficial - cada conceito merece explicação COMPLETA

### ⛔ SAUDAÇÕES:
- Saudações são permitidas APENAS na página de Introdução
- Nas demais páginas, comece DIRETO com o conteúdo

## 📋 FORMATO DOS ELEMENTOS VISUAIS (CRÍTICO!):

SEMPRE use o caractere > (blockquote) no INÍCIO da linha para elementos especiais:

✅ FORMATO CORRETO (usar):
> ⚠️ **ATENÇÃO:** texto aqui
> 💡 **DICA:** texto aqui
> 📌 **EM RESUMO:** texto aqui
> 💼 **CASO PRÁTICO:** texto aqui
> 🎯 **VOCÊ SABIA?:** texto aqui

⛔ FORMATO ERRADO (NÃO usar):
⚠️ **ATENÇÃO:** texto (FALTA o > no início!)

O caractere > é OBRIGATÓRIO para que o elemento visual tenha fundo colorido.

## 📚 FIDELIDADE AO PDF:
- Use 100% do texto e informações do PDF
- Cite APENAS artigos/leis que aparecem LITERALMENTE no PDF
- NÃO invente artigos de lei que NÃO estejam no PDF
- Use os TÍTULOS ORIGINAIS do PDF como subtítulos (ex: "## 1. Escola Clássica")
- Inclua TODAS as citações de doutrinadores do PDF

**Matéria:** ${materiaNome}
**Tópico:** ${topicoTitulo}

═══ CONTEÚDO DO PDF ═══
${conteudoPDF || "Conteúdo não disponível"}
═══════════════════════`;

    for (let i = 0; i < PAGINAS_CONFIG.length; i++) {
      const config = PAGINAS_CONFIG[i];
      const progress = Math.round(baseProgress + (i * progressPerPage));
      await updateProgress(progress);
      
      console.log(`[Conceitos] Gerando página ${i + 1}/${PAGINAS_CONFIG.length}: ${config.tipo}`);
      
      const prompt = `${promptBase}

═══ SUA TAREFA ═══
${config.promptExtra}

[IMPORTANTE: Comece diretamente com o primeiro parágrafo do conteúdo. NÃO repita estas instruções no texto.]`;

      try {
        const markdown = await gerarTexto(prompt);
        paginasGeradas.push({
          titulo: `${config.titulo}: ${topicoTitulo}`,
          tipo: config.tipo,
          markdown: markdown.trim()
        });
        console.log(`[Conceitos] ✓ Página ${config.tipo}: ${markdown.length} chars`);
      } catch (err) {
        console.error(`[Conceitos] ❌ Erro na página ${config.tipo}:`, err);
        paginasGeradas.push({
          titulo: `${config.titulo}: ${topicoTitulo}`,
          tipo: config.tipo,
          markdown: `Conteúdo não disponível para esta seção.`
        });
      }
    }

    await updateProgress(80);
    console.log(`[Conceitos] ${paginasGeradas.length} páginas geradas`);

    // ============================================
    // GERAR EXTRAS (JSON)
    // ============================================
    console.log(`[Conceitos] Gerando extras (correspondências, flashcards, questões)...`);

    const promptExtras = `${promptBase}

═══ SUA TAREFA ═══
Gere os seguintes elementos de estudo baseados no conteúdo:

Retorne um JSON válido com esta estrutura EXATA:
{
  "correspondencias": [
    {"termo": "Termo do PDF", "definicao": "Definição curta (máx 60 chars)"}
  ],
  "exemplos": [
    {"titulo": "Título do caso", "situacao": "Descrição", "analise": "Análise jurídica", "conclusao": "Conclusão"}
  ],
  "termos": [
    {"termo": "Termo jurídico", "definicao": "Definição completa"}
  ],
  "flashcards": [
    {"frente": "Pergunta", "verso": "Resposta", "exemplo": "Exemplo prático"}
  ],
  "questoes": [
    {"pergunta": "Enunciado da questão", "alternativas": ["A) opção", "B) opção", "C) opção", "D) opção"], "correta": 0, "explicacao": "Explicação da resposta"}
  ]
}

QUANTIDADES:
- correspondencias: mínimo 8 pares
- exemplos: mínimo 5 casos
- termos: mínimo 10 termos
- flashcards: mínimo 15 cards
- questoes: mínimo 8 questões

Retorne APENAS o JSON, sem texto adicional.`;

    let extras: any = {};
    try {
      extras = await gerarJSON(promptExtras);
      console.log(`[Conceitos] ✓ Extras gerados`);
    } catch (err) {
      console.error(`[Conceitos] ❌ Erro nos extras, gerando fallback:`, err);
      extras = {
        correspondencias: [],
        exemplos: [],
        termos: [],
        flashcards: [],
        questoes: []
      };
    }

    await updateProgress(90);

    // Validar correspondências
    let correspondencias = extras.correspondencias || [];
    if (!Array.isArray(correspondencias) || correspondencias.length < 6) {
      // Fallback: usar termos se disponíveis
      if (extras.termos && Array.isArray(extras.termos) && extras.termos.length >= 6) {
        correspondencias = extras.termos.slice(0, 10).map((t: any) => ({
          termo: t.termo || t.nome || String(t),
          definicao: (t.definicao || t.descricao || "Conceito jurídico").substring(0, 60)
        }));
      }
    }
    
    correspondencias = correspondencias
      .filter((c: any) => c && c.termo && c.definicao)
      .slice(0, 10)
      .map((c: any) => ({
        termo: String(c.termo).trim().substring(0, 50),
        definicao: String(c.definicao).trim().substring(0, 80)
      }));

    console.log(`[Conceitos] Correspondências válidas: ${correspondencias.length}`);

    // ============================================
    // GERAR ESTRUTURA DE SLIDES INTERATIVOS
    // ============================================
    console.log(`[Conceitos] Gerando estrutura de páginas interativas...`);
    
    const promptSlides = `${promptBase}

═══ SUA TAREFA ═══
Transforme o conteúdo do PDF em uma estrutura de PÁGINAS INTERATIVAS para estudo.

CADA PÁGINA DEVE SER SUPER EXPLICATIVA com:
- Mínimo 200-400 palavras por página de tipo "texto"
- Exemplos práticos imediatos após cada conceito
- Explicação de TODOS os termos em latim e juridiquês
- Citações de artigos, doutrina e jurisprudência do PDF

Retorne um JSON válido com esta estrutura EXATA:
{
  "versao": 1,
  "titulo": "${topicoTitulo}",
  "tempoEstimado": "25 min",
  "objetivos": ["Objetivo 1", "Objetivo 2", "Objetivo 3"],
  "secoes": [
    {
      "id": 1,
      "titulo": "Nome da Seção",
      "slides": [
        {
          "tipo": "introducao",
          "titulo": "O que você vai aprender",
          "conteudo": "Texto introdutório motivador...",
          "imagemPrompt": "Professional legal illustration showing..."
        },
        {
          "tipo": "texto",
          "titulo": "Conceito Principal",
          "conteudo": "Explicação EXTENSA e DIDÁTICA do conceito...\\n\\n📚 **EXEMPLO PRÁTICO:** Maria comprou um celular...\\n\\nO termo *pacta sunt servanda* (que significa 'os pactos devem ser cumpridos') indica que...\\n\\n> \\"Art. 421 do CC - A liberdade contratual será exercida...\\" (Código Civil)\\n\\n> ⚠️ **ATENÇÃO:** Este ponto costuma cair em provas!",
          "imagemPrompt": "Educational illustration of..."
        },
        {
          "tipo": "termos",
          "titulo": "Termos Importantes",
          "conteudo": "Conheça os termos essenciais:",
          "termos": [
            {"termo": "Termo em latim", "definicao": "Significado claro em português"},
            {"termo": "Termo jurídico", "definicao": "Explicação acessível"}
          ],
          "imagemPrompt": "Legal glossary concept..."
        },
        {
          "tipo": "linha_tempo",
          "titulo": "Evolução Histórica",
          "conteudo": "Veja como o tema evoluiu:",
          "etapas": [
            {"titulo": "Etapa 1", "descricao": "Descrição da etapa"},
            {"titulo": "Etapa 2", "descricao": "Descrição da etapa"}
          ],
          "imagemPrompt": "Timeline showing legal evolution..."
        },
        {
          "tipo": "tabela",
          "titulo": "Comparativo",
          "conteudo": "Compare os principais aspectos:",
          "tabela": {
            "cabecalhos": ["Aspecto", "Tipo A", "Tipo B"],
            "linhas": [
              ["Característica 1", "Valor A1", "Valor B1"],
              ["Característica 2", "Valor A2", "Valor B2"]
            ]
          },
          "imagemPrompt": "Comparison chart concept..."
        },
        {
          "tipo": "atencao",
          "titulo": "Ponto de Atenção",
          "conteudo": "⚠️ Cuidado! Este é um ponto importante que costuma cair em provas...\\n\\n📚 **EXEMPLO:** Imagine que...",
          "imagemPrompt": "Warning sign concept..."
        },
        {
          "tipo": "dica",
          "titulo": "Dica de Memorização",
          "conteudo": "💡 Use este mnemônico para lembrar: SIGLA = ...\\n\\nOutra dica: associe o conceito X com...",
          "imagemPrompt": "Memory tip concept..."
        },
        {
          "tipo": "caso",
          "titulo": "Caso Prático",
          "conteudo": "💼 Imagine a seguinte situação:\\n\\nJoão comprou um imóvel...\\n\\n**Análise jurídica:** Aplicando o que estudamos...\\n\\n**Conclusão:** Portanto...",
          "imagemPrompt": "Legal case study illustration..."
        },
        {
          "tipo": "quickcheck",
          "titulo": "Verificação Rápida",
          "conteudo": "Teste seu conhecimento:",
          "pergunta": "Qual é a característica principal de X?",
          "opcoes": ["Opção A", "Opção B", "Opção C", "Opção D"],
          "resposta": 0,
          "feedback": "Correto! A resposta é A porque..."
        },
        {
          "tipo": "resumo",
          "titulo": "Resumo da Seção",
          "conteudo": "Recapitulando os pontos principais:",
          "pontos": ["Ponto 1", "Ponto 2", "Ponto 3"],
          "imagemPrompt": "Summary concept..."
        }
      ]
    }
  ]
}

REGRAS CRÍTICAS:
1. Gere entre 35-55 páginas no total, divididas em 5-7 seções
2. Use TODOS os tipos de páginas disponíveis de forma variada
3. Cada seção deve ter 5-10 páginas
4. Inclua imagemPrompt para TODOS as páginas (descrição para gerar imagem ilustrativa)
5. O imagemPrompt deve ser em INGLÊS e descrever uma ilustração educacional profissional
6. Use tom CONVERSACIONAL e didático no conteúdo
7. Inclua pelo menos 4 páginas tipo "quickcheck" espalhadas pelo conteúdo
8. Inclua pelo menos 2 páginas tipo "atencao" com pontos importantes
9. Inclua pelo menos 2 páginas tipo "dica" com mnemônicos e macetes
10. Garanta que o conteúdo seja COMPLETO - não pule informações importantes do PDF

CONTEÚDO OBRIGATÓRIO EM CADA PÁGINA TIPO "texto":
- Mínimo 200 palavras de explicação clara e didática
- Exemplo prático imediato: "📚 **EXEMPLO PRÁTICO:** Maria vendeu..."
- Explicação de termos: "O termo *habeas corpus* (que significa 'que tenhas o corpo') é..."
- Citações quando houver no PDF: "> \\"Art. 5º, inciso XXXV...\\" (CF/88)"
- Cards visuais: "> ⚠️ **ATENÇÃO:** ...", "> 💡 **DICA:** ..."

TIPOS DE PÁGINAS DISPONÍVEIS (NÃO use collapsible):
- introducao: Página de abertura com objetivos
- texto: Explicação EXTENSA de um conceito com exemplos
- termos: Lista de termos com definições
- linha_tempo: Timeline/etapas/procedimentos
- tabela: Quadro comparativo
- atencao: Ponto importante/pegadinha
- dica: Dica de memorização/estudo
- caso: Caso prático/exemplo detalhado
- resumo: Resumo com pontos principais
- quickcheck: Mini-quiz rápido

⛔ NÃO USE tipo "collapsible" - substitua por "texto" com subtítulos

Retorne APENAS o JSON válido, sem texto adicional.`;

    let slidesData: any = null;
    try {
      slidesData = await gerarJSON(promptSlides);
      console.log(`[Conceitos] ✓ Páginas geradas: ${slidesData?.secoes?.length || 0} seções`);
    } catch (err) {
      console.error(`[Conceitos] ❌ Erro ao gerar páginas:`, err);
      slidesData = null;
    }

    // ============================================
    // MONTAR CONTEÚDO FINAL COM TÍTULOS DAS SEÇÕES
    // ============================================
    const conteudoPrincipal = paginasGeradas
      .map((p, i) => {
        // Adiciona título da seção como ## para criar páginas no reader
        const tituloSecao = `## ${p.titulo.split(':')[0]}\n\n`;
        return `${tituloSecao}${p.markdown}`;
      })
      .join("\n\n---\n\n");

    // Montar array de páginas estruturado para o Reader
    const paginasParaSalvar = paginasGeradas.map((p, idx) => ({
      titulo: p.titulo,
      markdown: p.markdown,
      tipo: p.tipo
    }));

    const termosComCorrespondencias = {
      glossario: extras.termos || [],
      correspondencias: correspondencias,
      paginas: paginasParaSalvar
    };

    // ============================================
    // SALVAR NO BANCO
    // ============================================
    const { error: updateError } = await supabase
      .from("conceitos_topicos")
      .update({
        conteudo_gerado: conteudoPrincipal,
        exemplos: extras.exemplos || [],
        termos: termosComCorrespondencias,
        flashcards: extras.flashcards || [],
        questoes: extras.questoes || [],
        slides_json: slidesData, // Nova estrutura de slides interativos
        status: "concluido",
        progresso: 100,
        tentativas: (topico.tentativas || 0) + 1,
        posicao_fila: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", topico_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`[Conceitos] ✅ Conteúdo salvo: ${topicoTitulo}`);

    // ============================================
    // DISPARAR BATCH DE IMAGENS PARA OS SLIDES
    // ============================================
    if (slidesData?.secoes && Array.isArray(slidesData.secoes)) {
      const imagensParaBatch: Array<{id: number; slideId: string; prompt: string}> = [];
      
      slidesData.secoes.forEach((secao: any, secaoIdx: number) => {
        if (secao.slides && Array.isArray(secao.slides)) {
          secao.slides.forEach((slideItem: any, slideIdx: number) => {
            if (slideItem.imagemPrompt) {
              imagensParaBatch.push({
                id: imagensParaBatch.length,
                slideId: `${secaoIdx}-${slideIdx}`,
                prompt: slideItem.imagemPrompt
              });
            }
          });
        }
      });
      
      // Disparar batch se houver imagens a gerar
      if (imagensParaBatch.length > 0) {
        console.log(`[Conceitos] Disparando batch para ${imagensParaBatch.length} imagens de slides`);
        
        fetch(`${supabaseUrl}/functions/v1/batch-imagens-iniciar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            tipo: "imagens_slides",
            items: imagensParaBatch,
            materia_id: topico.materia?.id || null,
            topico_id: topico_id
          })
        }).catch(err => {
          console.error("[Conceitos] Erro ao iniciar batch de imagens:", err);
        });
      }
    }

    // Processar próximo da fila
    await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conteúdo gerado página por página",
        topico_id,
        titulo: topicoTitulo,
        paginas: paginasGeradas.length,
        stats: {
          correspondencias: correspondencias.length,
          exemplos: extras.exemplos?.length || 0,
          termos: extras.termos?.length || 0,
          flashcards: extras.flashcards?.length || 0,
          questoes: extras.questoes?.length || 0,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Conceitos] ❌ Erro:", error);

    try {
      if (topicoIdForCatch && supabaseForCatch) {
        await supabaseForCatch
          .from("conceitos_topicos")
          .update({ status: "erro", progresso: 0 })
          .eq("id", topicoIdForCatch);

        await processarProximoDaFila(
          supabaseForCatch,
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
      }
    } catch (catchErr) {
      console.error("[Conceitos] Erro no fallback:", catchErr);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Função auxiliar para processar próximo da fila
async function processarProximoDaFila(supabase: any, supabaseUrl: string, supabaseServiceKey: string) {
  try {
    const { data: proximo, error } = await supabase
      .from("conceitos_topicos")
      .select("id, titulo")
      .eq("status", "na_fila")
      .order("posicao_fila", { ascending: true })
      .limit(1)
      .single();

    if (error || !proximo) {
      console.log("[Conceitos Fila] Fila vazia");
      return;
    }

    console.log(`[Conceitos Fila] Próximo: ${proximo.titulo}`);

    fetch(`${supabaseUrl}/functions/v1/gerar-conteudo-conceitos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ topico_id: proximo.id }),
    }).catch(err => console.error("[Conceitos Fila] Erro:", err));
  } catch (err) {
    console.error("[Conceitos Fila] Erro:", err);
  }
}
