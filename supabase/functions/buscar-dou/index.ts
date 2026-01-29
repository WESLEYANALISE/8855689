import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PublicacaoDOU {
  id: string;
  titulo: string;
  secao: string;
  data_publicacao: string;
  orgao: string;
  tipo_ato: string;
  ementa: string;
  url: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { termo, secao, dataInicio } = await req.json();

    if (!termo || termo.length < 3) {
      return new Response(
        JSON.stringify({ error: "Termo de busca deve ter pelo menos 3 caracteres" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Buscando no DOU: termo="${termo}", secao="${secao}", dataInicio="${dataInicio}"`);

    // Usar API do Querido Diário para buscar publicações
    // O Querido Diário agrega diários oficiais de várias fontes
    const baseUrl = "https://queridodiario.ok.org.br/api/gazettes";
    
    const params = new URLSearchParams({
      querystring: termo,
      size: "20",
      sort_by: "descending_date"
    });

    // Filtrar por território nacional (União)
    params.append("territory_id", "0");

    if (dataInicio) {
      params.append("since", dataInicio);
    }

    const response = await fetch(`${baseUrl}?${params.toString()}`);

    if (!response.ok) {
      console.log("Querido Diário não disponível, tentando alternativa...");
      
      // Alternativa: Simular busca com dados mockados para demonstração
      // Em produção, integrar com API oficial da Imprensa Nacional
      const mockPublicacoes: PublicacaoDOU[] = [
        {
          id: "1",
          titulo: `Resultado da busca por "${termo}"`,
          secao: secao || "1",
          data_publicacao: new Date().toLocaleDateString("pt-BR"),
          orgao: "Imprensa Nacional",
          tipo_ato: "Busca",
          ementa: `Para acessar publicações oficiais do DOU, utilize o portal oficial da Imprensa Nacional: https://www.in.gov.br/`,
          url: `https://www.in.gov.br/consulta/-/buscar/dou?q=${encodeURIComponent(termo)}`
        }
      ];

      return new Response(
        JSON.stringify({ 
          publicacoes: mockPublicacoes,
          fonte: "Imprensa Nacional",
          mensagem: "Acesse o portal oficial para resultados completos"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    const publicacoes: PublicacaoDOU[] = (data.gazettes || []).map((item: any, index: number) => ({
      id: item.id || String(index),
      titulo: item.excerpt || `Publicação ${index + 1}`,
      secao: secao || "1",
      data_publicacao: formatarData(item.date),
      orgao: item.territory_name || "União",
      tipo_ato: item.is_extra_edition ? "Edição Extra" : "Edição Ordinária",
      ementa: item.excerpt || "",
      url: item.url || item.txt_url || ""
    }));

    console.log(`Encontradas ${publicacoes.length} publicações`);

    return new Response(
      JSON.stringify({ publicacoes, total: data.total_gazettes || publicacoes.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao buscar DOU:", error);
    
    // Fallback com link para portal oficial
    return new Response(
      JSON.stringify({ 
        publicacoes: [{
          id: "fallback",
          titulo: "Acesse o Diário Oficial da União",
          secao: "1",
          data_publicacao: new Date().toLocaleDateString("pt-BR"),
          orgao: "Imprensa Nacional",
          tipo_ato: "Portal",
          ementa: "Acesse o portal oficial da Imprensa Nacional para consultar publicações do DOU.",
          url: "https://www.in.gov.br/"
        }],
        mensagem: "Use o portal oficial para busca completa"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function formatarData(data: string | null): string {
  if (!data) return new Date().toLocaleDateString("pt-BR");
  try {
    return new Date(data).toLocaleDateString("pt-BR");
  } catch {
    return data;
  }
}
