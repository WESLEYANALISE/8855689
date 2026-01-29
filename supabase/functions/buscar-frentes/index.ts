import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idLegislatura, keywords } = await req.json();
    
    console.log('Buscando frentes com filtros:', { idLegislatura, keywords });

    const params = new URLSearchParams();
    if (idLegislatura) params.append('idLegislatura', idLegislatura.toString());
    if (keywords) params.append('keywords', keywords);

    const url = `https://dadosabertos.camara.leg.br/api/v2/frentes?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    console.log(`${data.dados?.length || 0} frentes encontradas`);

    return new Response(JSON.stringify({ frentes: data.dados || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar frentes:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
