import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const REVISION = "v1.0.0";
const MODEL = "gemini-2.0-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de nome da tabela para nome da área nos flashcards
const getAreaName = (tableName: string): string => {
  const mapping: Record<string, string> = {
    "CP - Código Penal": "Código Penal",
    "CC - Código Civil": "Código Civil",
    "CF - Constituição Federal": "Constituição Federal",
    "CPC – Código de Processo Civil": "Código de Processo Civil",
    "CPP – Código de Processo Penal": "Código de Processo Penal",
    "CDC – Código de Defesa do Consumidor": "Código de Defesa do Consumidor",
    "CLT - Consolidação das Leis do Trabalho": "CLT",
    "CTN – Código Tributário Nacional": "Código Tributário Nacional",
    "CTB Código de Trânsito Brasileiro": "Código de Trânsito Brasileiro",
    "CE – Código Eleitoral": "Código Eleitoral",
    "CPM – Código Penal Militar": "Código Penal Militar",
    "CPPM – Código de Processo Penal Militar": "Código de Processo Penal Militar",
    "CA - Código de Águas": "Código de Águas",
    "CBA Código Brasileiro de Aeronáutica": "Código Brasileiro de Aeronáutica",
    "CBT Código Brasileiro de Telecomunicações": "Código de Telecomunicações",
    "CCOM – Código Comercial": "Código Comercial",
    "CDM – Código de Minas": "Código de Minas",
    "ESTATUTO - ECA": "ECA",
    "ESTATUTO - IDOSO": "Estatuto do Idoso",
    "ESTATUTO - OAB": "Estatuto da OAB",
    "ESTATUTO - PESSOA COM DEFICIÊNCIA": "Estatuto da Pessoa com Deficiência",
    "ESTATUTO - IGUALDADE RACIAL": "Estatuto da Igualdade Racial",
    "ESTATUTO - CIDADE": "Estatuto da Cidade",
    "ESTATUTO - TORCEDOR": "Estatuto do Torcedor",
  };
  return mapping[tableName] || tableName;
};

serve(async (req) => {
  console.log(`📍 Function: gerar-flashcards-lote@${REVISION}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tableName, artigo } = await req.json();

    const DIREITO_PREMIUM_API_KEY = Deno.env.get("DIREITO_PREMIUM_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error("DIREITO_PREMIUM_API_KEY não configurada");
    }
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const areaName = getAreaName(tableName);

    console.log(`🚀 Gerando flashcards para ${areaName} - Art. ${artigo}`);

    // Verificar se já existem flashcards para este artigo
    const { data: existing } = await supabase
      .from("FLASHCARDS - ARTIGOS LEI")
      .select("id")
      .eq("area", areaName)
      .eq("tema", parseInt(artigo))
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`✅ Flashcards já existem para ${areaName} Art. ${artigo}`);
      return new Response(
        JSON.stringify({ success: true, cached: true, artigo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar conteúdo do artigo (pode haver duplicados)
    const { data: artigosData, error: artigoError } = await supabase
      .from(tableName)
      .select('"Artigo", "Número do Artigo", id')
      .eq('"Número do Artigo"', artigo);

    if (artigoError || !artigosData || artigosData.length === 0) {
      console.error(`❌ Artigo não encontrado: ${artigo}`, artigoError);
      return new Response(
        JSON.stringify({ success: false, error: "Artigo não encontrado", artigo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Combinar conteúdo de todos os artigos com mesmo número (caso de duplicados)
    const contents = artigosData
      .filter((a: any) => a.Artigo)
      .map((a: any) => a.Artigo);
    
    if (contents.length === 0) {
      console.error(`❌ Artigo sem conteúdo: ${artigo}`);
      return new Response(
        JSON.stringify({ success: false, error: "Artigo sem conteúdo", artigo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se há múltiplos artigos, combinar o conteúdo
    const content = contents.length === 1 
      ? contents[0] 
      : contents.map((c: string, i: number) => `[Versão ${i + 1}]\n${c}`).join('\n\n');
    
    console.log(`📄 Encontrado(s) ${artigosData.length} registro(s) para Art. ${artigo}`);

    // Gerar flashcards com Gemini
    const systemPrompt = `Você é um professor de Direito especialista em criar flashcards.

REGRAS OBRIGATÓRIAS:
1. Analise TODO o conteúdo do artigo
2. Crie flashcards para CADA conceito/aspecto importante
3. MÍNIMO 10 flashcards, crie quantos forem necessários para cobrir tudo
4. PROIBIDO REPETIR - cada flashcard DEVE ser sobre tema/aspecto DIFERENTE
5. VARIE os tipos de perguntas:
   - Conceito (O que é...?)
   - Requisitos (Quais os requisitos...?)
   - Aplicação (Quando se aplica...?)
   - Exceções (Em que casos não se aplica...?)
   - Prazos (Qual o prazo...?)
   - Penas/Sanções (Qual a consequência...?)
   - Sujeitos (Quem pode...?)
6. EXEMPLO PRÁTICO OBRIGATÓRIO - situação CONCRETA da vida real com nomes fictícios, mostrando a aplicação do conceito
7. BASE LEGAL OBRIGATÓRIA - cite artigos, parágrafos, incisos, leis, súmulas, jurisprudências relevantes
8. Respostas CONCISAS e diretas
9. Retorne APENAS JSON válido, sem markdown`;

    const userPrompt = `Analise este artigo e crie flashcards para cobrir TODO o conteúdo:

${content}

INSTRUÇÕES:
- Identifique TODOS os conceitos, requisitos, exceções, prazos e regras
- Crie flashcard para CADA aspecto (mínimo 10, sem máximo)
- NÃO REPITA conceitos - cada flashcard único
- EXEMPLO PRÁTICO obrigatório: situação real com nomes (João, Maria, empresa X) mostrando a aplicação prática
- BASE LEGAL obrigatória: cite o artigo específico, parágrafos, leis relacionadas, súmulas se houver

JSON formato:
{"flashcards":[{"front":"pergunta","back":"resposta","exemplo":"João comprou um carro usado de Maria. Depois descobriu um defeito oculto. João pode pedir abatimento do preço dentro de 30 dias, pois aplica-se o vício redibitório.","base_legal":"Art. 441 a 446 do Código Civil; Súmula 388 STJ"}]}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 16000 }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro da API Gemini para Art. ${artigo}:`, response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Erro da API: ${response.status}`, artigo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON
    let jsonText = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    jsonText = jsonText.trim();
    if (!jsonText.startsWith('{')) {
      const startIndex = jsonText.indexOf('{');
      if (startIndex !== -1) {
        jsonText = jsonText.substring(startIndex);
      }
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      console.error(`❌ Erro ao parsear JSON para Art. ${artigo}`);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao processar resposta", artigo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const flashcards = parsed.flashcards;
    
    if (!flashcards || flashcards.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Nenhum flashcard gerado", artigo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Salvar flashcards
    const flashcardsToInsert = flashcards.map((f: any) => ({
      area: areaName,
      tema: parseInt(artigo),
      pergunta: f.front,
      resposta: f.back,
      exemplo: f.exemplo || null,
      base_legal: f.base_legal || null,
    }));

    const { error: insertError } = await supabase
      .from("FLASHCARDS - ARTIGOS LEI")
      .insert(flashcardsToInsert);

    if (insertError) {
      console.error(`❌ Erro ao salvar flashcards Art. ${artigo}:`, insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao salvar", artigo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ ${flashcards.length} flashcards salvos para ${areaName} Art. ${artigo}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        cached: false, 
        artigo, 
        count: flashcards.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erro em gerar-flashcards-lote:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
