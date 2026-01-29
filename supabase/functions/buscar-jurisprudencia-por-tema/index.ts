import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JurisprudenciaItem {
  tipo: string;
  titulo: string;
  texto: string;
  ementa?: string;
  tribunal: string;
  processo?: string;
  ministro?: string;
  dataJulgamento?: string;
  link?: string;
  orgaoJulgador?: string;
  tese?: string;
  situacao?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { termo } = await req.json();

    if (!termo || termo.trim().length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Termo de busca deve ter pelo menos 2 caracteres',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Buscando jurisprudência por tema: "${termo}"`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const termoBusca = `%${termo.toLowerCase()}%`;
    const resultados: JurisprudenciaItem[] = [];

    // Buscar em STJ_REPETITIVOS
    const { data: repetitivos, error: errRepetitivos } = await supabase
      .from('STJ_REPETITIVOS')
      .select('*')
      .or(`tese_firmada.ilike.${termoBusca},questao_submetida.ilike.${termoBusca},ramo_direito.ilike.${termoBusca}`)
      .limit(15);

    if (errRepetitivos) {
      console.error('Erro ao buscar repetitivos:', errRepetitivos);
    } else if (repetitivos) {
      repetitivos.forEach((item: any) => {
        resultados.push({
          tipo: 'recurso_repetitivo',
          titulo: `Tema ${item.tema} - ${item.ramo_direito || 'STJ'}`,
          texto: item.tese_firmada || item.questao_submetida || '',
          ementa: item.questao_submetida,
          tribunal: 'STJ',
          processo: item.processo,
          ministro: item.ministro,
          dataJulgamento: item.data_julgamento,
          link: item.link,
          orgaoJulgador: item.orgao_julgador,
          tese: item.tese_firmada,
          situacao: item.situacao,
        });
      });
    }

    // Buscar em STJ_INFORMATIVOS
    const { data: informativos, error: errInformativos } = await supabase
      .from('STJ_INFORMATIVOS')
      .select('*')
      .or(`tese.ilike.${termoBusca},destaque.ilike.${termoBusca},ramo_direito.ilike.${termoBusca},titulo.ilike.${termoBusca}`)
      .limit(15);

    if (errInformativos) {
      console.error('Erro ao buscar informativos:', errInformativos);
    } else if (informativos) {
      informativos.forEach((item: any) => {
        resultados.push({
          tipo: 'informativo',
          titulo: item.titulo || `Informativo ${item.numero}`,
          texto: item.tese || item.destaque || '',
          ementa: item.destaque,
          tribunal: 'STJ',
          processo: item.processo,
          ministro: item.ministro,
          dataJulgamento: item.data_publicacao,
          link: item.link,
          orgaoJulgador: item.orgao_julgador,
          tese: item.tese,
        });
      });
    }

    // Buscar em SUMULAS VINCULANTES
    const { data: sumulasVinculantes, error: errSV } = await supabase
      .from('SUMULAS VINCULANTES')
      .select('*')
      .ilike('Texto da Súmula', termoBusca)
      .limit(10);

    if (errSV) {
      console.error('Erro ao buscar súmulas vinculantes:', errSV);
    } else if (sumulasVinculantes) {
      sumulasVinculantes.forEach((item: any) => {
        resultados.push({
          tipo: 'sumula_vinculante',
          titulo: item['Título da Súmula'] || `Súmula Vinculante ${item.id}`,
          texto: item['Texto da Súmula'] || '',
          tribunal: 'STF',
          dataJulgamento: item['Data de Aprovação'],
        });
      });
    }

    // Buscar em SUMULAS STJ
    const { data: sumulasSTJ, error: errSTJ } = await supabase
      .from('SUMULAS STJ')
      .select('*')
      .ilike('Texto da Súmula', termoBusca)
      .limit(10);

    if (errSTJ) {
      console.error('Erro ao buscar súmulas STJ:', errSTJ);
    } else if (sumulasSTJ) {
      sumulasSTJ.forEach((item: any) => {
        resultados.push({
          tipo: 'sumula',
          titulo: item['Título da Súmula'] || `Súmula STJ ${item.id}`,
          texto: item['Texto da Súmula'] || '',
          tribunal: 'STJ',
          dataJulgamento: item['Data de Aprovação'],
        });
      });
    }

    // Buscar em SUMULAS STF
    const { data: sumulasSTF, error: errSTF } = await supabase
      .from('SUMULAS STF')
      .select('*')
      .ilike('Texto da Súmula', termoBusca)
      .limit(10);

    if (errSTF) {
      console.error('Erro ao buscar súmulas STF:', errSTF);
    } else if (sumulasSTF) {
      sumulasSTF.forEach((item: any) => {
        resultados.push({
          tipo: 'sumula',
          titulo: item['Título da Súmula'] || `Súmula STF ${item.id}`,
          texto: item['Texto da Súmula'] || '',
          tribunal: 'STF',
          dataJulgamento: item['Data de Aprovação'],
        });
      });
    }

    console.log(`Encontrados ${resultados.length} resultados para "${termo}"`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          jurisprudencias: resultados,
        },
        fonte: 'busca-tema',
        total: resultados.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro na busca por tema:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar jurisprudência';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
