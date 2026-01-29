import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🎬 Iniciando busca de playlists dos tribunais...');

    // Buscar canais ativos
    const { data: canais, error: canaisError } = await supabase
      .from('canais_audiencias')
      .select('*')
      .eq('ativo', true);

    if (canaisError) {
      console.error('Erro ao buscar canais:', canaisError);
      throw canaisError;
    }

    console.log(`📺 ${canais.length} canais encontrados`);

    let totalPlaylists = 0;
    let novasPlaylists = 0;
    const resultadosPorCanal: Record<string, number> = {};

    for (const canal of canais) {
      try {
        console.log(`\n🔍 Buscando playlists do canal ${canal.nome} (${canal.tribunal})...`);
        
        // Buscar playlists do canal via YouTube API
        const playlistsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${canal.channel_id}&maxResults=50&key=${youtubeApiKey}`;
        
        const response = await fetch(playlistsUrl);
        const data = await response.json();

        if (data.error) {
          console.error(`Erro YouTube API para ${canal.nome}:`, data.error);
          continue;
        }

        const playlists = data.items || [];
        console.log(`📋 ${playlists.length} playlists encontradas para ${canal.tribunal}`);

        for (const playlist of playlists) {
          const playlistId = playlist.id;
          const titulo = playlist.snippet?.title || 'Sem título';
          const descricao = playlist.snippet?.description || null;
          const thumbnail = playlist.snippet?.thumbnails?.high?.url || 
                           playlist.snippet?.thumbnails?.medium?.url || 
                           playlist.snippet?.thumbnails?.default?.url;
          const videoCount = playlist.contentDetails?.itemCount || 0;
          const publicadoEm = playlist.snippet?.publishedAt || null;

          // Verificar se a playlist já existe
          const { data: existing } = await supabase
            .from('audiencias_playlists')
            .select('id')
            .eq('playlist_id', playlistId)
            .single();

          if (existing) {
            // Atualizar playlist existente
            await supabase
              .from('audiencias_playlists')
              .update({
                titulo,
                descricao,
                thumbnail,
                video_count: videoCount,
              })
              .eq('playlist_id', playlistId);
          } else {
            // Inserir nova playlist
            const { error: insertError } = await supabase
              .from('audiencias_playlists')
              .insert({
                canal_id: canal.id,
                playlist_id: playlistId,
                titulo,
                descricao,
                thumbnail,
                video_count: videoCount,
                publicado_em: publicadoEm,
              });

            if (!insertError) {
              novasPlaylists++;
            } else {
              console.error(`Erro ao inserir playlist ${playlistId}:`, insertError);
            }
          }

          totalPlaylists++;
        }

        resultadosPorCanal[canal.tribunal] = playlists.length;

      } catch (error) {
        console.error(`Erro ao processar canal ${canal.nome}:`, error);
      }
    }

    console.log(`\n✅ Processamento concluído!`);
    console.log(`📊 Total: ${totalPlaylists} playlists processadas, ${novasPlaylists} novas`);

    return new Response(
      JSON.stringify({
        success: true,
        totalPlaylists,
        novasPlaylists,
        resultadosPorCanal,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
