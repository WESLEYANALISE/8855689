import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAYLIST_ID = "PLVwNANcUXyA_JW1nxVqfElccJ-W79VRAN";

interface YouTubePlaylistItem {
  snippet: {
    resourceId: {
      videoId: string;
    };
    title: string;
    description: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
    publishedAt: string;
    channelTitle: string;
    channelId: string;
  };
  contentDetails?: {
    videoId: string;
  };
}

// Função para converter duração ISO 8601 para formato legível
function parseDuration(isoDuration: string): string {
  if (!isoDuration) return "";
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return isoDuration;
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🎬 [CRON] Iniciando sincronização automática de Audiodescrição...");
    
    const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!youtubeApiKey) {
      throw new Error("YOUTUBE_API_KEY não configurada");
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar vídeos da playlist
    let allVideos: YouTubePlaylistItem[] = [];
    let nextPageToken = "";
    
    do {
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${PLAYLIST_ID}&maxResults=50&key=${youtubeApiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`;
      
      console.log(`📋 Buscando página de vídeos...`);
      const response = await fetch(playlistUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar playlist: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      allVideos = allVideos.concat(data.items || []);
      nextPageToken = data.nextPageToken || "";
      
      console.log(`📹 Encontrados ${data.items?.length || 0} vídeos nesta página`);
    } while (nextPageToken);
    
    console.log(`📊 Total de ${allVideos.length} vídeos na playlist`);
    
    // Filtrar APENAS vídeos que começam com "Audiodescrição"
    const audioDescricaoVideos = allVideos.filter(video => 
      video.snippet.title.toLowerCase().startsWith('audiodescrição')
    );
    
    console.log(`🎧 Vídeos com Audiodescrição: ${audioDescricaoVideos.length} (de ${allVideos.length} total)`);
    
    if (audioDescricaoVideos.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Nenhum vídeo de audiodescrição encontrado",
          processados: 0,
          novos: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Buscar duração de cada vídeo
    const durationsMap = new Map<string, string>();
    const videoIdsList = audioDescricaoVideos.map(v => v.snippet.resourceId.videoId);
    
    for (let i = 0; i < videoIdsList.length; i += 50) {
      const batch = videoIdsList.slice(i, i + 50);
      const videosDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(",")}&key=${youtubeApiKey}`;
      
      console.log(`⏱️ Buscando durações: lote ${Math.floor(i/50) + 1}`);
      const detailsResponse = await fetch(videosDetailsUrl);
      const detailsData = await detailsResponse.json();
      
      for (const video of detailsData.items || []) {
        durationsMap.set(video.id, parseDuration(video.contentDetails?.duration));
      }
    }
    
    // Verificar quais já existem no banco
    const { data: existingDocs } = await supabase
      .from("documentarios_juridicos")
      .select("video_id");
    
    const existingVideoIds = new Set((existingDocs || []).map(d => d.video_id));
    
    // Filtrar apenas novos
    const novosVideos = audioDescricaoVideos.filter(v => 
      !existingVideoIds.has(v.snippet.resourceId.videoId)
    );
    
    console.log(`🆕 Novos vídeos para inserir: ${novosVideos.length}`);
    
    // Inserir novos vídeos
    let inseridos = 0;
    let erros = 0;
    
    for (const item of novosVideos) {
      try {
        const videoId = item.snippet.resourceId.videoId;
        const titulo = item.snippet.title;
        
        const { error } = await supabase
          .from("documentarios_juridicos")
          .insert({
            video_id: videoId,
            titulo: titulo,
            descricao: item.snippet.description?.substring(0, 2000) || null,
            thumbnail: item.snippet.thumbnails?.high?.url || 
                       item.snippet.thumbnails?.medium?.url || 
                       item.snippet.thumbnails?.default?.url,
            duracao: durationsMap.get(videoId) || null,
            publicado_em: item.snippet.publishedAt,
            canal_nome: item.snippet.channelTitle,
            canal_id: item.snippet.channelId,
            categoria: 'destaque',
            visualizacoes: 0
          });
        
        if (error) {
          console.error(`❌ Erro ao inserir ${videoId}: ${error.message}`);
          erros++;
        } else {
          console.log(`✅ Inserido: ${titulo}`);
          inseridos++;
        }
        
        // Pequeno delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Erro ao processar vídeo: ${error}`);
        erros++;
      }
    }
    
    console.log(`🏁 Sincronização concluída: ${inseridos} novos, ${erros} erros`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronização automática concluída`,
        total_playlist: allVideos.length,
        audiodescricao: audioDescricaoVideos.length,
        novos_inseridos: inseridos,
        erros: erros
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("❌ Erro na sincronização automática:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
