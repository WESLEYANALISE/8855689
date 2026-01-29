import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
].filter(Boolean) as string[];

const GEMINI_TIMEOUT = 90000;

async function chamarGeminiComTimeout(prompt: string, maxTokens: number = 12000): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT);
  
  try {
    return await chamarGemini(prompt, maxTokens, controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function chamarGemini(prompt: string, maxTokens: number = 12000, signal?: AbortSignal): Promise<string> {
  for (let attempt = 0; attempt < GEMINI_KEYS.length * 2; attempt++) {
    const keyIndex = attempt % GEMINI_KEYS.length;
    const apiKey = GEMINI_KEYS[keyIndex];
    
    try {
      console.log(`[Gemini Ética] Tentativa ${attempt + 1}, key ${keyIndex + 1}`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: maxTokens,
            },
          }),
          signal,
        }
      );

      if (response.status === 429) {
        console.log(`[Gemini Ética] Rate limit na key ${keyIndex + 1}, tentando próxima...`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Gemini Ética] Erro ${response.status}: ${errorText}`);
        throw new Error(`Erro Gemini: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      console.log(`[Gemini Ética] Resposta recebida: ${text.length} chars`);
      return text;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`[Gemini Ética] Timeout na tentativa ${attempt + 1}`);
        throw new Error("Timeout ao chamar Gemini");
      }
      console.error(`[Gemini Ética] Erro na tentativa ${attempt + 1}:`, error);
      if (attempt === GEMINI_KEYS.length * 2 - 1) throw error;
    }
  }
  throw new Error("Todas as tentativas falharam");
}

