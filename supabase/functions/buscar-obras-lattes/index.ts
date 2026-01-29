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
    const { nome, tipo, membro_id } = await req.json();

    if (!nome || !tipo) {
      return new Response(
        JSON.stringify({ error: "Nome e tipo são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Buscando obras no Lattes para ${tipo}: ${nome}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar cache do Lattes
    const { data: cacheData } = await supabase
      .from("aprofundamento_lattes_cache")
      .select("*")
      .eq("membro_nome", nome)
      .eq("membro_tipo", tipo)
      .single();

    let lattesUrl = cacheData?.lattes_url;

    // Se não temos URL do Lattes, buscar
    if (!lattesUrl) {
      console.log("Buscando perfil Lattes via Firecrawl...");
      
      const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (!firecrawlApiKey) {
        throw new Error("FIRECRAWL_API_KEY não configurada");
      }

      // Buscar na página de busca do Lattes
      const searchUrl = `https://buscatextual.cnpq.br/buscatextual/busca.do?metodo=apresentar`;
      
      // Usar Firecrawl para raspar a página de resultados
      const searchResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: `https://buscatextual.cnpq.br/buscatextual/busca.do?metodo=forwardPaginaParaVisualizacao&texto=${encodeURIComponent(nome)}&parametros=`,
          formats: ["markdown", "links"],
          onlyMainContent: false,
          waitFor: 3000,
        }),
      });

      const searchData = await searchResponse.json();
      console.log("Resultado da busca:", JSON.stringify(searchData).slice(0, 500));

      // Tentar encontrar link do currículo nos resultados
      const links = searchData.data?.links || [];
      const curriculoLink = links.find((link: string) => 
        link.includes("visualizacv.do") || link.includes("lattes.cnpq.br")
      );

      if (curriculoLink) {
        lattesUrl = curriculoLink;
        console.log("URL do Lattes encontrada:", lattesUrl);
      }
    }

    let obras: any[] = [];

    if (lattesUrl) {
      console.log("Raspando currículo Lattes:", lattesUrl);

      const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
      
      // Raspar página do currículo
      const cvResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: lattesUrl,
          formats: ["markdown"],
          onlyMainContent: false,
          waitFor: 5000,
        }),
      });

      const cvData = await cvResponse.json();
      const cvContent = cvData.data?.markdown || "";

      if (cvContent) {
        console.log("Conteúdo do CV obtido, processando com IA...");

        // Processar com Gemini
        const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
        if (!lovableApiKey) {
          throw new Error("LOVABLE_API_KEY não configurada");
        }

        const prompt = `Analise o seguinte conteúdo de um currículo Lattes e extraia APENAS as obras publicadas (livros, capítulos de livros, artigos).

Conteúdo do currículo:
${cvContent.slice(0, 15000)}

Retorne um array JSON com as obras encontradas no formato:
[
  {
    "titulo": "Título da obra",
    "ano": 2020,
    "tipo": "livro" | "capitulo" | "artigo",
    "editora": "Nome da editora (se houver)",
    "descricao": "Breve descrição ou coautores"
  }
]

IMPORTANTE: 
- Retorne APENAS o array JSON, sem texto adicional
- Se não encontrar obras, retorne []
- Extraia apenas publicações acadêmicas/literárias reais`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Você é um extrator de dados de currículos acadêmicos. Retorne apenas JSON válido." },
              { role: "user", content: prompt }
            ],
          }),
        });

        const aiData = await aiResponse.json();
        const aiContent = aiData.choices?.[0]?.message?.content || "[]";

        try {
          const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            obras = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error("Erro ao parsear resposta da IA:", e);
          obras = [];
        }
      }

      // Atualizar cache do Lattes
      await supabase
        .from("aprofundamento_lattes_cache")
        .upsert({
          membro_id: membro_id || null,
          membro_nome: nome,
          membro_tipo: tipo,
          lattes_url: lattesUrl,
          ultima_atualizacao: new Date().toISOString(),
        }, { onConflict: "membro_nome,membro_tipo" });
    }

    // Salvar obras encontradas
    if (obras.length > 0 && membro_id) {
      console.log(`Salvando ${obras.length} obras encontradas...`);

      for (const obra of obras) {
        await supabase
          .from("aprofundamento_obras")
          .upsert({
            membro_id: membro_id,
            titulo: obra.titulo,
            ano: obra.ano,
            editora: obra.editora,
            descricao: obra.descricao,
            tipo_obra: obra.tipo,
            fonte: "lattes",
          }, { onConflict: "membro_id,titulo" })
          .select();
      }
    }

    console.log(`Busca concluída. ${obras.length} obras encontradas.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        obras: obras.length,
        lattes_url: lattesUrl,
        nome: nome 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao buscar obras no Lattes:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
