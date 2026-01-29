import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { juriflix_id, tmdb_id, tipo_tmdb } = await req.json();

    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY não configurada');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let searchTmdbId = tmdb_id;
    let searchTipo = tipo_tmdb;

    // Se não passou tmdb_id, buscar no banco
    if (!searchTmdbId && juriflix_id) {
      const { data } = await supabase
        .from('JURIFLIX')
        .select('tmdb_id, tipo_tmdb')
        .eq('id', juriflix_id)
        .single();

      if (!data?.tmdb_id) {
        throw new Error('Título não possui tmdb_id. Execute enriquecer-juriflix primeiro.');
      }

      searchTmdbId = data.tmdb_id;
      searchTipo = data.tipo_tmdb;
    }

    console.log(`Sincronizando disponibilidade: ${searchTipo} ID ${searchTmdbId}`);

    // Buscar providers no TMDB
    const providersUrl = `${TMDB_BASE_URL}/${searchTipo}/${searchTmdbId}/watch/providers?api_key=${TMDB_API_KEY}`;
    const response = await fetch(providersUrl);
    const data = await response.json();

    const ondeAssistir = data.results?.BR || {};

    // Se tiver providers, adicionar logos completos
    const processProviders = (providers: any[]) => {
      return providers?.map((p: any) => ({
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        logo_path: p.logo_path ? `${TMDB_IMAGE_BASE}${p.logo_path}` : null,
        display_priority: p.display_priority
      })) || [];
    };

    const ondeAssistirProcessado = {
      flatrate: processProviders(ondeAssistir.flatrate),
      rent: processProviders(ondeAssistir.rent),
      buy: processProviders(ondeAssistir.buy),
      link: ondeAssistir.link || null
    };

    // Atualizar no banco se juriflix_id foi fornecido
    if (juriflix_id) {
      const { error: updateError } = await supabase
        .from('JURIFLIX')
        .update({
          onde_assistir: ondeAssistirProcessado,
          ultima_atualizacao: new Date().toISOString()
        })
        .eq('id', juriflix_id);

      if (updateError) {
        console.error('Erro ao atualizar:', updateError);
        throw updateError;
      }

      console.log(`Disponibilidade atualizada para título ${juriflix_id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        onde_assistir: ondeAssistirProcessado
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em sync-disponibilidade-streaming:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});