// Função para aplicar destaque em termos técnicos de ética
function aplicarDestaqueAutomatico(conteudo: string): string {
  let resultado = conteudo;
  
  const termosEtica = [
    // Termos em Latim
    "In Dubio Pro Reo", "Erga Omnes", "Inter Partes", "Ad Hoc", "Ex Officio",
    "Pacta Sunt Servanda", "Venire Contra Factum Proprium", "Boa-fé Objetiva",
    
    // Termos específicos da Ética OAB
    "Estatuto da Advocacia", "Código de Ética e Disciplina", "Regulamento Geral",
    "Tribunal de Ética e Disciplina", "Conselho Seccional", "Conselho Federal",
    "Incompatibilidade", "Impedimento", "Sigilo Profissional", "Independência Funcional",
    "Desagravo Público", "Publicidade Advocatícia", "Honorários Advocatícios",
    "Captação de Clientela", "Mercantilização", "Sociedade de Advogados",
    "Inscrição Suplementar", "Licenciamento", "Cancelamento", "Exclusão",
    "Censura", "Suspensão", "Advertência", "Multa",
    "Prerrogativas Profissionais", "Direitos do Advogado", "Deveres do Advogado",
    "Infração Disciplinar", "Processo Disciplinar", "Representação",
    
    // Princípios éticos
    "Probidade", "Decoro", "Lealdade Processual", "Urbanidade", "Dignidade",
    "Moralidade", "Transparência", "Diligência", "Competência Técnica",
    
    // Doutrinadores/Referências
    "Paulo Lôbo", "Gisela Gondin Ramos", "Ruy de Azevedo Sodré"
  ];
  
  const termosUsados: Record<string, number> = {};
  
  for (const termo of termosEtica) {
    if (resultado.includes(`[[${termo}]]`)) {
      termosUsados[termo.toLowerCase()] = 3;
      continue;
    }
    
    const regex = new RegExp(`(?<!\\[\\[)\\b(${termo})\\b(?!\\]\\])`, 'gi');
    
    resultado = resultado.replace(regex, (match) => {
      const termoLower = termo.toLowerCase();
      termosUsados[termoLower] = (termosUsados[termoLower] || 0) + 1;
      
      if (termosUsados[termoLower] <= 2) {
        return `[[${match}]]`;
      }
      return match;
    });
  }
  
  return resultado;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let topico_id: number | null = null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    topico_id = body.topico_id;
    
    if (!topico_id) {
      return new Response(
        JSON.stringify({ error: "topico_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`========== [ÉTICA OAB] INICIANDO GERAÇÃO TÓPICO ${topico_id} ==========`);

    // Buscar tópico com dados do tema
    const { data: topico, error: topicoError } = await supabase
      .from("oab_etica_topicos")
      .select(`
        *,
        tema:oab_etica_temas(*)
      `)
      .eq("id", topico_id)
      .single();

    if (topicoError || !topico) {
      console.error(`Tópico ${topico_id} não encontrado:`, topicoError);
      return new Response(
        JSON.stringify({ error: "Tópico não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se já está concluído, retornar
    if (topico.status === "concluido" && topico.conteudo_gerado) {
      console.log(`Tópico ${topico_id} já está concluído`);
      return new Response(
        JSON.stringify({ success: true, message: "Conteúdo já existe", status: "concluido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Marcar como gerando
    console.log(`Marcando tópico ${topico_id} como gerando`);
    await supabase
      .from("oab_etica_topicos")
      .update({ status: "gerando", updated_at: new Date().toISOString() })
      .eq("id", topico_id);

    const tema = topico.tema;
    const tituloCompleto = topico.titulo;

    console.log(`Processando: "${tituloCompleto}" (Tema: ${tema?.titulo})`);
    
    // Buscar conteúdo do PDF das páginas relevantes
    const paginaInicial = topico.pagina_inicial || tema?.pagina_inicial || 1;
    const paginaFinal = topico.pagina_final || tema?.pagina_final || paginaInicial + 5;
    
    const { data: paginas } = await supabase
      .from("oab_etica_paginas")
      .select("pagina, conteudo")
      .gte("pagina", paginaInicial)
      .lte("pagina", paginaFinal)
      .order("pagina");
    
    const conteudoPdf = paginas?.map(p => p.conteudo).join("\n\n") || "";
    
    console.log(`Conteúdo do PDF: ${conteudoPdf.length} chars (páginas ${paginaInicial}-${paginaFinal})`);

    // ===== GERAR CONTEÚDO PRINCIPAL =====
    const promptConteudo = `Você é um professor especializado em Ética Profissional da OAB, preparando alunos para o Exame de Ordem.

TEMA GERAL: ${tema?.titulo || "Ética Profissional"}
TÓPICO ESPECÍFICO: ${tituloCompleto}

CONTEÚDO EXTRAÍDO DO MATERIAL DIDÁTICO (use como base OBRIGATÓRIA):
"""
${conteudoPdf.substring(0, 15000)}
"""

INSTRUÇÕES DE FORMATAÇÃO:
1. Crie um conteúdo didático COMPLETO sobre "${tituloCompleto}"
2. Use SOMENTE informações do material fornecido - NÃO invente dados
3. Formate em Markdown com:
   - Títulos ## e ###
   - Listas organizadas
   - **Negritos** para conceitos-chave
   - Citações > para artigos de lei
   
4. OBRIGATÓRIO incluir seções:
   - ## Conceito e Fundamento
   - ## Previsão Legal (cite artigos do Estatuto/Código de Ética)
   - ## Aplicação Prática
   - ## CASO PRÁTICO (exemplo realista de situação na advocacia)
   - ## DICA DE PROVA (o que a FGV mais cobra sobre este tema)
   - ## Síntese Final

5. Use linguagem clara mas técnica
6. Destaque termos importantes com [[termo]] para o glossário

Gere o conteúdo completo:`;

    const conteudoGerado = await chamarGeminiComTimeout(promptConteudo, 8000);
    const conteudoComDestaques = aplicarDestaqueAutomatico(conteudoGerado);
    
    console.log(`Conteúdo gerado: ${conteudoComDestaques.length} chars`);

    // ===== GERAR FLASHCARDS E QUESTÕES =====
    const promptEstudo = `Com base no seguinte conteúdo sobre Ética Profissional OAB:

TÓPICO: ${tituloCompleto}

CONTEÚDO:
${conteudoComDestaques.substring(0, 6000)}

Gere um JSON com:

1. "flashcards": Array de 5 flashcards no formato:
   {"pergunta": "...", "resposta": "..."}
   - Perguntas diretas sobre conceitos
   - Respostas concisas e objetivas

2. "questoes": Array de 3 questões estilo OAB no formato:
   {"pergunta": "...", "alternativas": ["A) ...", "B) ...", "C) ...", "D) ..."], "resposta_correta": 0, "explicacao": "..."}
   - Questões no padrão FGV
   - Uma única resposta correta (índice 0-3)
   - Explicação didática

3. "termos": Array de 3-5 termos técnicos no formato:
   {"termo": "...", "definicao": "..."}

Retorne APENAS o JSON válido, sem markdown:`;

    const respostaEstudo = await chamarGeminiComTimeout(promptEstudo, 4000);
    
    // Extrair JSON
    let flashcards = [];
    let questoes = [];
    let termos = [];
    
    try {
      let jsonText = respostaEstudo.trim();
      const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fenceMatch) jsonText = fenceMatch[1].trim();
      
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonText = jsonText.slice(jsonStart, jsonEnd + 1);
      }
      
      const parsed = JSON.parse(jsonText);
      flashcards = parsed.flashcards || [];
      questoes = parsed.questoes || [];
      termos = parsed.termos || [];
    } catch (e) {
      console.error("Erro ao parsear JSON de estudo:", e);
    }

    // Atualizar tópico com todo o conteúdo
    const { error: updateError } = await supabase
      .from("oab_etica_topicos")
      .update({
        conteudo_gerado: conteudoComDestaques,
        flashcards: flashcards,
        questoes: questoes,
        termos: termos,
        status: "concluido",
        updated_at: new Date().toISOString()
      })
      .eq("id", topico_id);

    if (updateError) {
      console.error("Erro ao atualizar tópico:", updateError);
      throw updateError;
    }

    // Disparar geração de capa em background (não aguarda)
    try {
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/gerar-capa-topico-etica`;
      fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ topico_id })
      }).catch(e => console.log("Capa será gerada em background"));
    } catch (e) {
      console.log("Erro ao disparar geração de capa (não crítico):", e);
    }

    const elapsed = Date.now() - startTime;
    console.log(`========== [ÉTICA OAB] CONCLUÍDO em ${elapsed}ms ==========`);

    return new Response(
      JSON.stringify({
        success: true,
        topico_id,
        status: "concluido",
        conteudo_length: conteudoComDestaques.length,
        flashcards_count: flashcards.length,
        questoes_count: questoes.length,
        termos_count: termos.length,
        elapsed_ms: elapsed
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[ÉTICA OAB] Erro:", error);
    
    // Marcar como erro
    if (topico_id) {
      await supabase
        .from("oab_etica_topicos")
        .update({ status: "erro", updated_at: new Date().toISOString() })
        .eq("id", topico_id);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});