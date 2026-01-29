import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { membro_id } = await req.json();

    if (!membro_id) {
      return new Response(
        JSON.stringify({ error: "membro_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Buscando curiosidades para ministro: ${membro_id}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados do ministro
    const { data: ministro, error: ministroError } = await supabase
      .from("tres_poderes_ministros_stf")
      .select("*")
      .eq("id", membro_id)
      .single();

    if (ministroError || !ministro) {
      throw new Error("Ministro não encontrado");
    }

    // Verificar se já tem curiosidades recentes (menos de 30 dias)
    if (ministro.curiosidades_atualizadas_em) {
      const lastUpdate = new Date(ministro.curiosidades_atualizadas_em);
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate < 30 && ministro.curiosidades?.length > 0) {
        console.log("Curiosidades recentes encontradas no cache");
        return new Response(
          JSON.stringify({ 
            success: true, 
            curiosidades: ministro.curiosidades,
            cached: true 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Buscar artigo na Wikipedia
    console.log(`Buscando Wikipedia para: ${ministro.nome_completo || ministro.nome}`);
    
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlApiKey) {
      throw new Error("FIRECRAWL_API_KEY não configurada");
    }

    const nomeCompleto = ministro.nome_completo || ministro.nome;
    const wikipediaUrl = `https://pt.wikipedia.org/wiki/${encodeURIComponent(nomeCompleto.replace(/ /g, "_"))}`;

    const wikiResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: wikipediaUrl,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    const wikiData = await wikiResponse.json();
    const wikiContent = wikiData.data?.markdown || "";

    if (!wikiContent) {
      console.log("Artigo Wikipedia não encontrado, tentando busca alternativa...");
      
      // Tentar com apenas o nome
      const altUrl = `https://pt.wikipedia.org/wiki/${encodeURIComponent(ministro.nome.replace(/ /g, "_"))}`;
      const altResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: altUrl,
          formats: ["markdown"],
          onlyMainContent: true,
        }),
      });

      const altData = await altResponse.json();
      if (!altData.data?.markdown) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Artigo Wikipedia não encontrado",
            curiosidades: [] 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Processar com Gemini para extrair curiosidades
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const prompt = `Analise o seguinte conteúdo da Wikipedia sobre o ministro do STF ${nomeCompleto}.

Conteúdo:
${wikiContent.slice(0, 20000)}

Extraia de 5 a 10 curiosidades interessantes e pouco conhecidas, incluindo:
- Fatos interessantes sobre sua vida pessoal
- Hobbies e interesses fora do trabalho
- Episódios marcantes ou polêmicos na carreira
- Frases célebres ou posicionamentos marcantes
- Dados sobre família
- Formação acadêmica diferenciada
- Prêmios e reconhecimentos
- Participação em eventos históricos

Retorne um array JSON no formato:
[
  {
    "titulo": "Título curto e chamativo da curiosidade",
    "descricao": "Descrição detalhada com no máximo 200 caracteres",
    "categoria": "vida_pessoal" | "carreira" | "formacao" | "premios" | "frases" | "polemicas"
  }
]

IMPORTANTE:
- Retorne APENAS o array JSON, sem texto adicional
- Foque em fatos verificáveis e interessantes
- Evite informações muito básicas como data de nascimento
- Priorize curiosidades que gerem engajamento`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um pesquisador especializado em biografias de ministros do STF. Retorne apenas JSON válido." },
          { role: "user", content: prompt }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "[]";

    let curiosidades = [];
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        curiosidades = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Erro ao parsear curiosidades:", e);
      curiosidades = [];
    }

    // Salvar curiosidades no banco
    if (curiosidades.length > 0) {
      console.log(`Salvando ${curiosidades.length} curiosidades...`);
      
      await supabase
        .from("tres_poderes_ministros_stf")
        .update({
          curiosidades: curiosidades,
          curiosidades_atualizadas_em: new Date().toISOString()
        })
        .eq("id", membro_id);
    }

    console.log(`Curiosidades processadas: ${curiosidades.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        curiosidades,
        nome: nomeCompleto 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao buscar curiosidades:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
