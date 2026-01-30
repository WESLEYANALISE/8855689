import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constantes de configuração - ALINHADO COM OAB TRILHAS
const MIN_PAGINAS = 8;
const MAX_TENTATIVAS = 1; // 1 tentativa conforme preferência do usuário

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Guardar referências para o catch
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
    // SISTEMA DE FILA: Verificar se já há geração ativa
    // ============================================
    const { data: gerandoAtivo, error: checkError } = await supabase
      .from("conceitos_topicos")
      .select("id, titulo")
      .eq("status", "gerando")
      .neq("id", topico_id)
      .limit(1);

    if (!checkError && gerandoAtivo && gerandoAtivo.length > 0) {
      console.log(`[Conceitos Fila] Geração ativa detectada: ${gerandoAtivo[0].titulo} (ID: ${gerandoAtivo[0].id})`);
      
      // Calcular próxima posição na fila
      const { data: maxPosicao } = await supabase
        .from("conceitos_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      // Verificar se já está na fila
      const { data: jaEnfileirado } = await supabase
        .from("conceitos_topicos")
        .select("posicao_fila, status")
        .eq("id", topico_id)
        .single();
      
      if (jaEnfileirado?.status === "na_fila") {
        const { count: totalFila } = await supabase
          .from("conceitos_topicos")
          .select("id", { count: "exact", head: true })
          .eq("status", "na_fila");
        
        return new Response(
          JSON.stringify({ 
            queued: true, 
            position: jaEnfileirado.posicao_fila,
            total: totalFila || 1,
            message: `Já está na fila na posição ${jaEnfileirado.posicao_fila}`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Colocar na fila
      await supabase
        .from("conceitos_topicos")
        .update({ 
          status: "na_fila", 
          posicao_fila: novaPosicao,
          updated_at: new Date().toISOString() 
        })
        .eq("id", topico_id);
      
      const { count: totalFila } = await supabase
        .from("conceitos_topicos")
        .select("id", { count: "exact", head: true })
        .eq("status", "na_fila");
      
      console.log(`[Conceitos Fila] Tópico ${topico_id} adicionado na posição ${novaPosicao} (total: ${totalFila})`);
      
      return new Response(
        JSON.stringify({ 
          queued: true, 
          position: novaPosicao,
          total: totalFila || 1,
          message: `Adicionado à fila na posição ${novaPosicao}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // INÍCIO DA GERAÇÃO
    // ============================================

    // Buscar tópico com matéria
    const { data: topico, error: topicoError } = await supabase
      .from("conceitos_topicos")
      .select(`
        *,
        materia:conceitos_materias(id, nome, codigo)
      `)
      .eq("id", topico_id)
      .single();

    if (topicoError || !topico) {
      return new Response(
        JSON.stringify({ error: "Tópico não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se já está gerando (permitir restart forçado)
    if (topico.status === "gerando" && !force_restart) {
      return new Response(
        JSON.stringify({ message: "Geração já em andamento" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topico.status === "gerando" && force_restart) {
      console.log(`[Conceitos] 🔁 Force restart solicitado para topico_id=${topico_id}`);
    }

    // Marcar como gerando com progresso inicial, limpar posição da fila
    const posicaoRemovida = topico.posicao_fila;
    
    await supabase
      .from("conceitos_topicos")
      .update({ 
        status: "gerando", 
        progresso: 5,
        posicao_fila: null,
        updated_at: new Date().toISOString() 
      })
      .eq("id", topico_id);

    // Atualizar posições na fila (decrementar todos acima da posição removida)
    if (posicaoRemovida) {
      const { data: filaParaAtualizar } = await supabase
        .from("conceitos_topicos")
        .select("id, posicao_fila")
        .eq("status", "na_fila")
        .gt("posicao_fila", posicaoRemovida);
      
      if (filaParaAtualizar && filaParaAtualizar.length > 0) {
        for (const item of filaParaAtualizar) {
          await supabase
            .from("conceitos_topicos")
            .update({ posicao_fila: (item.posicao_fila || 1) - 1 })
            .eq("id", item.id);
        }
        console.log(`[Conceitos Fila] Posições atualizadas: ${filaParaAtualizar.length} itens`);
      }
    }

    // Função auxiliar para atualizar progresso
    const updateProgress = async (value: number) => {
      await supabase
        .from("conceitos_topicos")
        .update({ progresso: value, updated_at: new Date().toISOString() })
        .eq("id", topico_id);
    };

    const materiaNome = topico.materia?.nome || "";
    const topicoTitulo = topico.titulo;
    const tentativasAtuais = topico.tentativas || 0;

    console.log(`[Conceitos] Gerando conteúdo para: ${materiaNome} - ${topicoTitulo} (tentativa ${tentativasAtuais + 1})`);

    // 1. Buscar conteúdo das páginas do PDF
    await updateProgress(10);
    const { data: paginas, error: paginasError } = await supabase
      .from("conceitos_materia_paginas")
      .select("pagina, conteudo")
      .eq("materia_id", topico.materia?.id)
      .gte("pagina", topico.pagina_inicial || 1)
      .lte("pagina", topico.pagina_final || 999)
      .order("pagina", { ascending: true });

    let conteudoPDF = "";
    if (paginas && paginas.length > 0) {
      conteudoPDF = paginas
        .filter(p => p.conteudo && p.conteudo.trim().length > 0)
        .map(p => `\n--- PÁGINA ${p.pagina} ---\n${p.conteudo}`)
        .join("\n\n");
      console.log(`[Conceitos] PDF: ${paginas.length} páginas, ${conteudoPDF.length} caracteres`);
    } else {
      console.log("[Conceitos] ALERTA: Nenhuma página do PDF encontrada!");
    }

    await updateProgress(20);

    // 2. Buscar contexto adicional do RESUMO se existir
    let conteudoResumo = "";
    const { data: resumos } = await supabase
      .from("RESUMO")
      .select("conteudo, subtema")
      .or(`subtema.ilike.%${topicoTitulo}%,tema.ilike.%${topicoTitulo}%`)
      .limit(5);

    if (resumos && resumos.length > 0) {
      conteudoResumo = resumos.map(r => {
        const sub = r.subtema ? `### ${r.subtema}\n` : "";
        return sub + (r.conteudo || "");
      }).join("\n\n");
      console.log(`[Conceitos] RESUMO: ${resumos.length} subtemas encontrados`);
    }

    await updateProgress(30);

    // 3. Configurar Gemini - SIMPLES, igual OAB Trilhas (escolher chave aleatória)
    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
      Deno.env.get("GEMINI_KEY_3"),
    ].filter(Boolean) as string[];

    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    console.log(`[Conceitos] Usando chave Gemini aleatória (${geminiKeys.length} disponíveis)`);
    
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 4. PROMPT PARA CONCEITOS - Foco em iniciantes de Direito
    const prompt = `Você é um professor de Direito acolhedor e didático, especializado em ensinar INICIANTES.
Seu estilo é como uma CONVERSA COM UM AMIGO - você explica os conceitos como se estivesse ajudando alguém que está começando agora a estudar Direito.

## SEU ESTILO DE ESCRITA OBRIGATÓRIO:

### FAÇA SEMPRE:
- Escreva como se estivesse CONVERSANDO com o estudante iniciante
- Use expressões naturais como:
  - "Olha só, você está começando a entender uma das bases do Direito..."
  - "Veja bem, isso aqui é fundamental pra sua formação..."
  - "Sabe quando você ouve falar de...? Pois é, é isso que vamos entender!"
  - "Deixa eu te explicar de um jeito mais simples..."
  - "Esse é um conceito que você vai usar em toda sua carreira jurídica!"
  - "Calma, parece complicado, mas vou te mostrar passo a passo..."
- Use perguntas retóricas para engajar
- Faça analogias com situações do dia a dia
- Antecipe dúvidas ("Você pode estar pensando: mas o que isso significa na prática?")
- A cada conceito importante, explique de forma simples antes de aprofundar

### NÃO FAÇA:
- Linguagem excessivamente formal/acadêmica
- Parágrafos longos e densos sem pausas
- Explicações secas e diretas demais
- Texto que pareça copiado de um livro jurídico
- **NUNCA USE EMOJIS NO TEXTO**
- **NUNCA USE ASPAS DUPLAS (\") NO MARKDOWN** (isso quebra o JSON). Se precisar destacar uma expressão, use aspas simples ('...') ou itálico (*...*).

═══════════════════════════════════════════════════════════════════
REGRA ABSOLUTA: FIDELIDADE 100% AO CONTEÚDO DO PDF
═══════════════════════════════════════════════════════════════════

O CONTEÚDO ABAIXO FOI EXTRAÍDO DE UM PDF OFICIAL. VOCÊ DEVE:
- Usar 100% do texto e informações do PDF
- Citar APENAS artigos/leis que aparecem LITERALMENTE no PDF
- Explicar cada conceito presente no material de forma didática
- NÃO pular nenhum tópico ou seção do PDF

VOCÊ NÃO PODE:
- INVENTAR artigos de lei que NÃO estejam no PDF
- ADICIONAR citações legais que você "sabe" mas NÃO estão no conteúdo
- CRIAR jurisprudência ou números de processos não presentes
- OMITIR informações importantes do PDF

## INFORMAÇÕES DO TEMA
**Matéria:** ${materiaNome}
**Tópico:** ${topicoTitulo}

═══════════════════════════════════════════════════════════════════
CONTEÚDO COMPLETO DO PDF (USE 100% DESTE MATERIAL):
═══════════════════════════════════════════════════════════════════

${conteudoPDF || "Conteúdo do PDF não disponível"}

${conteudoResumo ? `
═══════════════════════════════════════════════════════════════════
CONTEXTO ADICIONAL:
═══════════════════════════════════════════════════════════════════

${conteudoResumo}
` : ""}

═══════════════════════════════════════════════════════════════════
SUA MISSÃO: GERAR CONTEÚDO COM EXATAMENTE 8 PÁGINAS
═══════════════════════════════════════════════════════════════════

Crie um material de estudo em formato JSON com EXATAMENTE 8 PÁGINAS:

### ESTRUTURA OBRIGATÓRIA (8 PÁGINAS):

**PÁGINA 1 - INTRODUÇÃO** (Tom: acolhedor e motivador para INICIANTES)
- Tipo: "introducao"
- Comece com algo engajador: "Você está começando sua jornada no Direito e chegou em um dos temas mais importantes: ${materiaNome}..."
- Explique que este é um conceito fundamental para a formação jurídica
- Contextualize: "Este tema que vamos estudar - ${topicoTitulo} - é essencial porque..."
- "Ao final dessa trilha, você vai dominar os fundamentos de..."
- Visão geral em 300-500 palavras, linguagem acessível para quem está começando

**PÁGINA 2 - CONTEÚDO COMPLETO** (Tom: professor explicando para iniciante)
- Tipo: "conteudo_principal"
- Explique TODO o tema usando 100% do conteúdo do PDF
- Organize com subtítulos claros (##, ###)
- Use tom CONVERSACIONAL: "Vamos lá!", "Entendeu?", "Aqui vem a parte interessante..."
- Lembre que o estudante está COMEÇANDO: explique tudo com paciência
- Cite os artigos de lei EXATAMENTE como aparecem no PDF
- Mínimo 3000 palavras - cubra TUDO do PDF

**PÁGINA 3 - DESMEMBRANDO** (Tom: "Agora vou destrinchar cada parte...")
- Tipo: "desmembrando"
- Análise detalhada de cada elemento importante
- Decomponha conceitos complexos em partes menores
- "Esse termo pode parecer complicado, mas olha só..."

**PÁGINA 4 - ENTENDENDO NA PRÁTICA** (Tom: "Imagina essa situação...")
- Tipo: "entendendo_na_pratica"
- Casos práticos do dia a dia baseados no conteúdo
- "Vou te dar um exemplo bem concreto..."
- Situações reais de aplicação

**PÁGINA 5 - QUADRO COMPARATIVO**
- Tipo: "quadro_comparativo"
- Tabelas comparativas dos principais conceitos
- Compare elementos, características, diferenças
- Use formato Markdown de tabela

**PÁGINA 6 - DICAS PARA MEMORIZAR** (Tom: "Olha esse truque...")
- Tipo: "dicas_provas"
- Técnicas de memorização (mnemônicos, associações)
- "Quer uma dica? Pensa assim..."
- Pontos mais importantes para lembrar

**PÁGINA 7 - LIGAR TERMOS (EXERCÍCIO INTERATIVO)**
- Tipo: "correspondencias"
- NÃO é conteúdo markdown normal!
- Será um jogo de arrastar e conectar termos às definições
- O conteúdo deve ser apenas uma introdução breve
- Os dados reais do jogo vão no campo "correspondencias" separado

**PÁGINA 8 - SÍNTESE FINAL** (Tom: "Recapitulando tudo que vimos...")
- Tipo: "sintese_final"
- Resumo de todos os pontos-chave
- "Vamos revisar rapidinho..."
- Checklist do que você aprendeu

### FORMATO DE RESPOSTA (JSON OBRIGATÓRIO):

\`\`\`json
{
  "paginas": [
    {
      "titulo": "Introdução: ${topicoTitulo}",
      "tipo": "introducao",
      "markdown": "# Bem-vindo ao estudo de ${topicoTitulo}!\\n\\n[Visão geral acolhedora para iniciantes]"
    },
    {
      "titulo": "Conteúdo Completo: ${topicoTitulo}",
      "tipo": "conteudo_principal",
      "markdown": "# ${topicoTitulo}\\n\\n[TODO o conteúdo do PDF em 3000+ palavras]"
    },
    {
      "titulo": "Desmembrando o Tema",
      "tipo": "desmembrando",
      "markdown": "# Desmembrando\\n\\n[Análise detalhada]"
    },
    {
      "titulo": "Entendendo na Prática",
      "tipo": "entendendo_na_pratica",
      "markdown": "# Entendendo na Prática\\n\\n[Casos práticos]"
    },
    {
      "titulo": "Quadro Comparativo",
      "tipo": "quadro_comparativo",
      "markdown": "# Quadro Comparativo\\n\\n[Tabelas]"
    },
    {
      "titulo": "Dicas para Memorizar",
      "tipo": "dicas_provas",
      "markdown": "# Dicas para Memorizar\\n\\n[Técnicas e mnemônicos]"
    },
    {
      "titulo": "Ligar Termos",
      "tipo": "correspondencias",
      "markdown": "# Exercício: Ligar Termos\\n\\nConecte cada termo à sua definição correta."
    },
    {
      "titulo": "Síntese Final",
      "tipo": "sintese_final",
      "markdown": "# Síntese Final\\n\\n[Resumo e checklist]"
    }
  ],
  "correspondencias": [
    {"termo": "Termo do PDF", "definicao": "Definição correspondente"},
    {"termo": "Outro termo", "definicao": "Outra definição"}
  ],
  "exemplos": [
    {"titulo": "Título", "situacao": "Descrição", "analise": "Análise", "conclusao": "Conclusão"}
  ],
  "termos": [
    {"termo": "Termo", "definicao": "Definição"}
  ],
  "flashcards": [
    {"frente": "Pergunta", "verso": "Resposta", "exemplo": "Exemplo"}
  ],
  "questoes": [
    {"pergunta": "Enunciado", "alternativas": ["A)", "B)", "C)", "D)"], "correta": 0, "explicacao": "Explicação"}
  ]
}
\`\`\`

### QUANTIDADES OBRIGATÓRIAS:
- Páginas: EXATAMENTE 8 páginas
- Página 2 (Conteúdo): Mínimo 3000 palavras
- Correspondências: Mínimo 8 pares termo/definição
- Exemplos: Mínimo 5 casos práticos
- Termos: Mínimo 10 termos jurídicos
- Flashcards: Mínimo 15 flashcards
- Questões: Mínimo 8 questões

IMPORTANTE: 
- Use TODO o conteúdo do PDF
- NÃO invente artigos ou citações legais
- MANTENHA O TOM ACOLHEDOR para iniciantes
- Retorne APENAS o JSON válido, SEM texto adicional após o fechamento final`;

    // 5. Função para gerar conteúdo - SIMPLIFICADA (SEM CONCATENAÇÃO PROBLEMÁTICA)
    // A concatenação de múltiplas respostas JSON causava erro de parse
    async function gerarConteudo(promptInicial: string): Promise<string> {
      console.log(`[Conceitos] Chamando Gemini (chamada única)...`);
      
      // CHAMADA EM MODO JSON: força saída como application/json (reduz erro de parse)
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: promptInicial }] }],
        generationConfig: {
          maxOutputTokens: 65000,
          temperature: 0.3,
          // @google/generative-ai: força resposta em JSON (sem markdown/fences)
          responseMimeType: "application/json",
        },
      });
      
      const responseText = result.response.text();
      console.log(`[Conceitos] Resposta: ${responseText.length} chars`);
      
      return responseText;
    }

    // Gerar conteúdo em chamada única (sem concatenação problemática)
    await updateProgress(50);
    const responseText = await gerarConteudo(prompt);
    await updateProgress(70);
    console.log(`[Conceitos] Resposta final: ${responseText.length} chars`);
    
    // ============================================
    // EXTRAÇÃO DE JSON BALANCEADA (State Machine Parser)
    // Mais robusta que indexOf/lastIndexOf
    // ============================================

    function normalizarJsonIA(text: string): string {
      // 1) Remover BOM e espaços estranhos
      let t = text.replace(/^\uFEFF/, "").replace(/\u00A0/g, " ");

      // 2) Normalizar aspas “curvas” que quebram JSON.parse
      t = t
        .replace(/[\u201C\u201D]/g, '"') // “ ”
        .replace(/[\u2018\u2019]/g, "'"); // ‘ ’

      // 3) Heurística: se o modelo retornou pseudo-JSON com aspas simples
      // Ex: {'paginas': [...]} -> {"paginas": [...]}
      // Só aplicamos quando não há chaves com aspas duplas (evita corromper JSON válido)
      const hasSingleQuotedKeys = /(^|[\s,{])'[^'\\]+'\s*:/.test(t);
      const hasDoubleQuotedKeys = /(^|[\s,{])"[^"\\]+"\s*:/.test(t);
      if (hasSingleQuotedKeys && !hasDoubleQuotedKeys) {
        t = t.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_m, p1) => {
          const inner = String(p1).replace(/"/g, '\\"');
          return `"${inner}"`;
        });
      }

      return t;
    }
    function extrairJsonBalanceado(text: string): string | null {
      // Encontrar o início do JSON
      const startIndex = text.indexOf("{");
      if (startIndex === -1) return null;
      
      let depth = 0;
      let inString = false;
      let escape = false;
      let endIndex = -1;
      
      for (let i = startIndex; i < text.length; i++) {
        const char = text[i];
        
        if (escape) {
          escape = false;
          continue;
        }
        
        if (char === '\\') {
          escape = true;
          continue;
        }
        
        if (char === '"' && !escape) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') depth++;
          else if (char === '}') {
            depth--;
            if (depth === 0) {
              endIndex = i;
              break;
            }
          }
        }
      }
      
      if (endIndex === -1) return null;
      return text.slice(startIndex, endIndex + 1);
    }
    
    // Extrair JSON da resposta
    let jsonStr = responseText;
    
    // Remover marcadores de código se houver
    jsonStr = jsonStr.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
    
    // Tentar extração balanceada primeiro
    const jsonBalanceado = extrairJsonBalanceado(jsonStr);
    if (jsonBalanceado) {
      jsonStr = jsonBalanceado;
      console.log(`[Conceitos] JSON extraído via state machine: ${jsonStr.length} chars`);
    } else {
      // Fallback para indexOf/lastIndexOf
      const jsonStart = jsonStr.indexOf("{");
      const jsonEnd = jsonStr.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
        console.log(`[Conceitos] JSON extraído via fallback: ${jsonStr.length} chars`);
      }
    }
    
    // ============================================
    // PARSE JSON - Abordagem IDÊNTICA à OAB Trilhas
    // ============================================
    let conteudoGerado;
    
    try {
      jsonStr = normalizarJsonIA(jsonStr);

      // Sanitizar caracteres de controle antes do parse (IGUAL OAB Trilhas)
      const sanitizedJson = jsonStr.replace(/[\x00-\x1F\x7F]/g, (char) => {
        if (char === '\n') return '\\n';
        if (char === '\r') return '\\r';
        if (char === '\t') return '\\t';
        return ''; // Remove outros caracteres de controle
      });
      conteudoGerado = JSON.parse(sanitizedJson);
      console.log("[Conceitos] ✅ JSON parseado diretamente");
    } catch (parseError) {
      // Logs curtos para diagnosticar formato inválido (sem vazar conteúdo inteiro)
      const preview = jsonStr.slice(0, 220);
      const codes = Array.from(jsonStr.slice(0, 30)).map((c) => c.charCodeAt(0));
      console.log("[Conceitos] JSON preview (220):", preview);
      console.log("[Conceitos] JSON charCodes (30):", codes.join(","));

      console.log("[Conceitos] Erro no parse, tentando corrigir JSON...");
      
      // Sanitizar caracteres de controle (igual OAB)
      let jsonCorrigido = normalizarJsonIA(jsonStr).replace(/[\x00-\x1F\x7F]/g, (char) => {
        if (char === '\n') return '\\n';
        if (char === '\r') return '\\r';
        if (char === '\t') return '\\t';
        return '';
      });
      
      // Adicionar fechamentos faltantes
      const aberturasObj = (jsonCorrigido.match(/{/g) || []).length;
      const fechamentosObj = (jsonCorrigido.match(/}/g) || []).length;
      const aberturasArr = (jsonCorrigido.match(/\[/g) || []).length;
      const fechamentosArr = (jsonCorrigido.match(/]/g) || []).length;
      
      for (let i = 0; i < aberturasArr - fechamentosArr; i++) {
        jsonCorrigido += "]";
      }
      for (let i = 0; i < aberturasObj - fechamentosObj; i++) {
        jsonCorrigido += "}";
      }
      
      // Remover vírgula antes de fechamento
      jsonCorrigido = jsonCorrigido.replace(/,\s*([}\]])/g, "$1");
      
      try {
        conteudoGerado = JSON.parse(jsonCorrigido);
        console.log("[Conceitos] ✅ JSON corrigido com sucesso");
      } catch (finalError) {
        console.error("[Conceitos] ❌ Falha definitiva no parse JSON:", finalError);
        await supabase.from("conceitos_topicos")
          .update({ status: "erro", progresso: 0, updated_at: new Date().toISOString() })
          .eq("id", topico_id);
        
        // Processar próximo da fila mesmo em erro
        await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
        
        throw new Error("Falha ao processar resposta da IA");
      }
    }

    // 6. Processar o conteúdo das páginas
    let conteudoPrincipal = "";
    const numPaginas = conteudoGerado.paginas?.length || 0;
    
    if (conteudoGerado.paginas && Array.isArray(conteudoGerado.paginas)) {
      conteudoPrincipal = conteudoGerado.paginas
        .map((p: any, i: number) => {
          const separador = i > 0 ? "\n\n---\n\n" : "";
          return `${separador}${p.markdown || ""}`;
        })
        .join("");
      
      console.log(`[Conceitos] ${numPaginas} páginas geradas`);
    } else {
      conteudoPrincipal = conteudoGerado.conteudo || "";
    }

    // ============================================
    // VALIDAÇÃO DE PÁGINAS - SE < 8, REGENERAR AUTOMATICAMENTE
    // ============================================
    if (numPaginas < MIN_PAGINAS) {
      console.log(`[Conceitos] ⚠️ Apenas ${numPaginas} páginas (mínimo: ${MIN_PAGINAS}), tentando complementar...`);
      
      // Tentar complementar as páginas que faltam
      const tiposExistentes = conteudoGerado.paginas?.map((p: any) => p.tipo) || [];
      const tiposNecessarios = ["introducao", "conteudo_principal", "desmembrando", "entendendo_na_pratica", "quadro_comparativo", "dicas_provas", "correspondencias", "sintese_final"];
      const tiposFaltantes = tiposNecessarios.filter(t => !tiposExistentes.includes(t));
      
      if (tiposFaltantes.length > 0) {
        console.log(`[Conceitos] Tipos faltantes: ${tiposFaltantes.join(", ")}`);
        
        const promptComplemento = `Complete o material de estudo sobre "${topicoTitulo}".

Já foram geradas ${numPaginas} páginas. Você precisa gerar EXATAMENTE as páginas que faltam para completar 8.

Páginas que já existem (NÃO REPETIR): ${tiposExistentes.join(", ")}
Páginas que FALTAM (GERAR AGORA): ${tiposFaltantes.join(", ")}

Retorne APENAS um JSON com o array "paginas" contendo as páginas faltantes:

\`\`\`json
{
  "paginas": [
    {
      "titulo": "Título da página",
      "tipo": "${tiposFaltantes[0]}",
      "markdown": "# Conteúdo..."
    }
  ]
}
\`\`\`

Use o mesmo tom conversacional e didático. Mantenha a qualidade.`;

        try {
          const complementoText = await gerarConteudo(promptComplemento);
          let complementoJson = complementoText.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
          complementoJson = normalizarJsonIA(complementoJson);
          
          // Usar extração balanceada
          const compBalanceado = extrairJsonBalanceado(complementoJson);
          if (compBalanceado) {
            complementoJson = compBalanceado;
          } else {
            const compStart = complementoJson.indexOf("{");
            const compEnd = complementoJson.lastIndexOf("}");
            if (compStart !== -1 && compEnd !== -1) {
              complementoJson = complementoJson.slice(compStart, compEnd + 1);
            }
          }
          
          // Parse com sanitização igual OAB Trilhas
          let complemento;
          try {
            const sanitizedComp = normalizarJsonIA(complementoJson).replace(/[\x00-\x1F\x7F]/g, (char: string) => {
              if (char === '\n') return '\\n';
              if (char === '\r') return '\\r';
              if (char === '\t') return '\\t';
              return '';
            });
            complemento = JSON.parse(sanitizedComp);
          } catch {
            // Limpeza adicional se falhar
            let jsonLimpo = normalizarJsonIA(complementoJson).replace(/[\x00-\x1F\x7F]/g, (char: string) => {
              if (char === '\n') return '\\n';
              if (char === '\r') return '\\r';
              if (char === '\t') return '\\t';
              return '';
            }).replace(/,(\s*[}\]])/g, "$1");
            complemento = JSON.parse(jsonLimpo);
          }
          
          if (complemento.paginas && Array.isArray(complemento.paginas)) {
            conteudoGerado.paginas = [...(conteudoGerado.paginas || []), ...complemento.paginas];
            console.log(`[Conceitos] ✅ Complemento adicionou ${complemento.paginas.length} páginas. Total: ${conteudoGerado.paginas.length}`);
            
            // Recalcular conteúdo principal
            conteudoPrincipal = conteudoGerado.paginas
              .map((p: any, i: number) => {
                const separador = i > 0 ? "\n\n---\n\n" : "";
                return `${separador}${p.markdown || ""}`;
              })
              .join("");
          }
        } catch (compError) {
          console.log(`[Conceitos] ⚠️ Falha ao complementar páginas:`, compError);
        }
      }
      
      // Verificar novamente após complemento
      const numPaginasFinal = conteudoGerado.paginas?.length || 0;
      if (numPaginasFinal < MIN_PAGINAS) {
        console.log(`[Conceitos] ❌ Ainda com ${numPaginasFinal} páginas após complemento - marcando erro`);
        
        await supabase.from("conceitos_topicos")
          .update({ 
            status: "erro", 
            tentativas: 1,
            progresso: 0,
            updated_at: new Date().toISOString() 
          })
          .eq("id", topico_id);
        
        // Processar próximo da fila
        await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
        
        return new Response(
          JSON.stringify({ 
            error: `Conteúdo insuficiente: ${numPaginasFinal}/${MIN_PAGINAS} páginas. Clique em "Tentar novamente".`,
            paginas: numPaginasFinal
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 7. VALIDAR correspondências antes de salvar
    await updateProgress(85);
    let correspondenciasValidas = conteudoGerado.correspondencias || [];
    
    if (!Array.isArray(correspondenciasValidas) || correspondenciasValidas.length < 8) {
      console.log(`[Conceitos] ⚠️ Correspondências insuficientes (${correspondenciasValidas.length}), tentando extrair...`);
      
      // Tentar extrair correspondências a partir das páginas
      const paginaLigarTermos = conteudoGerado.paginas?.find((p: any) => 
        p.titulo?.toLowerCase().includes("ligar") || 
        p.tipo === "correspondencias" ||
        p.markdown?.toLowerCase().includes("ligar termos")
      );
      
      if (paginaLigarTermos?.dados_interativos?.pares) {
        correspondenciasValidas = paginaLigarTermos.dados_interativos.pares;
        console.log(`[Conceitos] ✓ Extraídas ${correspondenciasValidas.length} correspondências da página 7`);
      } else if (conteudoGerado.termos && Array.isArray(conteudoGerado.termos) && conteudoGerado.termos.length >= 8) {
        correspondenciasValidas = conteudoGerado.termos.slice(0, 10).map((t: any) => ({
          termo: t.termo || t.nome || t,
          definicao: t.definicao?.substring(0, 60) || t.descricao?.substring(0, 60) || "Conceito jurídico"
        }));
        console.log(`[Conceitos] ✓ Convertidos ${correspondenciasValidas.length} termos em correspondências`);
      }
    }
    
    // Validar cada par de correspondência
    correspondenciasValidas = correspondenciasValidas
      .filter((c: any) => c && c.termo && c.definicao)
      .slice(0, 10)
      .map((c: any) => ({
        termo: String(c.termo).trim().substring(0, 50),
        definicao: String(c.definicao).trim().substring(0, 80)
      }));
    
    console.log(`[Conceitos] Correspondências finais: ${correspondenciasValidas.length} pares válidos`);
    
    // Se ainda não tiver correspondências suficientes, marcar como erro
    if (correspondenciasValidas.length < 6) {
      console.error(`[Conceitos] ❌ Falha: apenas ${correspondenciasValidas.length} correspondências (mínimo 6)`);
      await supabase.from("conceitos_topicos")
        .update({ status: "erro", progresso: 80, updated_at: new Date().toISOString() })
        .eq("id", topico_id);
      throw new Error(`Correspondências insuficientes para o jogo Ligar Termos (${correspondenciasValidas.length}/6)`);
    }
    
    const termosComCorrespondencias = {
      glossario: conteudoGerado.termos || [],
      correspondencias: correspondenciasValidas
    };
    
    // 8. Salvar conteúdo
    const numPaginasFinal = conteudoGerado.paginas?.length || 0;
    
    const { error: updateError } = await supabase
      .from("conceitos_topicos")
      .update({
        conteudo_gerado: conteudoPrincipal,
        exemplos: conteudoGerado.exemplos || [],
        termos: termosComCorrespondencias,
        flashcards: conteudoGerado.flashcards || [],
        questoes: conteudoGerado.questoes || [],
        status: "concluido",
        progresso: 100,
        tentativas: tentativasAtuais + 1,
        posicao_fila: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", topico_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`[Conceitos] ✅ Conteúdo salvo com sucesso: ${topicoTitulo}`);
    console.log(`[Conceitos] Stats: ${numPaginasFinal} páginas, ${correspondenciasValidas.length} correspondências, ${conteudoGerado.flashcards?.length || 0} flashcards`);

    // ============================================
    // PROCESSAR PRÓXIMO DA FILA
    // ============================================
    await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conteúdo gerado com sucesso - 8 páginas",
        topico_id,
        titulo: topicoTitulo,
        materia: materiaNome,
        paginas: numPaginasFinal,
        stats: {
          correspondencias: correspondenciasValidas.length,
          exemplos: conteudoGerado.exemplos?.length || 0,
          termos: conteudoGerado.termos?.length || 0,
          flashcards: conteudoGerado.flashcards?.length || 0,
          questoes: conteudoGerado.questoes?.length || 0,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Conceitos] ❌ Erro ao gerar conteúdo:", error);

    // Marcar como erro
    try {
      if (topicoIdForCatch && supabaseForCatch) {
        await supabaseForCatch
          .from("conceitos_topicos")
          .update({ 
            status: "erro", 
            tentativas: 1, 
            progresso: 0, 
            updated_at: new Date().toISOString() 
          })
          .eq("id", topicoIdForCatch);
        
        // Processar próximo da fila mesmo em caso de erro
        await processarProximoDaFila(
          supabaseForCatch, 
          Deno.env.get("SUPABASE_URL")!, 
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
      }
    } catch (catchErr) {
      console.error("[Conceitos] Erro ao processar falha:", catchErr);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Função auxiliar para processar próximo item da fila
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
      console.log("[Conceitos Fila] Nenhum item na fila para processar");
      return;
    }

    console.log(`[Conceitos Fila] Iniciando próximo da fila: ${proximo.titulo} (ID: ${proximo.id})`);

    // Usar fetch diretamente para não bloquear a resposta atual
    const functionUrl = `${supabaseUrl}/functions/v1/gerar-conteudo-conceitos`;
    
    fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ topico_id: proximo.id }),
    }).catch(err => {
      console.error("[Conceitos Fila] Erro ao iniciar próximo:", err);
    });
    
  } catch (err) {
    console.error("[Conceitos Fila] Erro ao buscar próximo da fila:", err);
  }
}
