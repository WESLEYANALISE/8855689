import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Constantes de configuração
const MIN_PAGINAS = 8;
const MAX_TENTATIVAS = 3;

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

    // Verificar se já está gerando
    if (topico.status === "gerando" && !force_restart) {
      return new Response(
        JSON.stringify({ message: "Geração já em andamento" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topico.status === "gerando" && force_restart) {
      console.log(`[Conceitos] 🔁 Force restart solicitado para topico_id=${topico_id}`);
    }

    // Marcar como gerando
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

    // Atualizar posições na fila
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

    // 1. Buscar TODO o conteúdo extraído das páginas do PDF (igual OAB)
    await updateProgress(10);
    const { data: paginas, error: paginasError } = await supabase
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
      console.log(`[Conceitos] PDF: ${paginas.length} páginas, ${conteudoPDF.length} caracteres`);
    } else {
      console.log("[Conceitos] ALERTA: Nenhuma página do PDF encontrada!");
    }

    await updateProgress(30);

    // 2. Configurar Gemini
    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
      Deno.env.get("GEMINI_KEY_3"),
    ].filter(Boolean);

    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const genAI = new GoogleGenerativeAI(geminiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 3. PROMPT para iniciantes (igual estrutura OAB)
    const prompt = `Você é um professor de Direito acolhedor e didático, especializado em ensinar INICIANTES.
Seu estilo é como uma CONVERSA COM UM AMIGO - você explica os conceitos como se estivesse ajudando alguém que está começando agora a estudar Direito.

## 🎯 SEU ESTILO DE ESCRITA OBRIGATÓRIO:

### ✅ FAÇA SEMPRE:
- Escreva como se estivesse CONVERSANDO com o estudante iniciante
- Use expressões naturais como:
  • "Olha só, você está começando a entender uma das bases do Direito..."
  • "Veja bem, isso aqui é fundamental pra sua formação..."
  • "Deixa eu te explicar de um jeito mais simples..."
- Use perguntas retóricas para engajar
- Faça analogias com situações do dia a dia
- A cada conceito importante, explique de forma simples antes de aprofundar

### ❌ NÃO FAÇA:
- Linguagem excessivamente formal/acadêmica
- Parágrafos longos e densos sem pausas
- **NUNCA USE EMOJIS NO TEXTO**

═══════════════════════════════════════════════════════════════════
⛔ REGRA ABSOLUTA: FIDELIDADE 100% AO CONTEÚDO DO PDF ⛔
═══════════════════════════════════════════════════════════════════

✅ Usar 100% do texto e informações do PDF
✅ Citar APENAS artigos/leis que aparecem LITERALMENTE no PDF
❌ INVENTAR artigos de lei que NÃO estejam no PDF
❌ ADICIONAR citações legais que você "sabe" mas NÃO estão no conteúdo

## INFORMAÇÕES DO TEMA
**Matéria:** ${materiaNome}
**Tópico:** ${topicoTitulo}

═══════════════════════════════════════════════════════════════════
📄 CONTEÚDO COMPLETO DO PDF:
═══════════════════════════════════════════════════════════════════

${conteudoPDF || "Conteúdo do PDF não disponível"}

═══════════════════════════════════════════════════════════════════
📝 SUA MISSÃO: GERAR CONTEÚDO COM EXATAMENTE 8 PÁGINAS
═══════════════════════════════════════════════════════════════════

Crie um material de estudo em formato JSON com EXATAMENTE 8 PÁGINAS:

**PÁGINA 1 - INTRODUÇÃO** (Tipo: "introducao")
**PÁGINA 2 - CONTEÚDO COMPLETO** (Tipo: "conteudo_principal") - Mínimo 3000 palavras
**PÁGINA 3 - DESMEMBRANDO** (Tipo: "desmembrando")
**PÁGINA 4 - ENTENDENDO NA PRÁTICA** (Tipo: "entendendo_na_pratica")
**PÁGINA 5 - QUADRO COMPARATIVO** (Tipo: "quadro_comparativo")
**PÁGINA 6 - DICAS PARA MEMORIZAR** (Tipo: "dicas_provas")
**PÁGINA 7 - LIGAR TERMOS** (Tipo: "correspondencias")
**PÁGINA 8 - SÍNTESE FINAL** (Tipo: "sintese_final")

### FORMATO DE RESPOSTA (JSON OBRIGATÓRIO):

\`\`\`json
{
  "paginas": [
    {"titulo": "Introdução: ${topicoTitulo}", "tipo": "introducao", "markdown": "..."},
    {"titulo": "Conteúdo Completo: ${topicoTitulo}", "tipo": "conteudo_principal", "markdown": "..."},
    {"titulo": "Desmembrando o Tema", "tipo": "desmembrando", "markdown": "..."},
    {"titulo": "Entendendo na Prática", "tipo": "entendendo_na_pratica", "markdown": "..."},
    {"titulo": "Quadro Comparativo", "tipo": "quadro_comparativo", "markdown": "..."},
    {"titulo": "Dicas para Memorizar", "tipo": "dicas_provas", "markdown": "..."},
    {"titulo": "Ligar Termos", "tipo": "correspondencias", "markdown": "# Exercício: Ligar Termos\\n\\nConecte cada termo à sua definição correta."},
    {"titulo": "Síntese Final", "tipo": "sintese_final", "markdown": "..."}
  ],
  "correspondencias": [
    {"termo": "Termo do PDF", "definicao": "Definição correspondente"}
  ],
  "exemplos": [
    {"titulo": "Título do caso", "situacao": "Descrição", "analise": "Análise", "conclusao": "Conclusão"}
  ],
  "termos": [
    {"termo": "Termo do PDF", "definicao": "Definição conforme o PDF"}
  ],
  "flashcards": [
    {"frente": "Pergunta baseada no PDF", "verso": "Resposta do PDF", "exemplo": "Exemplo prático"}
  ],
  "questoes": [
    {"pergunta": "Enunciado", "alternativas": ["A)", "B)", "C)", "D)"], "correta": 0, "explicacao": "Explicação"}
  ]
}
\`\`\`

### QUANTIDADES OBRIGATÓRIAS:
- Páginas: EXATAMENTE 8 páginas
- Correspondências: Mínimo 8 pares termo/definição
- Exemplos: Mínimo 5 casos práticos
- Termos: Mínimo 10 termos jurídicos
- Flashcards: Mínimo 15 flashcards
- Questões: Mínimo 8 questões

Retorne APENAS o JSON válido, sem texto adicional`;

    // 4. Função auxiliar para gerar e continuar se truncado (igual OAB)
    async function gerarComContinuacao(promptInicial: string, maxTentativas = 3): Promise<string> {
      let textoCompleto = "";
      let tentativas = 0;
      let promptAtual = promptInicial;
      
      while (tentativas < maxTentativas) {
        tentativas++;
        console.log(`[Conceitos] Chamando Gemini (tentativa ${tentativas})...`);
        
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: promptAtual }] }],
          generationConfig: {
            maxOutputTokens: 65000,
            temperature: 0.6,
          },
        });
        
        const responseText = result.response.text();
        textoCompleto += responseText;
        console.log(`[Conceitos] Resposta ${tentativas}: ${responseText.length} chars`);
        
        const temFechamento = textoCompleto.includes('"questoes"') && 
                              textoCompleto.trim().endsWith("}") ||
                              textoCompleto.includes("```") && textoCompleto.lastIndexOf("```") > textoCompleto.lastIndexOf("```json");
        
        const pareceTruncado = !temFechamento && (
          responseText.trim().endsWith(",") ||
          responseText.trim().endsWith('"') ||
          responseText.trim().endsWith("[") ||
          responseText.trim().endsWith("{") ||
          !responseText.includes("questoes")
        );
        
        if (!pareceTruncado) {
          console.log(`[Conceitos] Resposta completa após ${tentativas} tentativa(s)`);
          break;
        }
        
        console.log(`[Conceitos] Resposta truncada, solicitando continuação...`);
        
        const ultimasLinhas = responseText.slice(-500);
        promptAtual = `CONTINUE exatamente de onde parou. A resposta anterior terminou com:

"""
${ultimasLinhas}
"""

Continue gerando o JSON a partir deste ponto. NÃO repita o que já foi gerado. 
Complete TODAS as seções que faltam.
Termine com o fechamento correto do JSON.`;
      }
      
      return textoCompleto;
    }

    // Gerar conteúdo
    await updateProgress(50);
    const responseText = await gerarComContinuacao(prompt);
    await updateProgress(70);
    console.log(`[Conceitos] Resposta final: ${responseText.length} chars`);
    
    // Extrair JSON da resposta - NOVA LÓGICA CORRIGIDA
    let jsonStr = responseText;
    
    // 1. Remover markdown fences
    jsonStr = jsonStr.replace(/```json\s*/g, "");
    jsonStr = jsonStr.replace(/```\s*/g, "");
    
    // 2. Encontrar o objeto JSON principal usando regex
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    } else {
      // Fallback: tentar encontrar por índices
      const jsonStart = jsonStr.indexOf("{");
      const jsonEnd = jsonStr.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
      }
    }
    
    // 3. Remover APENAS caracteres de controle inválidos (NÃO \n, \r, \t que são válidos)
    const sanitized = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    
    console.log(`[Conceitos] JSON extraído: ${sanitized.length} chars`);
    
    // Parse JSON com múltiplas estratégias
    let conteudoGerado;
    try {
      conteudoGerado = JSON.parse(sanitized);
      console.log("[Conceitos] Parse JSON bem-sucedido na primeira tentativa");
    } catch (parseError) {
      console.log("[Conceitos] Erro no parse inicial, tentando corrigir...");
      
      try {
        // Tentar corrigir trailing commas
        const fixed = sanitized.replace(/,\s*([}\]])/g, "$1");
        conteudoGerado = JSON.parse(fixed);
        console.log("[Conceitos] Parse JSON bem-sucedido após remover trailing commas");
      } catch (secondError) {
        console.log("[Conceitos] Tentando balancear chaves/colchetes...");
        
        let jsonCorrigido = sanitized.replace(/,\s*([}\]])/g, "$1");
        
        // Balancear chaves e colchetes
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
        
        try {
          conteudoGerado = JSON.parse(jsonCorrigido);
          console.log("[Conceitos] Parse JSON bem-sucedido após balanceamento");
        } catch (finalError) {
          console.error("[Conceitos] Falha definitiva no parse JSON:", finalError);
          console.error("[Conceitos] Primeiros 500 chars:", sanitized.slice(0, 500));
          console.error("[Conceitos] Últimos 500 chars:", sanitized.slice(-500));
          await supabase.from("conceitos_topicos")
            .update({ status: "erro", progresso: 0 })
            .eq("id", topico_id);
          throw new Error("Falha ao processar resposta da IA");
        }
      }
    }

    // 5. Processar conteúdo das páginas
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

    // Validação de páginas (igual OAB)
    if (numPaginas < MIN_PAGINAS) {
      console.log(`[Conceitos Fila] ⚠️ Apenas ${numPaginas} páginas (mínimo: ${MIN_PAGINAS})`);
      
      const novasTentativas = tentativasAtuais + 1;
      
      if (novasTentativas >= MAX_TENTATIVAS) {
        console.log(`[Conceitos Fila] ❌ Máximo de tentativas atingido`);
        await supabase.from("conceitos_topicos")
          .update({ status: "erro", tentativas: novasTentativas, progresso: 0 })
          .eq("id", topico_id);
        
        await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
        
        return new Response(
          JSON.stringify({ error: `Falha após ${MAX_TENTATIVAS} tentativas`, tentativas: novasTentativas }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const { data: maxPosicao } = await supabase
        .from("conceitos_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      await supabase.from("conceitos_topicos")
        .update({ 
          status: "na_fila", 
          posicao_fila: novaPosicao,
          tentativas: novasTentativas,
          conteudo_gerado: null,
          progresso: 0
        })
        .eq("id", topico_id);
      
      await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
      
      return new Response(
        JSON.stringify({ requeued: true, position: novaPosicao, tentativas: novasTentativas + 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. VALIDAR correspondências (igual OAB)
    await updateProgress(85);
    let correspondenciasValidas = conteudoGerado.correspondencias || [];
    
    if (!Array.isArray(correspondenciasValidas) || correspondenciasValidas.length < 8) {
      if (conteudoGerado.termos && Array.isArray(conteudoGerado.termos) && conteudoGerado.termos.length >= 8) {
        correspondenciasValidas = conteudoGerado.termos.slice(0, 10).map((t: any) => ({
          termo: t.termo || t.nome || t,
          definicao: t.definicao?.substring(0, 60) || t.descricao?.substring(0, 60) || "Conceito jurídico"
        }));
      }
    }
    
    correspondenciasValidas = correspondenciasValidas
      .filter((c: any) => c && c.termo && c.definicao)
      .slice(0, 10)
      .map((c: any) => ({
        termo: String(c.termo).trim().substring(0, 50),
        definicao: String(c.definicao).trim().substring(0, 80)
      }));
    
    console.log(`[Conceitos] Correspondências finais: ${correspondenciasValidas.length} pares válidos`);
    
    if (correspondenciasValidas.length < 6) {
      console.error(`[Conceitos] ❌ Correspondências insuficientes`);
      await supabase.from("conceitos_topicos")
        .update({ status: "erro", progresso: 80 })
        .eq("id", topico_id);
      throw new Error(`Correspondências insuficientes (${correspondenciasValidas.length}/6)`);
    }
    
    const termosComCorrespondencias = {
      glossario: conteudoGerado.termos || [],
      correspondencias: correspondenciasValidas
    };
    
    // Salvar no banco
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

    // Processar próximo da fila
    await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conteúdo gerado com sucesso - 8 páginas",
        topico_id,
        titulo: topicoTitulo,
        paginas: numPaginas,
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

    try {
      if (topicoIdForCatch) {
        const supabase = supabaseForCatch || createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        await supabase
          .from("conceitos_topicos")
          .update({ status: "erro", progresso: 0, updated_at: new Date().toISOString() })
          .eq("id", topicoIdForCatch);

        await processarProximoDaFila(supabase, Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      }
    } catch (catchErr) {
      console.error("[Conceitos] Erro ao processar fallback:", catchErr);
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
