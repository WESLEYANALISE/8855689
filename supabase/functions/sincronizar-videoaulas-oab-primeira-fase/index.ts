import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento das 20 playlists da OAB 1ª Fase
const PLAYLISTS_OAB = [
  { area: "Ética Profissional / Estatuto da OAB", playlistId: "PL8vXuI6zmpdgwsu0I9WOuMgSBUx98rdyL" },
  { area: "Filosofia do Direito", playlistId: "PL8vXuI6zmpdi47p3ijoTP0dECj2hoC-pN" },
  { area: "Direito Constitucional", playlistId: "PL8vXuI6zmpdibFGqx6usUu1Htsa6X5YvC" },
  { area: "Direitos Humanos", playlistId: "PL8vXuI6zmpdiICouL1IyYyuWe5i4HotYt" },
  { area: "Direito Eleitoral", playlistId: "PL8vXuI6zmpdgq9XEO_Wvn_fHuGH-J88nV" },
  { area: "Direito Internacional", playlistId: "PL8vXuI6zmpdhuNo11n7argrPtoELeJpSC" },
  { area: "Direito Financeiro", playlistId: "PL2CHFA_bGrZ9HRF4DQ6Y_ct0DwOBAS2cw" },
  { area: "Direito Tributário", playlistId: "PL8vXuI6zmpdi4O_2o3z6FLQ3b0F4PxhLx" },
  { area: "Direito Administrativo", playlistId: "PL8vXuI6zmpdhX27XZG8wqPSgtMy7MSUcq" },
  { area: "Direito Ambiental", playlistId: "PL8vXuI6zmpdhSq3aFFLkGtF43bg7Yo13y" },
  { area: "Direito Civil", playlistId: "PL8vXuI6zmpdhX8g2wnvM0lqk7pdHhpCUU" },
  { area: "ECA", playlistId: "PL8vXuI6zmpdjLxIns5TqSwJtrm3krojzQ" },
  { area: "Direito do Consumidor", playlistId: "PL8vXuI6zmpdg1NC8BKKXnkqWGr2KiMTut" },
  { area: "Direito Empresarial", playlistId: "PL8vXuI6zmpdiJcZ5w36q-Fl1LNNwkuM8E" },
  { area: "Processo Civil", playlistId: "PL8vXuI6zmpdhOjBmtGiCcerDadAn-Xu2c" },
  { area: "Direito Penal", playlistId: "PL8vXuI6zmpdh8CF2fer38Uosf1phfUbH8" },
  { area: "Processo Penal", playlistId: "PL8vXuI6zmpdi6eQjQBgY0u_VNEl6f9p8Y" },
  { area: "Direito Previdenciário", playlistId: "PL8vXuI6zmpdgKdvgqV9QVKp7COhTva5cJ" },
  { area: "Direito do Trabalho", playlistId: "PL8vXuI6zmpdiUdKYB4fI89MnKd6FWYeJq" },
  { area: "Processo do Trabalho", playlistId: "PL8vXuI6zmpdiUdKYB4fI89MnKd6FWYeJq" },
];

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  position: number;
  publishedAt: string;
}

// Sistema de fallback com 3 chaves API
const getApiKeys = (): string[] => {
  const keys = [
    Deno.env.get('YOUTUBE_API_KEY'),
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
    Deno.env.get('GEMINI_KEY_3'),
  ].filter(Boolean) as string[];
  return keys;
};

async function fetchPlaylistVideos(playlistId: string, apiKeys: string[]): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = [];
  let nextPageToken = "";
  let lastError = "";
  
  do {
    let data: any = null;
    
    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i];
      try {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`;
        
        const response = await fetch(url);
        
        if (response.ok) {
          data = await response.json();
          break;
        }
        
        lastError = await response.text();
        console.log(`Chave ${i + 1} falhou para playlist ${playlistId}: ${response.status}`);
        
        if (response.status === 429 || response.status === 403) {
          continue;
        }
      } catch (err) {
        console.error(`Erro com chave ${i + 1}:`, err);
        lastError = err instanceof Error ? err.message : String(err);
        continue;
      }
    }
    
    if (!data) {
      console.error(`Falha ao buscar playlist ${playlistId}: ${lastError}`);
      break;
    }
    
    for (const item of data.items || []) {
      const snippet = item.snippet;
      // Ignorar vídeos privados ou deletados
      if (snippet.title === "Private video" || snippet.title === "Deleted video") {
        continue;
      }
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
    const apiKeys = getApiKeys();
    
    if (apiKeys.length === 0) {
      throw new Error("Nenhuma chave API do YouTube configurada");
    }
    
    console.log(`Iniciando sincronização de ${PLAYLISTS_OAB.length} playlists OAB 1ª Fase`);
    console.log(`${apiKeys.length} chaves API disponíveis`);
    
    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    const areaStats: Record<string, { inserted: number; updated: number; total: number }> = {};
    
    // Processar cada playlist
    for (const playlist of PLAYLISTS_OAB) {
      console.log(`\nProcessando: ${playlist.area} (${playlist.playlistId})`);
      
      try {
        const videos = await fetchPlaylistVideos(playlist.playlistId, apiKeys);
        console.log(`  ${videos.length} vídeos encontrados`);
        
        let areaInserted = 0;
        let areaUpdated = 0;
        
        for (const video of videos) {
          // Verificar se o vídeo já existe
          const { data: existing } = await supabase
            .from("videoaulas_oab_primeira_fase")
            .select("id, transcricao, sobre_aula, flashcards, questoes")
            .eq("video_id", video.videoId)
            .maybeSingle();
          
          if (existing) {
            // Atualizar metadados, preservando conteúdo gerado
            const { error } = await supabase
              .from("videoaulas_oab_primeira_fase")
              .update({
                titulo: video.title,
                descricao: video.description,
                thumbnail: video.thumbnail,
                ordem: video.position,
                publicado_em: video.publishedAt,
                // Manter área original se já existe (pode ter sido corrigida manualmente)
              })
              .eq("video_id", video.videoId);
            
            if (!error) {
              areaUpdated++;
              totalUpdated++;
            }
          } else {
            // Inserir novo vídeo
            const { error } = await supabase
              .from("videoaulas_oab_primeira_fase")
              .insert({
                video_id: video.videoId,
                playlist_id: playlist.playlistId,
                area: playlist.area,
                titulo: video.title,
                descricao: video.description,
                thumbnail: video.thumbnail,
                ordem: video.position,
                publicado_em: video.publishedAt,
              });
            
            if (!error) {
              areaInserted++;
              totalInserted++;
            } else {
              console.error(`Erro ao inserir vídeo ${video.videoId}:`, error);
            }
          }
        }
        
        areaStats[playlist.area] = {
          inserted: areaInserted,
          updated: areaUpdated,
          total: videos.length,
        };
        
        console.log(`  ✓ ${areaInserted} novos, ${areaUpdated} atualizados`);
        
      } catch (err) {
        console.error(`Erro ao processar ${playlist.area}:`, err);
        totalErrors++;
        areaStats[playlist.area] = { inserted: 0, updated: 0, total: 0 };
      }
    }
    
    console.log(`\n=== Sincronização concluída ===`);
    console.log(`Total: ${totalInserted} novos, ${totalUpdated} atualizados, ${totalErrors} erros`);
    
    return new Response(JSON.stringify({
      success: true,
      totalInserted,
      totalUpdated,
      totalErrors,
      areaStats,
      message: `Sincronização concluída: ${totalInserted} novos vídeos, ${totalUpdated} atualizados`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Erro na sincronização:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Erro desconhecido",
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
