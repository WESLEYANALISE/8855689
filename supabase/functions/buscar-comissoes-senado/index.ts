import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, forceRefresh } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Buscando comissões do Senado:', { tipo, forceRefresh });

    // 1. Verificar cache se não forçar refresh
    if (!forceRefresh) {
      let query = supabase.from('senado_comissoes').select('*');
      
      if (tipo === 'ativas') {
        query = query.eq('ativa', true);
      } else if (tipo === 'permanente' || tipo === 'temporaria') {
        query = query.ilike('tipo', `%${tipo}%`);
      }
      
      const { data: cached, error: cacheError } = await query.order('sigla');
      
      if (!cacheError && cached && cached.length > 0) {
        // Verificar se cache é recente (menos de 7 dias)
        const cacheAge = Date.now() - new Date(cached[0].updated_at).getTime();
        const cacheMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
        
        if (cacheAge < cacheMaxAge) {
          console.log(`Retornando ${cached.length} comissões do cache`);
          
          const comissoesFormatadas = cached.map(c => ({
            codigo: c.codigo,
            sigla: c.sigla,
            nome: c.nome,
            tipo: c.tipo,
            casa: c.casa,
            dataCriacao: c.data_criacao,
            dataExtincao: c.data_extincao,
            ativa: c.ativa,
            participantes: c.participantes,
          }));
          
          return new Response(
            JSON.stringify({ comissoes: comissoesFormatadas, fromCache: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // 2. Buscar da API do Senado
    const url = 'https://legis.senado.leg.br/dadosabertos/comissao/lista/colegiados.json';
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    const comissoesData = data.ListaColegiados?.Colegiados?.Colegiado || [];
    
    const comissoes = Array.isArray(comissoesData) ? comissoesData : [comissoesData];

    // 3. Salvar no cache
    const comissoesParaCache = comissoes.map((c: any) => ({
      codigo: c.CodigoColegiado,
      sigla: c.SiglaColegiado,
      nome: c.NomeColegiado,
      tipo: c.TipoColegiado,
      casa: c.SiglaCasa,
      data_criacao: c.DataCriacao || null,
      data_extincao: c.DataExtincao || null,
      ativa: !c.DataExtincao,
      participantes: c.Participantes?.Participante?.length || 0,
      dados_completos: c,
    }));

    for (const comissao of comissoesParaCache) {
      await supabase
        .from('senado_comissoes')
        .upsert(comissao, { onConflict: 'codigo' });
    }

    console.log(`Cache atualizado com ${comissoesParaCache.length} comissões`);

    // 4. Filtrar por tipo se especificado
    let comissoesFiltradas = comissoes;
    
    if (tipo === 'ativas') {
      comissoesFiltradas = comissoes.filter((c: any) => !c.DataExtincao);
    } else if (tipo === 'permanente' || tipo === 'temporaria') {
      comissoesFiltradas = comissoes.filter((c: any) => 
        c.TipoColegiado?.toLowerCase().includes(tipo.toLowerCase())
      );
    }

    const comissoesFormatadas = comissoesFiltradas.map((c: any) => ({
      codigo: c.CodigoColegiado,
      sigla: c.SiglaColegiado,
      nome: c.NomeColegiado,
      tipo: c.TipoColegiado,
      casa: c.SiglaCasa,
      dataCriacao: c.DataCriacao,
      dataExtincao: c.DataExtincao,
      ativa: !c.DataExtincao,
      participantes: c.Participantes?.Participante?.length || 0,
    }));

    console.log(`${comissoesFormatadas.length} comissões encontradas`);

    return new Response(
      JSON.stringify({ comissoes: comissoesFormatadas, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao buscar comissões:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
