import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAYLIST_ID = "PLRWLTjEPYOOH8v4ma7dd3CO2v194EdEcJ";

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  position: number;
  publishedAt: string;
}

async function fetchPlaylistVideos(apiKey: string): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = [];
  let nextPageToken = "";
  
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${PLAYLIST_ID}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.text();
      console.error("YouTube API error:", error);
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    for (const item of data.items || []) {
      const snippet = item.snippet;
      videos.push({
        videoId: snippet.resourceId?.videoId || item.contentDetails?.videoId,
        title: snippet.title,
        description: snippet.description || "",
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "",
        position: snippet.position,
        publishedAt: snippet.publishedAt,
      });
    }
    
    nextPageToken = data.nextPageToken || "";
  } while (nextPageToken);
  
  return videos;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    
    if (!apiKey) {
      throw new Error("YOUTUBE_API_KEY não configurada");
    }
    
    console.log("Buscando vídeos da playlist de videoaulas iniciante...");
    
    const videos = await fetchPlaylistVideos(apiKey);
    
    console.log(`Encontrados ${videos.length} vídeos`);
    
    if (videos.length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        message: "Nenhum vídeo encontrado na playlist",
        total: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Inserir/atualizar cada vídeo
    let inserted = 0;
    let updated = 0;
    
    for (const video of videos) {
      const { data: existing } = await supabase
        .from("videoaulas_iniciante")
        .select("id")
        .eq("video_id", video.videoId)
        .maybeSingle();
      
      if (existing) {
        // Atualizar
        const { error } = await supabase
          .from("videoaulas_iniciante")
          .update({
            titulo: video.title,
            descricao: video.description,
            thumbnail: video.thumbnail,
            ordem: video.position + 1, // 1-indexed
            publicado_em: video.publishedAt,
          })
          .eq("video_id", video.videoId);
        
        if (!error) updated++;
      } else {
        // Inserir
        const { error } = await supabase
          .from("videoaulas_iniciante")
          .insert({
            video_id: video.videoId,
            titulo: video.title,
            descricao: video.description,
            thumbnail: video.thumbnail,
            ordem: video.position + 1,
            playlist_id: PLAYLIST_ID,
            publicado_em: video.publishedAt,
          });
        
        if (!error) inserted++;
      }
    }
    
    console.log(`Sincronização concluída: ${inserted} inseridos, ${updated} atualizados`);
    
    return new Response(JSON.stringify({ 
      success: true,
      total: videos.length,
      inserted,
      updated,
      message: `Sincronização concluída: ${inserted} novos, ${updated} atualizados`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido",
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
