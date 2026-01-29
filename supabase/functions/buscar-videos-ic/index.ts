import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de fallback com chaves API (mesmas usadas para YouTube API)
const API_KEYS = [
  Deno.env.get('YOUTUBE_API_KEY'),
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

// Playlists do canal IC Investigação Criminal
const PLAYLISTS = {
  familiares: {
    id: 'PLM8urkUnySVCBa0RbiPrBNrdY8wGUmeOs',
    categoria: 'familiares',
    nome: 'Crimes Familiares'
  },
  passionais: {
    id: 'PLM8urkUnySVCuxMZNHL6QzvYv6rMWOuqT',
    categoria: 'passionais',
    nome: 'Crimes Passionais'
  }
};

async function fetchPlaylistVideos(playlistId: string, apiKeys: string[]) {
  const videos: any[] = [];
  let nextPageToken = '';
  
  // Tentar cada chave API com fallback
  let workingApiKey = '';
  let data: any = null;
  
  do {
    data = null;
    
    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = workingApiKey || apiKeys[i];
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      try {
        const response = await fetch(url);
        
        if (response.ok) {
          data = await response.json();
          workingApiKey = apiKey; // Guardar a chave que funcionou
          console.log(`Chave ${i + 1} funcionou!`);
          break;
        }
        
        const errorText = await response.text();
        console.error(`Chave ${i + 1} falhou (${response.status}):`, errorText);
        
        if (response.status === 429 || response.status === 403) {
          continue;
        }
        continue;
      } catch (err) {
        console.error(`Erro com chave ${i + 1}:`, err);
        continue;
      }
    }
    
    if (!data) {
      console.error('Todas as chaves falharam para a playlist', playlistId);
      break;
    }
    
    for (const item of data.items || []) {
      const snippet = item.snippet;
      if (!snippet) continue;
      
      videos.push({
        video_id: item.contentDetails?.videoId || snippet.resourceId?.videoId,
        titulo: snippet.title,
        descricao: snippet.description,
        thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url,
        publicado_em: snippet.publishedAt,
        canal_nome: 'IC Investigação Criminal',
        canal_id: 'UCDN9trGkW4NiznUCUhHcSmg'
      });
    }
    
    nextPageToken = data.nextPageToken || '';
  } while (nextPageToken);
  
  return videos;
}

async function getVideoDurations(videoIds: string[], apiKeys: string[]): Promise<Record<string, string>> {
  const durations: Record<string, string> = {};
  
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    
    for (const apiKey of apiKeys) {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(',')}&key=${apiKey}`;
      
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        
        const data = await response.json();
        
        for (const item of data.items || []) {
          const duration = item.contentDetails?.duration;
          if (duration) {
            const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (match) {
              const hours = parseInt(match[1] || '0');
              const minutes = parseInt(match[2] || '0');
              const seconds = parseInt(match[3] || '0');
              
              if (hours > 0) {
                durations[item.id] = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
              } else {
                durations[item.id] = `${minutes}:${String(seconds).padStart(2, '0')}`;
              }
            }
          }
        }
        break; // Chave funcionou
      } catch (err) {
        continue;
      }
    }
  }
  
  return durations;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { categoria } = await req.json().catch(() => ({}));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('API Keys disponíveis:', API_KEYS.length);
    
    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave API configurada');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const playlistsToProcess = categoria 
      ? [PLAYLISTS[categoria as keyof typeof PLAYLISTS]]
      : Object.values(PLAYLISTS);
    
    const results = {
      total_processados: 0,
      novos_inseridos: 0,
      erros: [] as string[]
    };
    
    for (const playlist of playlistsToProcess) {
      if (!playlist) continue;
      
      console.log(`Processando playlist: ${playlist.nome} (${playlist.id})`);
      
      // Buscar vídeos da playlist
      const videos = await fetchPlaylistVideos(playlist.id, API_KEYS);
      console.log(`Encontrados ${videos.length} vídeos na playlist ${playlist.nome}`);
      
      if (videos.length === 0) continue;
      
      // Buscar durações
      const videoIds = videos.map(v => v.video_id).filter(Boolean);
      const durations = await getVideoDurations(videoIds, API_KEYS);
      
      // Processar cada vídeo
      for (const video of videos) {
        if (!video.video_id || video.titulo === 'Private video' || video.titulo === 'Deleted video') {
          continue;
        }
        
        results.total_processados++;
        
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('documentarios_juridicos')
          .select('id')
          .eq('video_id', video.video_id)
          .single();
        
        if (existing) {
          // Atualizar categoria se necessário
          await supabase
            .from('documentarios_juridicos')
            .update({ categoria: playlist.categoria })
            .eq('video_id', video.video_id);
          continue;
        }
        
        // Inserir novo
        const { error } = await supabase
          .from('documentarios_juridicos')
          .insert({
            video_id: video.video_id,
            titulo: video.titulo,
            descricao: video.descricao,
            thumbnail: video.thumbnail,
            duracao: durations[video.video_id] || null,
            publicado_em: video.publicado_em,
            canal_nome: video.canal_nome,
            canal_id: video.canal_id,
            categoria: playlist.categoria,
            visualizacoes: 0
          });
        
        if (error) {
          console.error(`Erro ao inserir vídeo ${video.video_id}:`, error);
          results.erros.push(`${video.titulo}: ${error.message}`);
        } else {
          results.novos_inseridos++;
        }
      }
    }
    
    console.log('Resultado final:', results);
    
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error: unknown) {
    console.error('Erro na função:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
