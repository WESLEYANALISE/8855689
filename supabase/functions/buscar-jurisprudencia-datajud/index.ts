import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API Key pública do CNJ para Datajud
const DATAJUD_API_KEY = 'APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';

// Mapeamento de tribunais disponíveis
const TRIBUNAIS = {
  'STJ': 'api_publica_stj',
  'STF': 'api_publica_stf',
  'TST': 'api_publica_tst',
  'TSE': 'api_publica_tse',
  'STM': 'api_publica_stm',
  'TRF1': 'api_publica_trf1',
  'TRF2': 'api_publica_trf2',
  'TRF3': 'api_publica_trf3',
  'TRF4': 'api_publica_trf4',
  'TRF5': 'api_publica_trf5',
  'TRF6': 'api_publica_trf6',
  'TJSP': 'api_publica_tjsp',
  'TJRJ': 'api_publica_tjrj',
  'TJMG': 'api_publica_tjmg',
  'TJRS': 'api_publica_tjrs',
  'TJPR': 'api_publica_tjpr',
  'TJSC': 'api_publica_tjsc',
  'TJBA': 'api_publica_tjba',
  'TJPE': 'api_publica_tjpe',
  'TJCE': 'api_publica_tjce',
  'TJGO': 'api_publica_tjgo',
  'TJDF': 'api_publica_tjdft',
  'TJMT': 'api_publica_tjmt',
  'TJMS': 'api_publica_tjms',
  'TJES': 'api_publica_tjes',
  'TJPA': 'api_publica_tjpa',
  'TJAM': 'api_publica_tjam',
  'TJMA': 'api_publica_tjma',
  'TJPB': 'api_publica_tjpb',
  'TJRN': 'api_publica_tjrn',
  'TJAL': 'api_publica_tjal',
  'TJSE': 'api_publica_tjse',
  'TJPI': 'api_publica_tjpi',
  'TJTO': 'api_publica_tjto',
  'TJRO': 'api_publica_tjro',
  'TJAC': 'api_publica_tjac',
  'TJRR': 'api_publica_tjrr',
  'TJAP': 'api_publica_tjap',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { termo, tribunal = 'STJ', pagina = 0, tamanho = 20 } = await req.json();

    if (!termo || termo.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'Termo de busca deve ter pelo menos 3 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar cache primeiro
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const cacheKey = `${tribunal}:${termo.toLowerCase().trim()}:${pagina}`;
    
    const { data: cached } = await supabase
      .from('jurisprudencias_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expira_em', new Date().toISOString())
      .single();

    if (cached) {
      console.log('Cache hit para:', cacheKey);
      return new Response(
        JSON.stringify(cached.dados),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar na API do Datajud
    const indice = TRIBUNAIS[tribunal as keyof typeof TRIBUNAIS] || 'api_publica_stj';
    const url = `https://api-publica.datajud.cnj.jus.br/${indice}/_search`;

    console.log('Buscando em:', url, 'termo:', termo);

    const query = {
      size: tamanho,
      from: pagina * tamanho,
      query: {
        multi_match: {
          query: termo,
          fields: ["textoCompleto", "numeroProcesso", "assuntos.nome"],
          type: "best_fields",
          operator: "or"
        }
      },
      _source: [
        "numeroProcesso",
        "classe",
        "assuntos",
        "dataJulgamento",
        "dataPublicacao",
        "dataAjuizamento",
        "orgaoJulgador",
        "relator",
        "textoCompleto",
        "tribunal",
        "grau",
        "nivelSigilo",
        "formato",
        "sistema",
        "movimentos"
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': DATAJUD_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro Datajud:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar jurisprudência',
          details: response.status 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Formatar resultados
    const resultados = (data.hits?.hits || []).map((hit: any) => {
      const source = hit._source;
      
      // Extrair ementa do texto completo (geralmente os primeiros parágrafos)
      let ementa = source.textoCompleto || '';
      if (ementa.length > 1000) {
        ementa = ementa.substring(0, 1000) + '...';
      }

      return {
        id: hit._id,
        numeroProcesso: source.numeroProcesso || 'N/A',
        classe: source.classe || { nome: 'N/A', codigo: null },
        assuntosLista: source.assuntos || [],
        assuntos: (source.assuntos || []).map((a: any) => a.nome).join(', ') || 'N/A',
        dataJulgamento: source.dataJulgamento,
        dataPublicacao: source.dataPublicacao,
        dataAjuizamento: source.dataAjuizamento,
        orgaoJulgador: source.orgaoJulgador || { nome: 'N/A', codigo: null, municipio: null },
        orgaoJulgadorNome: source.orgaoJulgador?.nome || 'N/A',
        relator: source.relator || 'N/A',
        ementa: ementa,
        tribunal: tribunal,
        textoCompleto: source.textoCompleto,
        grau: source.grau || 'N/A',
        nivelSigilo: source.nivelSigilo || 0,
        formato: source.formato || {},
        sistema: source.sistema || {},
        movimentos: source.movimentos || [],
      };
    });

    const resultado = {
      resultados,
      total: data.hits?.total?.value || 0,
      pagina,
      tamanho,
      tribunal,
      fonte: 'Datajud - CNJ'
    };

    // Salvar no cache (expira em 24 horas)
    const expiraEm = new Date();
    expiraEm.setHours(expiraEm.getHours() + 24);

    await supabase
      .from('jurisprudencias_cache')
      .upsert({
        cache_key: cacheKey,
        termo: termo.toLowerCase().trim(),
        tribunal,
        dados: resultado,
        expira_em: expiraEm.toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'cache_key' });

    return new Response(
      JSON.stringify(resultado),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
