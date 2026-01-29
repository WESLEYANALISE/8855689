import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string;
  backdrop_path?: string;
  media_type?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  original_title?: string;
  original_name?: string;
  tagline?: string;
  runtime?: number;
  episode_run_time?: number[];
  budget?: number;
  revenue?: number;
  original_language?: string;
  genres?: Array<{ id: number; name: string }>;
  credits?: {
    cast?: Array<{ name: string; character: string; profile_path?: string }>;
    crew?: Array<{ name: string; job: string }>;
  };
  videos?: {
    results?: Array<{
      key: string;
      site: string;
      type: string;
      name: string;
      official: boolean;
    }>;
  };
  recommendations?: {
    results?: Array<{ id: number; title?: string; name?: string; poster_path?: string }>;
  };
  "watch/providers"?: {
    results?: {
      BR?: {
        flatrate?: Array<{ provider_name: string; logo_path: string; provider_id: number }>;
        rent?: Array<{ provider_name: string; logo_path: string; provider_id: number }>;
        buy?: Array<{ provider_name: string; logo_path: string; provider_id: number }>;
      };
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { juriflix_id, titulo, ano, force } = await req.json();

    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY não configurada');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar título no banco
    const { data: titulo_db, error: fetchError } = await supabase
      .from('JURIFLIX')
      .select('*')
      .eq('id', juriflix_id)
      .single();

    if (fetchError || !titulo_db) {
      throw new Error('Título não encontrado no banco');
    }

    // Se já enriquecido e não force, retornar
    if (!force && titulo_db.tmdb_id && titulo_db.ultima_atualizacao) {
      const lastUpdate = new Date(titulo_db.ultima_atualizacao);
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate < 7) {
        return new Response(
          JSON.stringify({ 
            message: 'Título já enriquecido recentemente',
            data: titulo_db 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const searchTitulo = titulo || titulo_db.nome;
    const searchAno = ano || titulo_db.ano;

    console.log(`Buscando no TMDB: ${searchTitulo} (${searchAno})`);

    // Buscar no TMDB
    const searchUrl = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTitulo)}&language=pt-BR&year=${searchAno}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.results || searchData.results.length === 0) {
      throw new Error('Título não encontrado no TMDB');
    }

    const result = searchData.results[0];
    const mediaType = result.media_type === 'tv' ? 'tv' : 'movie';
    const tmdbId = result.id;

    console.log(`Encontrado: ${mediaType} ID ${tmdbId}`);

    // Buscar detalhes completos
    const detailsUrl = `${TMDB_BASE_URL}/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=credits,videos,recommendations,watch/providers`;
    const detailsResponse = await fetch(detailsUrl);
    const details: TMDBSearchResult = await detailsResponse.json();

    // Extrair elenco (top 10)
    const elenco = details.credits?.cast?.slice(0, 10).map(actor => ({
      nome: actor.name,
      personagem: actor.character,
      foto: actor.profile_path ? `${TMDB_IMAGE_BASE}${actor.profile_path}` : null
    })) || [];

    // Extrair diretor
    const diretor = details.credits?.crew?.find(person => person.job === 'Director')?.name || null;

    // Extrair gêneros
    const generos = details.genres?.map(g => g.name) || [];

    // Extrair vídeos (trailers oficiais primeiro)
    const videos = details.videos?.results
      ?.filter(v => v.site === 'YouTube')
      ?.sort((a, b) => {
        if (a.official && !b.official) return -1;
        if (!a.official && b.official) return 1;
        if (a.type === 'Trailer' && b.type !== 'Trailer') return -1;
        if (a.type !== 'Trailer' && b.type === 'Trailer') return 1;
        return 0;
      })
      ?.slice(0, 5)
      ?.map(v => ({
        chave: v.key,
        nome: v.name,
        tipo: v.type,
        site: v.site,
        url: `https://www.youtube.com/embed/${v.key}`
      })) || [];

    // Extrair onde assistir (Brasil)
    const ondeAssistir = details["watch/providers"]?.results?.BR || {};

    // Extrair similares
    const similares = details.recommendations?.results?.slice(0, 6).map(r => ({
      tmdb_id: r.id,
      titulo: r.title || r.name,
      poster: r.poster_path ? `${TMDB_IMAGE_BASE}${r.poster_path}` : null
    })) || [];

    // Preparar dados para atualização
    const updateData = {
      tmdb_id: tmdbId,
      tipo_tmdb: mediaType,
      poster_path: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : null,
      backdrop_path: details.backdrop_path ? `${TMDB_IMAGE_BASE}${details.backdrop_path}` : null,
      titulo_original: details.original_title || details.original_name,
      popularidade: details.popularity,
      votos_count: details.vote_count,
      elenco,
      diretor,
      generos,
      duracao: details.runtime || (details.episode_run_time?.[0]),
      orcamento: details.budget || null,
      bilheteria: details.revenue || null,
      tagline: details.tagline,
      idioma_original: details.original_language,
      videos,
      onde_assistir: ondeAssistir,
      similares,
      ultima_atualizacao: new Date().toISOString()
    };

    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('JURIFLIX')
      .update(updateData)
      .eq('id', juriflix_id);

    if (updateError) {
      console.error('Erro ao atualizar:', updateError);
      throw updateError;
    }

    console.log(`Título ${juriflix_id} enriquecido com sucesso!`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Título enriquecido com sucesso',
        data: updateData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em enriquecer-juriflix:', error);
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