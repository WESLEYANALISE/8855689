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
    const { area, topico, maxTokens = 5000 } = await req.json();

    if (!area) {
      return new Response(
        JSON.stringify({ error: "area é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🔍 Buscando contexto para: ${area} - ${topico || "geral"}`);

    // Buscar todas as páginas da área
    const { data: paginas, error } = await supabase
      .from("oab_base_conhecimento")
      .select("conteudo, pagina, tokens_estimados")
      .eq("area", area)
      .order("pagina");

    if (error) {
      throw error;
    }

    if (!paginas || paginas.length === 0) {
      console.log(`⚠️ Nenhum conteúdo encontrado para área: ${area}`);
      return new Response(
        JSON.stringify({ contexto: "", tokensUsados: 0, paginasEncontradas: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📚 Encontradas ${paginas.length} páginas`);

    // Se tiver tópico, filtrar páginas relevantes
    let paginasRelevantes = paginas;
    if (topico) {
      const termosBusca = topico.toLowerCase().split(" ").filter((t: string) => t.length > 3);
      
      paginasRelevantes = paginas
        .map((p) => {
          const conteudoLower = p.conteudo.toLowerCase();
          const relevancia = termosBusca.filter((termo: string) => 
            conteudoLower.includes(termo)
          ).length;
          return { ...p, relevancia };
        })
        .filter((p) => p.relevancia > 0)
        .sort((a, b) => b.relevancia - a.relevancia);

      // Se não encontrou nada específico, usar as primeiras páginas
      if (paginasRelevantes.length === 0) {
        paginasRelevantes = paginas.slice(0, 10);
      }
    }

    // Concatenar respeitando limite de tokens
    let contexto = "";
    let tokensUsados = 0;
    let paginasIncluidas = 0;

    for (const p of paginasRelevantes) {
      const tokens = p.tokens_estimados || Math.ceil(p.conteudo.length / 4);
      
      if (tokensUsados + tokens > maxTokens) {
        break;
      }

      contexto += `--- Página ${p.pagina} ---\n${p.conteudo}\n\n`;
      tokensUsados += tokens;
      paginasIncluidas++;
    }

    console.log(`✅ Retornando ${paginasIncluidas} páginas, ${tokensUsados} tokens`);

    return new Response(
      JSON.stringify({
        contexto,
        tokensUsados,
        paginasEncontradas: paginasIncluidas,
        totalPaginasArea: paginas.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("❌ Erro na busca de contexto:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
