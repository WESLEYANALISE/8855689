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
    const { sigla, numero, ano, tramitando } = await req.json();
    
    console.log('Buscando matérias no Senado:', { sigla, numero, ano, tramitando });

    // Construir parâmetros de busca
    const params = new URLSearchParams();
    if (sigla) params.append('sigla', sigla);
    if (numero) params.append('numero', numero.toString());
    if (ano) params.append('ano', ano.toString());
    if (tramitando !== undefined) params.append('tramitando', tramitando ? 'S' : 'N');

    // API do Senado Federal - Busca de matérias legislativas
    const url = `https://legis.senado.leg.br/dadosabertos/materia/pesquisa/lista?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    const materiasData = data.PesquisaBasicaMateria?.Materias?.Materia || [];
    
    // Garantir que matérias seja um array
    const materias = Array.isArray(materiasData) ? materiasData : [materiasData];

    const materiasFormatadas = materias.slice(0, 50).map((m: any) => ({
      codigo: m.CodigoMateria,
      sigla: m.SiglaMateria || m.DescricaoIdentificacaoMateria?.split(' ')?.[0],
      numero: m.NumeroMateria,
      ano: m.AnoMateria,
      descricao: m.DescricaoIdentificacaoMateria,
      ementa: m.EmentaMateria,
      autor: m.AutoresPrincipais,
      data: m.DataApresentacao,
      situacao: m.SituacaoAtual?.DescricaoSituacao,
      tramitando: m.IndicadorTramitando === 'Sim',
    }));

    console.log(`${materiasFormatadas.length} matérias encontradas`);

    return new Response(
      JSON.stringify({ materias: materiasFormatadas }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao buscar matérias:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
