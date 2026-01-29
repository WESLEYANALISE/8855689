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
    const { uf, partido, forceRefresh } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Buscando senadores:', { uf, partido, forceRefresh });

    // 1. Verificar cache se não forçar refresh
    if (!forceRefresh) {
      let query = supabase.from('senado_senadores').select('*');
      
      if (uf) query = query.eq('uf', uf);
      if (partido) query = query.eq('partido', partido);
      
      const { data: cached, error: cacheError } = await query.order('nome');
      
      if (!cacheError && cached && cached.length > 0) {
        // Verificar se cache é recente (menos de 24 horas)
        const cacheAge = Date.now() - new Date(cached[0].updated_at).getTime();
        const cacheMaxAge = 24 * 60 * 60 * 1000; // 24 horas
        
        if (cacheAge < cacheMaxAge) {
          console.log(`Retornando ${cached.length} senadores do cache`);
          
          const senadoresFormatados = cached.map(s => ({
            codigo: s.codigo,
            nome: s.nome,
            nomeCompleto: s.nome_completo,
            foto: s.foto,
            partido: s.partido,
            uf: s.uf,
            email: s.email,
            sexo: s.sexo,
            paginaWeb: s.pagina_web,
            bloco: s.bloco,
            telefone: s.telefone,
          }));
          
          return new Response(
            JSON.stringify({ senadores: senadoresFormatados, fromCache: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // 2. Buscar da API do Senado
    const url = 'https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json';
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    let senadores = data.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
    
    // 3. Salvar no cache
    const senadoresParaCache = senadores.map((s: any) => ({
      codigo: s.IdentificacaoParlamentar?.CodigoParlamentar,
      nome: s.IdentificacaoParlamentar?.NomeParlamentar,
      nome_completo: s.IdentificacaoParlamentar?.NomeCompletoParlamentar,
      foto: s.IdentificacaoParlamentar?.UrlFotoParlamentar,
      partido: s.IdentificacaoParlamentar?.SiglaPartidoParlamentar,
      uf: s.IdentificacaoParlamentar?.UfParlamentar,
      email: s.IdentificacaoParlamentar?.EmailParlamentar,
      sexo: s.IdentificacaoParlamentar?.SexoParlamentar,
      pagina_web: s.IdentificacaoParlamentar?.UrlPaginaParlamentar,
      bloco: s.IdentificacaoParlamentar?.Bloco?.NomeBloco,
      dados_completos: s,
    }));

    // Upsert no cache
    for (const senador of senadoresParaCache) {
      await supabase
        .from('senado_senadores')
        .upsert(senador, { onConflict: 'codigo' });
    }

    console.log(`Cache atualizado com ${senadoresParaCache.length} senadores`);
    
    // 4. Filtrar por UF e partido se especificado
    if (uf) {
      senadores = senadores.filter((s: any) => 
        s.IdentificacaoParlamentar?.UfParlamentar === uf
      );
    }
    
    if (partido) {
      senadores = senadores.filter((s: any) => 
        s.IdentificacaoParlamentar?.SiglaPartidoParlamentar === partido
      );
    }
    
    // 5. Formatar dados
    const senadoresFormatados = senadores.map((s: any) => ({
      codigo: s.IdentificacaoParlamentar?.CodigoParlamentar,
      nome: s.IdentificacaoParlamentar?.NomeParlamentar,
      nomeCompleto: s.IdentificacaoParlamentar?.NomeCompletoParlamentar,
      foto: s.IdentificacaoParlamentar?.UrlFotoParlamentar,
      partido: s.IdentificacaoParlamentar?.SiglaPartidoParlamentar,
      uf: s.IdentificacaoParlamentar?.UfParlamentar,
      email: s.IdentificacaoParlamentar?.EmailParlamentar,
      sexo: s.IdentificacaoParlamentar?.SexoParlamentar,
      paginaWeb: s.IdentificacaoParlamentar?.UrlPaginaParlamentar,
      bloco: s.IdentificacaoParlamentar?.Bloco?.NomeBloco,
      mandatos: s.Mandato,
    }));

    console.log(`${senadoresFormatados.length} senadores encontrados`);

    return new Response(
      JSON.stringify({ senadores: senadoresFormatados, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao buscar senadores:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
