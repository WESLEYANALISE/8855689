import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constantes de configuração
const MIN_PAGINAS = 8;
const MAX_TENTATIVAS = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Guardar referências para o catch (req.json só pode ser lido 1x)
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
      .from("oab_trilhas_topicos")
      .select("id, titulo")
      .eq("status", "gerando")
      .neq("id", topico_id)
      .limit(1);

    if (!checkError && gerandoAtivo && gerandoAtivo.length > 0) {
      console.log(`[OAB Fila] Geração ativa detectada: ${gerandoAtivo[0].titulo} (ID: ${gerandoAtivo[0].id})`);
      
      // Calcular próxima posição na fila
      const { data: maxPosicao } = await supabase
        .from("oab_trilhas_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      // Verificar se já está na fila
      const { data: jaEnfileirado } = await supabase
        .from("oab_trilhas_topicos")
        .select("posicao_fila, status")
        .eq("id", topico_id)
        .single();
      
      if (jaEnfileirado?.status === "na_fila") {
        // Já está na fila, retornar posição atual
        const { count: totalFila } = await supabase
          .from("oab_trilhas_topicos")
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
        .from("oab_trilhas_topicos")
        .update({ 
          status: "na_fila", 
          posicao_fila: novaPosicao,
          updated_at: new Date().toISOString() 
        })
        .eq("id", topico_id);
      
      // Contar total na fila
      const { count: totalFila } = await supabase
        .from("oab_trilhas_topicos")
        .select("id", { count: "exact", head: true })
        .eq("status", "na_fila");
      
      console.log(`[OAB Fila] Tópico ${topico_id} adicionado na posição ${novaPosicao} (total: ${totalFila})`);
      
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
      .from("oab_trilhas_topicos")
      .select(`
        *,
        materia:oab_trilhas_materias(id, nome)
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
      console.log(`[OAB Trilhas] 🔁 Force restart solicitado para topico_id=${topico_id}`);
    }

    // Marcar como gerando com progresso inicial, limpar posição da fila
    const posicaoRemovida = topico.posicao_fila;
    
    await supabase
      .from("oab_trilhas_topicos")
      .update({ 
        status: "gerando", 
        progresso: 5,
        posicao_fila: null,
        updated_at: new Date().toISOString() 
      })
      .eq("id", topico_id);

    // Atualizar posições na fila (decrementar todos acima da posição removida)
    if (posicaoRemovida) {
      // Buscar todos na fila com posição maior e atualizar
      const { data: filaParaAtualizar } = await supabase
        .from("oab_trilhas_topicos")
        .select("id, posicao_fila")
        .eq("status", "na_fila")
        .gt("posicao_fila", posicaoRemovida);
      
      if (filaParaAtualizar && filaParaAtualizar.length > 0) {
        for (const item of filaParaAtualizar) {
          await supabase
            .from("oab_trilhas_topicos")
            .update({ posicao_fila: (item.posicao_fila || 1) - 1 })
            .eq("id", item.id);
        }
        console.log(`[OAB Fila] Posições atualizadas: ${filaParaAtualizar.length} itens`);
      }
    }

    // Função auxiliar para atualizar progresso
    const updateProgress = async (value: number) => {
      await supabase
        .from("oab_trilhas_topicos")
        .update({ progresso: value })
        .eq("id", topico_id);
    };

    const areaNome = topico.materia?.nome || "";
    const topicoTitulo = topico.titulo;
    const tentativasAtuais = topico.tentativas || 0;

    console.log(`[OAB Trilhas] Gerando conteúdo para: ${areaNome} - ${topicoTitulo} (tentativa ${tentativasAtuais + 1})`);

    // 1. Buscar TODO o conteúdo extraído das páginas do PDF
    await updateProgress(10);
    const { data: paginas, error: paginasError } = await supabase
      .from("oab_trilhas_topico_paginas")
      .select("pagina, conteudo")
      .eq("topico_id", topico_id)
      .order("pagina", { ascending: true });

    let conteudoPDF = "";
    if (paginas && paginas.length > 0) {
      conteudoPDF = paginas
        .filter(p => p.conteudo && p.conteudo.trim().length > 0)
        .map(p => `\n--- PÁGINA ${p.pagina} ---\n${p.conteudo}`)
        .join("\n\n");
      console.log(`[OAB Trilhas] PDF: ${paginas.length} páginas, ${conteudoPDF.length} caracteres`);
    } else {
      console.log("[OAB Trilhas] ALERTA: Nenhuma página do PDF encontrada!");
    }

    await updateProgress(20);

    // 2. Buscar contexto adicional do RESUMO se existir
    let conteudoResumo = "";
    const { data: resumos } = await supabase
      .from("RESUMO")
      .select("conteudo, subtema")
      .eq("area", areaNome)
      .eq("tema", topicoTitulo)
      .order("\"ordem subtema\"", { ascending: true })
      .limit(15);

    if (resumos && resumos.length > 0) {
      conteudoResumo = resumos.map(r => {
        const sub = r.subtema ? `### ${r.subtema}\n` : "";
        return sub + (r.conteudo || "");
      }).join("\n\n");
      console.log(`[OAB Trilhas] RESUMO: ${resumos.length} subtemas`);
    }

    await updateProgress(30);

    // 3. Buscar contexto da Base de Conhecimento OAB
    let contextoBase = "";
    try {
      const { data: contextData } = await supabase.functions.invoke("buscar-contexto-base-oab", {
        body: { area: areaNome, topico: topicoTitulo, maxTokens: 5000 }
      });
      
      if (contextData?.contexto) {
        contextoBase = contextData.contexto;
        console.log(`[OAB Trilhas] Base OAB: ${contextData.tokensUsados} tokens`);
      }
    } catch (e) {
      console.log("[OAB Trilhas] Base de conhecimento não disponível");
    }

    await updateProgress(40);

    // 4. Configurar Gemini
    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
      Deno.env.get("GEMINI_KEY_3"),
    ].filter(Boolean);

    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const genAI = new GoogleGenerativeAI(geminiKey!);
    // Usando gemini-2.5-flash-lite para geração de conteúdo OAB (mais rápido e econômico)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // 5. NOVO PROMPT - 8 páginas SEM cronologia + Ligar Termos como última página + ESTILO CONVERSACIONAL
    const prompt = `Você é um professor de Direito descontraído, didático e apaixonado por ensinar.
Seu estilo é como uma CONVERSA COM UM AMIGO - você explica os conceitos como se estivesse tomando um café e ajudando um colega a entender a matéria para a OAB.

## 🎯 SEU ESTILO DE ESCRITA OBRIGATÓRIO:

### ✅ FAÇA SEMPRE:
- Escreva como se estivesse CONVERSANDO com o estudante
- Use expressões naturais como:
  • "Olha só, é assim que funciona..."
  • "Veja bem, isso é super importante porque..."
  • "Sabe aquela situação de...? Pois é, aqui se aplica isso!"
  • "Deixa eu te explicar de outro jeito..."
  • "Percebeu a diferença? Esse é o pulo do gato!"
  • "Agora vem a parte interessante..."
  • "Calma, não se assuste, é mais simples do que parece..."
  • "Resumindo pra você não esquecer..."
- Use perguntas retóricas para engajar ("E por que isso importa tanto pra prova?")
- Faça analogias com situações do dia a dia
- Antecipe dúvidas ("Você pode estar pensando: mas e se...? A resposta é...")
- Conecte os tópicos com transições naturais ("Agora que você já entendeu X, vamos ver Y...")
- A cada conceito importante, dê uma pausa e explique de forma simples antes de aprofundar
- Após conceitos complexos, faça um breve resumo informal ("Então, resumindo: ...")

### ❌ NÃO FAÇA:
- Linguagem excessivamente formal/acadêmica
- Parágrafos longos e densos sem pausas ou interações
- Explicações secas e diretas demais
- Texto que pareça copiado de um livro jurídico
- Começar frases com "É importante ressaltar que..." ou "Cumpre observar que..."
- **NUNCA USE EMOJIS NO TEXTO** (proibido qualquer emoji como 😊, 🎯, 📚, ⚖️, etc.)

═══════════════════════════════════════════════════════════════════
⛔⛔⛔ REGRA ABSOLUTA: FIDELIDADE 100% AO CONTEÚDO DO PDF ⛔⛔⛔
═══════════════════════════════════════════════════════════════════

O CONTEÚDO ABAIXO FOI EXTRAÍDO DE UM PDF OFICIAL. VOCÊ DEVE:
✅ Usar 100% do texto e informações do PDF
✅ Citar APENAS artigos/leis que aparecem LITERALMENTE no PDF
✅ Explicar cada conceito presente no material de forma didática E CONVERSACIONAL
✅ NÃO pular nenhum tópico ou seção do PDF

VOCÊ NÃO PODE:
❌ INVENTAR artigos de lei que NÃO estejam no PDF
❌ ADICIONAR citações legais que você "sabe" mas NÃO estão no conteúdo
❌ CRIAR jurisprudência, números de processos ou decisões não presentes
❌ OMITIR informações importantes do PDF

## INFORMAÇÕES DO TEMA
**Área:** ${areaNome}
**Tópico:** ${topicoTitulo}

═══════════════════════════════════════════════════════════════════
📄 CONTEÚDO COMPLETO DO PDF (USE 100% DESTE MATERIAL):
═══════════════════════════════════════════════════════════════════

${conteudoPDF || "Conteúdo do PDF não disponível"}

${conteudoResumo ? `
═══════════════════════════════════════════════════════════════════
📚 SUBTEMAS JÁ IDENTIFICADOS:
═══════════════════════════════════════════════════════════════════

