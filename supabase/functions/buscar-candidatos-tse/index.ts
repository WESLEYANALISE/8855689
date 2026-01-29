import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = "https://divulgacandcontas.tse.jus.br/divulga/rest/v1";

// Mapear cargos para códigos do TSE
const CARGO_MAP: Record<string, string> = {
  'presidente': '1',
  'governador': '3',
  'senador': '5',
  'deputado-federal': '6',
  'deputado-estadual': '7',
  'prefeito': '11',
  'vereador': '13'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { busca, ano, cargo, estado } = await req.json();
    
    console.log('Buscando candidatos TSE:', { busca, ano, cargo, estado });

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const codigoCargo = CARGO_MAP[cargo] || '11';
    const uf = estado === 'BR' || !estado ? 'BR' : estado;
    const anoConsulta = ano || '2024';

    // Tentar buscar no cache primeiro (apenas se não houver busca por nome)
    if (!busca) {
      const { data: cacheData, error: cacheError } = await supabase
        .from('cache_candidatos_tse')
        .select('dados')
        .eq('ano', parseInt(anoConsulta))
        .eq('uf', uf)
        .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!cacheError && cacheData && cacheData.length > 0) {
        console.log('Retornando do cache');
        const candidatosCache = cacheData.flatMap(item => 
          Array.isArray(item.dados) ? item.dados : [item.dados]
        );
        
        // Filtrar por cargo se especificado
        const candidatosFiltrados = cargo 
          ? candidatosCache.filter((c: any) => c.cargo?.toLowerCase().includes(cargo.toLowerCase()))
          : candidatosCache;

        if (candidatosFiltrados.length > 0) {
          return new Response(
            JSON.stringify({ candidatos: candidatosFiltrados }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
      }
    }

    // Buscar na API do TSE
    let url: string;
    if (busca) {
      // Busca por nome
      url = `${BASE_URL}/candidatura/buscar/${anoConsulta}/${uf}/candidatos/${encodeURIComponent(busca)}`;
    } else {
      // Lista por cargo
      url = `${BASE_URL}/candidatura/listar/${anoConsulta}/${uf}/${codigoCargo}/candidatos`;
    }

    console.log('Consultando API TSE:', url);

    const response = await fetch(url, {
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'DireitoPremiumApp/1.0'
      }
    });

    if (!response.ok) {
      console.error('Erro na API TSE:', response.status, await response.text());
      throw new Error(`Erro ao buscar candidatos: ${response.status}`);
    }

    const data = await response.json();
    console.log('Resposta da API TSE recebida');

    // Processar candidatos
    const candidatos = (data.candidatos || []).map((c: any) => ({
      nome: c.nomeUrna || c.nomeCompleto,
      numero: c.numero?.toString() || '',
      partido: c.partido?.sigla || c.partido?.numero || '',
      cargo: c.cargo?.nome || cargo,
      uf: c.uf || uf,
      situacao: c.descricaoSituacao || c.situacao || '',
      foto: c.id ? `${BASE_URL}/candidatura/foto/${anoConsulta}/${c.id}` : null,
      bens: c.totalDeBens ? `R$ ${c.totalDeBens.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não declarado',
      redesSociais: [
        ...(c.emails || []).map((e: string) => ({ tipo: "Email", url: `mailto:${e}` })),
        ...(c.sites || []).map((s: string) => ({ tipo: "Site", url: s }))
      ],
      sqCandidato: c.id
    }));

    console.log(`Encontrados ${candidatos.length} candidatos`);

    // Salvar no cache (apenas se não for busca por nome)
    if (!busca && candidatos.length > 0) {
      try {
        for (const candidato of candidatos) {
          await supabase
            .from('cache_candidatos_tse')
            .upsert({
              ano: parseInt(anoConsulta),
              uf: uf,
              sq_candidato: candidato.sqCandidato,
              dados: candidato,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'ano,sq_candidato'
            });
        }
        console.log('Cache atualizado');
      } catch (cacheError) {
        console.error('Erro ao salvar cache:', cacheError);
        // Não falhar a requisição por erro de cache
      }
    }

    return new Response(
      JSON.stringify({ candidatos }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Erro ao buscar candidatos:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao buscar candidatos',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
