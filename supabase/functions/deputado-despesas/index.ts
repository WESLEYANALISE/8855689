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
    const { idDeputado, ano, mes } = await req.json();
    
    console.log('Buscando despesas do deputado:', { idDeputado, ano, mes });

    // Construir URL com parâmetros
    const params = new URLSearchParams();
    if (ano) params.append('ano', ano.toString());
    if (mes) params.append('mes', mes.toString());
    params.append('ordem', 'DESC');
    params.append('ordenarPor', 'dataDocumento');

    const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${idDeputado}/despesas?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    console.log(`${data.dados?.length || 0} despesas encontradas`);

    return new Response(JSON.stringify({ despesas: data.dados || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
