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
    const { siglaTipo, numero, ano, mes, keywords, idDeputadoAutor } = await req.json();
    
    console.log('Buscando proposições com filtros:', { siglaTipo, numero, ano, mes, keywords });

    // Construir URL com parâmetros
    const params = new URLSearchParams();
    if (siglaTipo) params.append('siglaTipo', siglaTipo);
    if (numero) params.append('numero', numero);
    
    // Se tiver mês e ano, usar dataInicio e dataFim ao invés de ano
    if (mes && ano) {
      const mesNum = parseInt(mes);
      const anoNum = parseInt(ano);
      const dataInicio = new Date(anoNum, mesNum - 1, 1).toISOString().split('T')[0];
      const ultimoDia = new Date(anoNum, mesNum, 0).getDate();
      const dataFim = new Date(anoNum, mesNum - 1, ultimoDia).toISOString().split('T')[0];
      params.append('dataInicio', dataInicio);
      params.append('dataFim', dataFim);
      console.log(`📅 Filtrando por período: ${dataInicio} a ${dataFim}`);
    } else if (ano) {
      params.append('ano', ano.toString());
    }
    
    if (keywords) params.append('keywords', keywords);
    if (idDeputadoAutor) params.append('idDeputadoAutor', idDeputadoAutor.toString());
    params.append('ordem', 'DESC');
    params.append('ordenarPor', 'id');
    params.append('itens', '15');

    const url = `https://dadosabertos.camara.leg.br/api/v2/proposicoes?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    console.log(`${data.dados?.length || 0} proposições encontradas`);

    return new Response(JSON.stringify({ proposicoes: data.dados || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar proposições:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
