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
  Deno.env.get("DIREITO_PREMIUM_API_KEY"),
].filter(Boolean);

async function callGeminiWithFallback(prompt: string): Promise<string> {
  for (const key of GEMINI_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      if (response.status === 429) {
        console.log("Rate limited, trying next key...");
        continue;
      }

      if (!response.ok) {
        console.error(`Gemini error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (error) {
      console.error("Gemini call failed:", error);
      continue;
    }
  }
  throw new Error("All Gemini keys exhausted");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar livros de Estudos
    const { data: estudos } = await supabase
      .from("BIBLIOTECA-ESTUDOS")
      .select("id, \"Área\", Tema, \"Capa-livro\", url_capa_gerada, Sobre")
      .not("Tema", "is", null);

    // Buscar livros de Clássicos
    const { data: classicos } = await supabase
      .from("BIBLIOTECA-CLASSICOS")
      .select("id, livro, autor, imagem, sobre, area")
      .not("livro", "is", null);

    // Preparar lista de livros para análise
    interface LivroParaAnalise {
      id: number;
      titulo: string;
      autor?: string;
      area: string;
      capa: string | null;
      sobre: string | null;
      origem: string;
    }

    const livrosEstudos: LivroParaAnalise[] = (estudos || []).map((l: any) => ({
      id: l.id,
      titulo: l.Tema || l["Área"],
      area: l["Área"],
      capa: l.url_capa_gerada || l["Capa-livro"],
      sobre: l.Sobre,
      origem: "estudos"
    }));

    const livrosClassicos: LivroParaAnalise[] = (classicos || []).map((l: any) => ({
      id: l.id,
      titulo: l.livro,
      autor: l.autor,
      area: l.area,
      capa: l.imagem,
      sobre: l.sobre,
      origem: "classicos"
    }));

    const todosLivros: LivroParaAnalise[] = [...livrosEstudos, ...livrosClassicos];

    // Criar prompt para Gemini
    const prompt = `Você é um especialista em educação jurídica no Brasil. Analise esta lista de livros e materiais de estudo jurídico e selecione os 15-20 mais essenciais para estudantes INICIANTES de Direito.

CRITÉRIOS DE SELEÇÃO:
1. Linguagem acessível e didática
2. Conceitos fundamentais e introdutórios
3. Obras clássicas que todo estudante deve conhecer
4. Materiais que formam a base do conhecimento jurídico
5. Evitar materiais muito técnicos ou avançados

LIVROS DISPONÍVEIS:
${JSON.stringify(todosLivros.map(l => ({
  id: l.id,
  titulo: l.titulo,
  autor: l.autor || null,
  area: l.area,
  origem: l.origem,
  resumo: l.sobre?.substring(0, 200) || null
})), null, 2)}

Responda APENAS com um JSON array no formato:
[
  {
    "id": <number>,
    "origem": "estudos" ou "classicos",
    "justificativa": "<breve justificativa de até 50 palavras>"
  }
]

Selecione entre 15-20 livros essenciais para iniciantes. Priorize variedade de áreas do Direito.`;

    console.log("Calling Gemini to analyze books...");
    const geminiResponse = await callGeminiWithFallback(prompt);
    
    // Extrair JSON da resposta
    const jsonMatch = geminiResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse Gemini response");
    }
    
    const selecionados = JSON.parse(jsonMatch[0]);
    console.log(`Gemini selected ${selecionados.length} books`);

    // Limpar tabela existente
    await supabase.from("biblioteca_iniciante").delete().neq("id", 0);

    // Inserir livros selecionados
    const inserts = [];
    for (let i = 0; i < selecionados.length; i++) {
      const sel = selecionados[i];
      const livroOriginal = todosLivros.find(l => l.id === sel.id && l.origem === sel.origem);
      
      if (livroOriginal) {
        inserts.push({
          livro_id: livroOriginal.id,
          biblioteca_origem: sel.origem,
          titulo: livroOriginal.titulo,
          autor: livroOriginal.autor || null,
          capa: livroOriginal.capa,
          area: livroOriginal.area,
          justificativa: sel.justificativa,
          ordem: i + 1,
        });
      }
    }

    if (inserts.length > 0) {
      const { error: insertError } = await supabase
        .from("biblioteca_iniciante")
        .insert(inserts);

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${inserts.length} livros essenciais para iniciantes foram selecionados`,
        livros: inserts.map(l => l.titulo),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
