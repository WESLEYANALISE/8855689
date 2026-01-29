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
    const { nome, siglaUf, siglaPartido, idLegislatura } = await req.json();
    
    console.log('Buscando deputados com filtros:', { nome, siglaUf, siglaPartido, idLegislatura });

    // Construir URL com parâmetros
    const params = new URLSearchParams();
    if (nome) params.append('nome', nome);
    if (siglaUf) params.append('siglaUf', siglaUf);
    if (siglaPartido) params.append('siglaPartido', siglaPartido);
    if (idLegislatura) params.append('idLegislatura', idLegislatura.toString());
    params.append('ordem', 'ASC');
    params.append('ordenarPor', 'nome');

    const url = `https://dadosabertos.camara.leg.br/api/v2/deputados?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    console.log(`${data.dados?.length || 0} deputados encontrados`);

    return new Response(JSON.stringify({ deputados: data.dados || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar deputados:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
