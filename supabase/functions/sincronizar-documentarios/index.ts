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

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

// Função para extrair transcrição do YouTube (legendas automáticas)
async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  try {
    console.log(`Buscando transcrição para vídeo: ${videoId}`);
    
    // Buscar página do vídeo para extrair URL das legendas
    const videoPageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    
    if (!videoPageResponse.ok) {
      console.log(`Erro ao buscar página do vídeo: ${videoPageResponse.status}`);
      return [];
    }
    
    const html = await videoPageResponse.text();
    
    // Extrair dados de legendas do player
    const captionsMatch = html.match(/"captions":\s*(\{.*?"captionTracks":\s*\[.*?\].*?\})/s);
    
    if (!captionsMatch) {
      console.log(`Nenhuma legenda encontrada para o vídeo ${videoId}`);
      return [];
    }
    
    try {
      // Tentar encontrar URL da legenda em português ou automática
      const captionsData = captionsMatch[1];
      const urlMatch = captionsData.match(/"baseUrl":\s*"([^"]+)"/);
      
      if (!urlMatch) {
        console.log(`Nenhuma URL de legenda encontrada`);
        return [];
      }
      
      let captionUrl = urlMatch[1].replace(/\\u0026/g, "&");
      
      // Adicionar formato XML3
      if (!captionUrl.includes("fmt=")) {
        captionUrl += "&fmt=json3";
      }
      
      console.log(`URL da legenda: ${captionUrl.substring(0, 100)}...`);
      
      const captionResponse = await fetch(captionUrl);
      
      if (!captionResponse.ok) {
        console.log(`Erro ao buscar legendas: ${captionResponse.status}`);
        return [];
      }
      
      const captionData = await captionResponse.json();
      
      if (captionData.events) {
        const segments: TranscriptSegment[] = [];
        
        for (const event of captionData.events) {
          if (event.segs) {
            const text = event.segs.map((seg: any) => seg.utf8 || "").join("");
            if (text.trim()) {
              segments.push({
                text: text.trim(),
                start: (event.tStartMs || 0) / 1000,
                duration: (event.dDurationMs || 0) / 1000
              });
            }
          }
        }
        
        console.log(`Extraídos ${segments.length} segmentos de transcrição`);
        return segments;
      }
      
      return [];
    } catch (parseError) {
      console.log(`Erro ao processar legendas: ${parseError}`);
      return [];
    }
  } catch (error) {
    console.error(`Erro ao buscar transcrição: ${error}`);
    return [];
  }
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
    console.log("Iniciando sincronização de documentários jurídicos...");
    
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
      
      console.log(`Buscando página de vídeos...`);
      const response = await fetch(playlistUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar playlist: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      allVideos = allVideos.concat(data.items || []);
      nextPageToken = data.nextPageToken || "";
      
      console.log(`Encontrados ${data.items?.length || 0} vídeos nesta página`);
    } while (nextPageToken);
    
    console.log(`Total de ${allVideos.length} vídeos na playlist`);
    
    // Filtrar duplicatas: preferir versão "Audiodescrição" quando existir
    const videosByBaseTitle = new Map<string, YouTubePlaylistItem>();
    
    for (const video of allVideos) {
      const titulo = video.snippet.title;
      // Extrair título base removendo prefixos de audiodescrição
      const baseTitle = titulo
        .replace(/^Audiodescrição\s*\|\s*/i, "")
        .replace(/\s*\|\s*Audiodescrição$/i, "")
        .replace(/^\[Audiodescrição\]\s*/i, "")
        .trim();
      
      const isAudiovisual = /audiodescrição/i.test(titulo);
      const existing = videosByBaseTitle.get(baseTitle);
      
      if (!existing) {
        videosByBaseTitle.set(baseTitle, video);
      } else {
        // Se o novo tem audiodescrição e o existente não, substituir
        const existingIsAudiovisual = /audiodescrição/i.test(existing.snippet.title);
        if (isAudiovisual && !existingIsAudiovisual) {
          console.log(`Preferindo versão audiovisual: ${titulo}`);
          videosByBaseTitle.set(baseTitle, video);
        }
      }
    }
    
    const filteredVideos = Array.from(videosByBaseTitle.values());
    console.log(`Após filtrar duplicatas: ${filteredVideos.length} vídeos únicos (de ${allVideos.length} originais)`);
    
    // Buscar duração de cada vídeo (em lotes de 50 para não exceder limite da API)
    const durationsMap = new Map<string, string>();
    const videoIdsList = filteredVideos.map(v => v.snippet.resourceId.videoId);
    
    for (let i = 0; i < videoIdsList.length; i += 50) {
      const batch = videoIdsList.slice(i, i + 50);
      const videosDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(",")}&key=${youtubeApiKey}`;
      
      console.log(`Buscando durações: lote ${Math.floor(i/50) + 1}`);
      const detailsResponse = await fetch(videosDetailsUrl);
      const detailsData = await detailsResponse.json();
      
      for (const video of detailsData.items || []) {
        durationsMap.set(video.id, parseDuration(video.contentDetails?.duration));
      }
    }
    
    console.log(`Durações obtidas para ${durationsMap.size} vídeos`);
    
    // Processar cada vídeo
    const results = {
      processados: 0,
      erros: 0,
      transcricoesExtraidas: 0,
      duplicatasRemovidas: allVideos.length - filteredVideos.length
    };
    
    for (const item of filteredVideos) {
      try {
        const videoId = item.snippet.resourceId.videoId;
        const titulo = item.snippet.title;
        
        console.log(`Processando: ${titulo}`);
        
        // Buscar transcrição
        const transcricao = await fetchTranscript(videoId);
        const transcricaoTexto = transcricao.map(s => s.text).join(" ");
        
        if (transcricao.length > 0) {
          results.transcricoesExtraidas++;
        }
        
        // Upsert no banco
        const { error } = await supabase
          .from("documentarios_juridicos")
          .upsert({
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
            transcricao: transcricao.length > 0 ? transcricao : [],
            transcricao_texto: transcricaoTexto || null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: "video_id"
          });
        
        if (error) {
          console.error(`Erro ao salvar ${videoId}: ${error.message}`);
          results.erros++;
        } else {
          results.processados++;
        }
        
        // Pequeno delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Erro ao processar vídeo: ${error}`);
        results.erros++;
      }
    }
    
    // Limpar registros não-audiovisual que têm versão audiovisual
    const videoIdsToKeep = new Set(filteredVideos.map(v => v.snippet.resourceId.videoId));
    
    const { data: allDbDocs } = await supabase
      .from("documentarios_juridicos")
      .select("id, video_id, titulo");
    
    if (allDbDocs) {
      const idsToDelete: string[] = [];
      for (const doc of allDbDocs) {
        if (!videoIdsToKeep.has(doc.video_id)) {
          console.log(`Marcando para deletar duplicata: ${doc.titulo}`);
          idsToDelete.push(doc.id);
        }
      }
      
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("documentarios_juridicos")
          .delete()
          .in("id", idsToDelete);
        
        if (!deleteError) {
          console.log(`Deletados ${idsToDelete.length} duplicados`);
          results.duplicatasRemovidas = idsToDelete.length;
        }
      }
    }
    
    console.log(`Sincronização concluída: ${JSON.stringify(results)}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronização concluída`,
        ...results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Erro na sincronização:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