${conteudoResumo}
` : ""}

${contextoBase ? `
═══════════════════════════════════════════════════════════════════
📖 CONTEXTO ADICIONAL DA BASE OAB:
═══════════════════════════════════════════════════════════════════

${contextoBase}
` : ""}

═══════════════════════════════════════════════════════════════════
📝 SUA MISSÃO: GERAR CONTEÚDO COM EXATAMENTE 8 PÁGINAS
═══════════════════════════════════════════════════════════════════

Crie um material de estudo em formato JSON com EXATAMENTE 8 PÁGINAS:

### ESTRUTURA OBRIGATÓRIA (8 PÁGINAS):

**PÁGINA 1 - INTRODUÇÃO** (Tom: acolhedor e motivador)
- Tipo: "introducao"
- Comece com algo engajador: "Vamos falar sobre um tema super importante pra sua prova..."
- Visão geral do tema em 300-500 palavras
- Contextualize a importância para a OAB de forma natural
- "Ao final dessa trilha, você vai dominar..."

**PÁGINA 2 - CONTEÚDO COMPLETO** (Tom: professor explicando, conversando)
- Tipo: "conteudo_principal"
- Explique TODO o tema usando 100% do conteúdo do PDF
- Organize com subtítulos claros (##, ###)
- Use tom CONVERSACIONAL: "Vamos lá!", "Entendeu a lógica?", "Aqui vem o pulo do gato..."
- A cada novo conceito, faça uma pequena introdução conversacional antes de explicar
- Após conceitos importantes, faça um breve resumo informal ("Resumindo: ...")
- Antecipe dúvidas do estudante e responda de forma natural
- Inclua todos os conceitos, definições, classificações
- Cite os artigos de lei EXATAMENTE como aparecem no PDF
- Mínimo 3000 palavras - cubra TUDO do PDF

**PÁGINA 3 - DESMEMBRANDO** (Tom: "Agora deixa eu destrinchar isso pra você...")
- Tipo: "desmembrando"
- Análise detalhada de cada elemento importante
- Decomponha conceitos complexos em partes menores
- "Olha, isso parece complicado, mas vou te mostrar passo a passo..."
- Use exemplos para clarificar

**PÁGINA 4 - ENTENDENDO NA PRÁTICA** (Tom: "Imagina a seguinte situação...")
- Tipo: "entendendo_na_pratica"
- Casos práticos baseados no conteúdo
- "Vou te dar um exemplo bem concreto..."
- Situações reais de aplicação
- Como resolver questões na prova

**PÁGINA 5 - QUADRO COMPARATIVO**
- Tipo: "quadro_comparativo"
- Crie tabelas comparativas dos principais institutos
- Compare elementos, requisitos, efeitos
- Use formato Markdown de tabela

**PÁGINA 6 - DICAS PARA MEMORIZAR** (Tom: "Olha esse truque que vai salvar sua vida na prova...")
- Tipo: "dicas_provas"
- Técnicas de memorização (mnemônicos, associações)
- "Quer uma dica? Pensa assim..."
- Pegadinhas comuns nas provas
- Pontos mais cobrados na OAB

**PÁGINA 7 - LIGAR TERMOS (EXERCÍCIO INTERATIVO)**
- Tipo: "correspondencias"
- NÃO é conteúdo markdown normal!
- Será um jogo de arrastar e conectar termos às definições
- O conteúdo deve ser simples: apenas uma introdução breve
- Os dados reais do jogo vão no campo "correspondencias" separado

**PÁGINA 8 - SÍNTESE FINAL** (Tom: "Então, recapitulando tudo que vimos...")
- Tipo: "sintese_final"
- Resumo de todos os pontos-chave
- "Vamos revisar rapidinho..."
- Checklist do que estudar
- Esquema visual usando Markdown

### FORMATO DE RESPOSTA (JSON OBRIGATÓRIO):

\`\`\`json
{
  "paginas": [
    {
      "titulo": "Introdução: ${topicoTitulo}",
      "tipo": "introducao",
      "markdown": "# Introdução\\n\\n[Visão geral do tema - TOM CONVERSACIONAL]"
    },
    {
      "titulo": "Conteúdo Completo: ${topicoTitulo}",
      "tipo": "conteudo_principal",
      "markdown": "# ${topicoTitulo}\\n\\n[TODO o conteúdo do PDF explicado de forma CONVERSACIONAL em 3000+ palavras]"
    },
    {
      "titulo": "Desmembrando o Tema",
      "tipo": "desmembrando",
      "markdown": "# Desmembrando\\n\\n[Análise detalhada com tom de conversa]"
    },
    {
      "titulo": "Entendendo na Prática",
      "tipo": "entendendo_na_pratica",
      "markdown": "# Entendendo na Prática\\n\\n[Casos práticos]"
    },
    {
      "titulo": "Quadro Comparativo",
      "tipo": "quadro_comparativo",
      "markdown": "# Quadro Comparativo\\n\\n[Tabelas comparativas]"
    },
    {
      "titulo": "Dicas para Memorizar",
      "tipo": "dicas_provas",
      "markdown": "# Dicas para Memorizar\\n\\n[Técnicas e pegadinhas com linguagem amigável]"
    },
    {
      "titulo": "Ligar Termos",
      "tipo": "correspondencias",
      "markdown": "# Exercício: Ligar Termos\\n\\nConecte cada termo à sua definição correta arrastando os elementos."
    },
    {
      "titulo": "Síntese Final",
      "tipo": "sintese_final",
      "markdown": "# Síntese Final\\n\\n[Resumo e checklist com tom de conclusão amigável]"
    }
  ],
  "correspondencias": [
    {
      "termo": "Nome do termo/conceito do PDF",
      "definicao": "Definição correspondente do PDF"
    },
    {
      "termo": "Outro termo",
      "definicao": "Outra definição"
    }
  ],
  "exemplos": [
    {
      "titulo": "Título do caso",
      "situacao": "Descrição do caso prático",
      "analise": "Análise jurídica",
      "conclusao": "Conclusão"
    }
  ],
  "termos": [
    {
      "termo": "Termo do PDF",
      "definicao": "Definição conforme o PDF"
    }
  ],
  "flashcards": [
    {
      "frente": "Pergunta baseada no PDF",
      "verso": "Resposta do PDF",
      "exemplo": "Exemplo prático"
    }
  ],
  "questoes": [
    {
      "pergunta": "Enunciado estilo OAB",
      "alternativas": ["A)", "B)", "C)", "D)"],
      "correta": 0,
      "explicacao": "Explicação"
    }
  ]
}
\`\`\`

### QUANTIDADES OBRIGATÓRIAS:
- Páginas: EXATAMENTE 8 páginas (estrutura acima)
- Página 2 (Conteúdo): Mínimo 3000 palavras
- Correspondências: Mínimo 8 pares termo/definição para o jogo
- Exemplos: Mínimo 5 casos práticos
- Termos: Mínimo 10 termos jurídicos
- Flashcards: Mínimo 15 flashcards
- Questões: Mínimo 8 questões estilo OAB

IMPORTANTE: 
- Use ABSOLUTAMENTE TODO o conteúdo do PDF
- NÃO invente artigos ou citações legais
- MANTENHA O TOM CONVERSACIONAL em todas as páginas - como se estivesse explicando para um amigo
- O campo "correspondencias" é SEPARADO das páginas - são os dados para o jogo interativo
- Retorne APENAS o JSON válido, sem texto adicional`;

    // 6. Função auxiliar para gerar e continuar se truncado
    async function gerarComContinuacao(promptInicial: string, maxTentativas = 3): Promise<string> {
      let textoCompleto = "";
      let tentativas = 0;
      let promptAtual = promptInicial;
      
      while (tentativas < maxTentativas) {
        tentativas++;
        console.log(`[OAB Trilhas] Chamando Gemini (tentativa ${tentativas})...`);
        
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: promptAtual }] }],
          generationConfig: {
            maxOutputTokens: 65000,
            temperature: 0.6,
          },
        });
        
        const responseText = result.response.text();
        textoCompleto += responseText;
        console.log(`[OAB Trilhas] Resposta ${tentativas}: ${responseText.length} chars`);
        
        // Verificar se a resposta está completa (tem o fechamento do JSON)
        const temFechamento = textoCompleto.includes('"questoes"') && 
                              textoCompleto.trim().endsWith("}") ||
                              textoCompleto.includes("```") && textoCompleto.lastIndexOf("```") > textoCompleto.lastIndexOf("```json");
        
        // Verificar se parece truncado no meio de uma string ou array
        const pareceTruncado = !temFechamento && (
          responseText.trim().endsWith(",") ||
          responseText.trim().endsWith('"') ||
          responseText.trim().endsWith("[") ||
          responseText.trim().endsWith("{") ||
          !responseText.includes("questoes")
        );
        
        if (!pareceTruncado) {
          console.log(`[OAB Trilhas] Resposta completa após ${tentativas} tentativa(s)`);
          break;
        }
        
        console.log(`[OAB Trilhas] Resposta truncada, solicitando continuação...`);
        
        // Preparar prompt de continuação com contexto
        const ultimasLinhas = responseText.slice(-500);
        promptAtual = `CONTINUE exatamente de onde parou. A resposta anterior terminou com:

"""
${ultimasLinhas}
"""

Continue gerando o JSON a partir deste ponto. NÃO repita o que já foi gerado. 
Mantenha a mesma estrutura e formato JSON.
Complete TODAS as seções que faltam: correspondencias, exemplos, termos, flashcards, questoes.
Termine com o fechamento correto do JSON.`;
      }
      
      return textoCompleto;
    }

    // Gerar conteúdo com lógica de continuação
    await updateProgress(50);
    const responseText = await gerarComContinuacao(prompt);
    await updateProgress(70);
    console.log(`[OAB Trilhas] Resposta final: ${responseText.length} chars`);
    
    // Extrair JSON da resposta (pode estar em múltiplas partes)
    let jsonStr = responseText;
    
    // Remover marcadores de código duplicados se houver
    jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "");
    
    // Encontrar o JSON principal
    const jsonStart = jsonStr.indexOf("{");
    const jsonEnd = jsonStr.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
    }
    
    // Tentar corrigir JSON truncado se necessário
    let conteudoGerado;
    try {
      // Sanitizar caracteres de controle antes do parse
      const sanitizedJson = jsonStr.replace(/[\x00-\x1F\x7F]/g, (char) => {
        if (char === '\n') return '\\n';
        if (char === '\r') return '\\r';
        if (char === '\t') return '\\t';
        return ''; // Remove outros caracteres de controle
      });
      conteudoGerado = JSON.parse(sanitizedJson);
    } catch (parseError) {
      console.log("[OAB Trilhas] Erro no parse, tentando corrigir JSON...");
      
      // Sanitizar caracteres de controle
      let jsonCorrigido = jsonStr.replace(/[\x00-\x1F\x7F]/g, (char) => {
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
      
      // Adicionar fechamentos faltantes
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
        console.log("[OAB Trilhas] JSON corrigido com sucesso");
      } catch (finalError) {
        console.error("[OAB Trilhas] Falha definitiva no parse JSON:", finalError);
        // Marcar como erro para tentar novamente depois
        await supabase.from("oab_trilhas_topicos")
          .update({ status: "erro", progresso: 0 })
          .eq("id", topico_id);
        throw new Error("Falha ao processar resposta da IA");
      }
    }

    // 7. Processar o conteúdo das páginas
    let conteudoPrincipal = "";
    const numPaginas = conteudoGerado.paginas?.length || 0;
    
    if (conteudoGerado.paginas && Array.isArray(conteudoGerado.paginas)) {
      // Concatenar todas as páginas em um único markdown com separadores
      conteudoPrincipal = conteudoGerado.paginas
        .map((p: any, i: number) => {
          const separador = i > 0 ? "\n\n---\n\n" : "";
          return `${separador}${p.markdown || ""}`;
        })
        .join("");
      
      console.log(`[OAB Trilhas] ${numPaginas} páginas geradas`);
    } else {
      // Fallback para formato antigo
      conteudoPrincipal = conteudoGerado.conteudo || "";
    }

    // ============================================
    // VALIDAÇÃO DE PÁGINAS E REPROCESSAMENTO AUTOMÁTICO
    // ============================================
    if (numPaginas < MIN_PAGINAS) {
      console.log(`[OAB Fila] ⚠️ Apenas ${numPaginas} páginas (mínimo: ${MIN_PAGINAS})`);
      
      const novasTentativas = tentativasAtuais + 1;
      
      if (novasTentativas >= MAX_TENTATIVAS) {
        console.log(`[OAB Fila] ❌ Máximo de tentativas (${MAX_TENTATIVAS}) atingido, marcando como erro`);
        await supabase.from("oab_trilhas_topicos")
          .update({ 
            status: "erro", 
            tentativas: novasTentativas,
            progresso: 0 
          })
          .eq("id", topico_id);
        
        // Processar próximo da fila
        await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
        
        return new Response(
          JSON.stringify({ 
            error: `Falha após ${MAX_TENTATIVAS} tentativas (${numPaginas}/${MIN_PAGINAS} páginas)`,
            tentativas: novasTentativas
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Calcular próxima posição na fila
      const { data: maxPosicao } = await supabase
        .from("oab_trilhas_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      console.log(`[OAB Fila] Recolocando na fila: posição ${novaPosicao}, tentativa ${novasTentativas + 1}`);
      
      // Limpar conteúdo e recolocar no final da fila
      await supabase.from("oab_trilhas_topicos")
        .update({ 
          status: "na_fila", 
          posicao_fila: novaPosicao,
          tentativas: novasTentativas,
          conteudo_gerado: null,
          progresso: 0
        })
        .eq("id", topico_id);
      
      // Processar próximo da fila
      await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
      
      return new Response(
        JSON.stringify({ 
          requeued: true,
          reason: `${numPaginas}/${MIN_PAGINAS} páginas`,
          position: novaPosicao,
          tentativas: novasTentativas + 1
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. VALIDAR correspondências antes de salvar - mínimo 8 pares para o jogo "Ligar Termos"
    await updateProgress(85);
    let correspondenciasValidas = conteudoGerado.correspondencias || [];
    
    // Verificar se tem correspondências suficientes
    if (!Array.isArray(correspondenciasValidas) || correspondenciasValidas.length < 8) {
      console.log(`[OAB Trilhas] ⚠️ Correspondências insuficientes (${correspondenciasValidas.length}), tentando extrair do conteúdo...`);
      
      // Tentar extrair correspondências a partir das páginas
      const paginaLigarTermos = conteudoGerado.paginas?.find((p: any) => 
        p.titulo?.toLowerCase().includes("ligar") || 
        p.tipo === "correspondencias" ||
        p.markdown?.toLowerCase().includes("ligar termos")
      );
      
      // Extrair termos do próprio conteúdo se existirem listas de termos/definições
      if (paginaLigarTermos?.dados_interativos?.pares) {
        correspondenciasValidas = paginaLigarTermos.dados_interativos.pares;
        console.log(`[OAB Trilhas] ✓ Extraídas ${correspondenciasValidas.length} correspondências da página 7`);
      } else if (conteudoGerado.termos && Array.isArray(conteudoGerado.termos) && conteudoGerado.termos.length >= 8) {
        // Converter termos do glossário em correspondências (usar descrição curta)
        correspondenciasValidas = conteudoGerado.termos.slice(0, 10).map((t: any) => ({
          termo: t.termo || t.nome || t,
          definicao: t.definicao?.substring(0, 60) || t.descricao?.substring(0, 60) || "Conceito jurídico"
        }));
        console.log(`[OAB Trilhas] ✓ Convertidos ${correspondenciasValidas.length} termos em correspondências`);
      }
    }
    
    // Validar cada par de correspondência
    correspondenciasValidas = correspondenciasValidas
      .filter((c: any) => c && c.termo && c.definicao)
      .slice(0, 10) // Máximo 10 pares
      .map((c: any) => ({
        termo: String(c.termo).trim().substring(0, 50),
        definicao: String(c.definicao).trim().substring(0, 80)
      }));
    
    console.log(`[OAB Trilhas] Correspondências finais: ${correspondenciasValidas.length} pares válidos`);
    
    // Se ainda não tiver correspondências suficientes, marcar como erro para retry
    if (correspondenciasValidas.length < 6) {
      console.error(`[OAB Trilhas] ❌ Falha: apenas ${correspondenciasValidas.length} correspondências (mínimo 6)`);
      await supabase.from("oab_trilhas_topicos")
        .update({ status: "erro", progresso: 80 })
        .eq("id", topico_id);
      throw new Error(`Correspondências insuficientes para o jogo Ligar Termos (${correspondenciasValidas.length}/6)`);
    }
    
    const termosComCorrespondencias = {
      glossario: conteudoGerado.termos || [],
      correspondencias: correspondenciasValidas
    };
    
    const { error: updateError } = await supabase
      .from("oab_trilhas_topicos")
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

    console.log(`[OAB Trilhas] ✅ Conteúdo salvo com sucesso: ${topicoTitulo}`);
    console.log(`[OAB Trilhas] Stats: ${numPaginas} páginas, ${correspondenciasValidas.length} correspondências, ${conteudoGerado.flashcards?.length || 0} flashcards`);

    // 9. NÃO gerar capa automaticamente - usar capa da matéria (area.capa_url)
    console.log("[OAB Trilhas] Capa será herdada da matéria, não gerando individual");

    // ============================================
    // PROCESSAR PRÓXIMO DA FILA
    // ============================================
    await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conteúdo gerado com sucesso - 8 páginas incluindo Ligar Termos",
        topico_id,
        titulo: topicoTitulo,
        area: areaNome,
        paginas: numPaginas,
        stats: {
          correspondencias: correspondenciasValidas.length,
          exemplos: conteudoGerado.exemplos?.length || 0,
          termos: conteudoGerado.termos?.length || 0,
          flashcards: conteudoGerado.flashcards?.length || 0,
          questoes: conteudoGerado.questoes?.length || 0,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[OAB Trilhas] ❌ Erro ao gerar conteúdo:", error);
    console.log(`[OAB Trilhas] ❌ Erro detalhado:`, {
      topico_id: topicoIdForCatch,
      erro: error.message,
      stack: error.stack?.substring(0, 500)
    });

    // Tentar fazer retry automático
    try {
      if (topicoIdForCatch) {
        const supabase = supabaseForCatch || createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Buscar tentativas atuais
        const { data: topicoAtual } = await supabase
          .from("oab_trilhas_topicos")
          .select("tentativas")
          .eq("id", topicoIdForCatch)
          .single();

        const tentativas = (topicoAtual?.tentativas || 0) + 1;
        const MAX_TENTATIVAS = 3;

        if (tentativas < MAX_TENTATIVAS) {
          // Calcular próxima posição na fila
          const { data: maxPos } = await supabase
            .from("oab_trilhas_topicos")
            .select("posicao_fila")
            .eq("status", "na_fila")
            .order("posicao_fila", { ascending: false })
            .limit(1)
            .single();

          const novaPosicao = (maxPos?.posicao_fila || 0) + 1;

          // Recolocar na fila para nova tentativa
          await supabase
            .from("oab_trilhas_topicos")
            .update({ 
              status: "na_fila", 
              posicao_fila: novaPosicao,
              tentativas,
              progresso: 0,
              conteudo_gerado: null,
              updated_at: new Date().toISOString()
            })
            .eq("id", topicoIdForCatch);

          console.log(`[OAB Fila] ♻️ Erro recuperável, recolocando na fila (tentativa ${tentativas}/${MAX_TENTATIVAS})`);
        } else {
          // Esgotou tentativas, marcar como erro definitivo
          await supabase
            .from("oab_trilhas_topicos")
            .update({ status: "erro", tentativas, progresso: 0, updated_at: new Date().toISOString() })
            .eq("id", topicoIdForCatch);

          console.log(`[OAB Fila] ❌ Erro após ${MAX_TENTATIVAS} tentativas, marcando como falha definitiva`);
        }
        
        // Processar próximo da fila mesmo em caso de erro
        await processarProximoDaFila(supabase, Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      }
    } catch (catchErr) {
      console.error("[OAB Trilhas] Erro ao processar retry:", catchErr);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Função auxiliar para processar próximo item da fila
async function processarProximoDaFila(supabase: any, supabaseUrl: string, supabaseServiceKey: string) {
  try {
    const { data: proximo, error } = await supabase
      .from("oab_trilhas_topicos")
      .select("id, titulo")
      .eq("status", "na_fila")
      .order("posicao_fila", { ascending: true })
      .limit(1)
      .single();

    if (error || !proximo) {
      console.log("[OAB Fila] Nenhum item na fila para processar");
      return;
    }

    console.log(`[OAB Fila] Iniciando próximo da fila: ${proximo.titulo} (ID: ${proximo.id})`);

    // Usar fetch diretamente para não bloquear a resposta atual
    const functionUrl = `${supabaseUrl}/functions/v1/gerar-conteudo-oab-trilhas`;
    
    fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ topico_id: proximo.id }),
    }).catch(err => {
      console.error("[OAB Fila] Erro ao iniciar próximo:", err);
    });
    
  } catch (err) {
    console.error("[OAB Fila] Erro ao buscar próximo da fila:", err);
  }
}
