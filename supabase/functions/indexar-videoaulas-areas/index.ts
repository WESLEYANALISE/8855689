import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de fallback com 3 chaves API
const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

// Todas as playlists das áreas do Direito
const AREAS_PLAYLISTS = [
  {
    nome: "Direito Constitucional",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdjPm0avPxNZEQ2Vz4zLCCLV",
    playlistId: "PL8vXuI6zmpdjPm0avPxNZEQ2Vz4zLCCLV"
  },
  {
    nome: "Direito Administrativo",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdhnwRaWsrvGpy1l0GQyfbze",
    playlistId: "PL8vXuI6zmpdhnwRaWsrvGpy1l0GQyfbze"
  },
  {
    nome: "Direito Civil",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdjH76qE2cZPWh11jwgvItA9",
    playlistId: "PL8vXuI6zmpdjH76qE2cZPWh11jwgvItA9"
  },
  {
    nome: "Direito Processual Civil",
    playlistUrl: "https://youtu.be/a2xbuchfMeg",
    playlistId: "a2xbuchfMeg",
    isVideo: true
  },
  {
    nome: "Direito Penal",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdh8CF2fer38Uosf1phfUbH8",
    playlistId: "PL8vXuI6zmpdh8CF2fer38Uosf1phfUbH8"
  },
  {
    nome: "Direito Processual Penal",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdi6eQjQBgY0u_VNEl6f9p8Y",
    playlistId: "PL8vXuI6zmpdi6eQjQBgY0u_VNEl6f9p8Y"
  },
  {
    nome: "Direito do Trabalho",
    playlistUrl: "https://youtube.com/playlist?list=PLX-4skTGVrWVvoqVeEOlZIRg3EjYJ6xev",
    playlistId: "PLX-4skTGVrWVvoqVeEOlZIRg3EjYJ6xev"
  },
  {
    nome: "Direito Processual do Trabalho",
    playlistUrl: "https://youtube.com/playlist?list=PLViPh7AHXAPK4dDmjdv-a2CQw-_d8gB6X",
    playlistId: "PLViPh7AHXAPK4dDmjdv-a2CQw-_d8gB6X"
  },
  {
    nome: "Direito Tributário",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdi4O_2o3z6FLQ3b0F4PxhLx",
    playlistId: "PL8vXuI6zmpdi4O_2o3z6FLQ3b0F4PxhLx"
  },
  {
    nome: "Direito Empresarial",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdgVe7xwycNvHPtxLm7kzowJ",
    playlistId: "PL8vXuI6zmpdgVe7xwycNvHPtxLm7kzowJ"
  },
  {
    nome: "Direito do Consumidor",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdh6ZArA4hyd1EEF6b9iXtPS",
    playlistId: "PL8vXuI6zmpdh6ZArA4hyd1EEF6b9iXtPS"
  },
  {
    nome: "Direito Ambiental",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdjF0s1ovNzxOkEa_KfW36uA",
    playlistId: "PL8vXuI6zmpdjF0s1ovNzxOkEa_KfW36uA"
  },
  {
    nome: "Direitos Humanos",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdjbNcTIE7djtSjSOwnsM5pV",
    playlistId: "PL8vXuI6zmpdjbNcTIE7djtSjSOwnsM5pV"
  },
  {
    nome: "Direito Internacional",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdhuNo11n7argrPtoELeJpSC",
    playlistId: "PL8vXuI6zmpdhuNo11n7argrPtoELeJpSC"
  },
  {
    nome: "Direito Previdenciário",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdgKdvgqV9QVKp7COhTva5cJ",
    playlistId: "PL8vXuI6zmpdgKdvgqV9QVKp7COhTva5cJ"
  },
  {
    nome: "Direito Eleitoral",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdgq9XEO_Wvn_fHuGH-J88nV",
    playlistId: "PL8vXuI6zmpdgq9XEO_Wvn_fHuGH-J88nV"
  },
  {
    nome: "Estatuto da Criança e do Adolescente (ECA)",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdjLxIns5TqSwJtrm3krojzQ",
    playlistId: "PL8vXuI6zmpdjLxIns5TqSwJtrm3krojzQ"
  },
  {
    nome: "Direito Financeiro",
    playlistUrl: "https://youtube.com/playlist?list=PL2CHFA_bGrZ9HRF4DQ6Y_ct0DwOBAS2cw",
    playlistId: "PL2CHFA_bGrZ9HRF4DQ6Y_ct0DwOBAS2cw"
  }
];

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  position: number;
}

// Buscar vídeos de uma playlist
async function fetchPlaylistVideos(playlistId: string, apiKeys: string[]): Promise<YouTubeVideo[]> {
  let allVideos: YouTubeVideo[] = [];
  let nextPageToken: string | undefined;
  
  do {
    let data: any = null;
    let lastError = '';
    
    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i];
      
      try {
        let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
        if (nextPageToken) {
          url += `&pageToken=${nextPageToken}`;
        }
        
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
    
    const videos = data.items.map((item: any, index: number) => ({
      videoId: item.contentDetails.videoId,
      title: item.snippet.title,
      description: item.snippet.description || '',
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      publishedAt: item.snippet.publishedAt,
      position: item.snippet.position ?? index,
    }));
    
    allVideos = [...allVideos, ...videos];
    nextPageToken = data.nextPageToken;
    
  } while (nextPageToken);
  
  return allVideos;
}

// Buscar dados de um vídeo único
async function fetchSingleVideo(videoId: string, apiKeys: string[]): Promise<YouTubeVideo | null> {
  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          return {
            videoId: item.id,
            title: item.snippet.title,
            description: item.snippet.description || '',
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
            publishedAt: item.snippet.publishedAt,
            position: 0,
          };
        }
      }
    } catch (err) {
      console.error(`Erro ao buscar vídeo ${videoId}:`, err);
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave API configurada');
    }

    // Verificar se foi passada uma área específica
    let targetAreas = AREAS_PLAYLISTS;
    try {
      const body = await req.json();
      if (body?.area) {
        targetAreas = AREAS_PLAYLISTS.filter(p => 
          p.nome.toLowerCase().includes(body.area.toLowerCase())
        );
      }
    } catch {
      // Sem body, processar todas as áreas
    }

    console.log(`Iniciando indexação de ${targetAreas.length} áreas...`);

    const results: { area: string; videos: number; status: string }[] = [];
    let totalVideos = 0;

    for (const area of targetAreas) {
      console.log(`\n📚 Processando: ${area.nome}`);
      
      try {
        let videos: YouTubeVideo[] = [];
        
        if ((area as any).isVideo) {
          // É um vídeo único, não uma playlist
          const video = await fetchSingleVideo(area.playlistId, API_KEYS);
          if (video) {
            videos = [video];
          }
        } else {
          // É uma playlist
          videos = await fetchPlaylistVideos(area.playlistId, API_KEYS);
        }
        
        console.log(`  ✅ ${videos.length} vídeos encontrados`);
        
        if (videos.length === 0) {
          results.push({ area: area.nome, videos: 0, status: 'empty' });
          continue;
        }
        
        // Inserir/atualizar vídeos no banco
        const videosToInsert = videos.map((v, idx) => ({
          video_id: v.videoId,
          titulo: v.title,
          descricao: v.description?.substring(0, 2000) || null,
          area: area.nome,
          playlist_id: (area as any).isVideo ? null : area.playlistId,
          thumb: v.thumbnail,
          publicado_em: v.publishedAt,
          ordem: v.position ?? idx,
        }));
        
        // Upsert em lotes de 50
        for (let i = 0; i < videosToInsert.length; i += 50) {
          const batch = videosToInsert.slice(i, i + 50);
          
          const { error } = await supabase
            .from('videoaulas_areas_direito')
            .upsert(batch, {
              onConflict: 'video_id,area',
              ignoreDuplicates: false
            });
          
          if (error) {
            console.error(`  ❌ Erro ao inserir lote: ${error.message}`);
            throw error;
          }
        }
        
        totalVideos += videos.length;
        results.push({ area: area.nome, videos: videos.length, status: 'success' });
        console.log(`  💾 ${videos.length} vídeos salvos no banco`);
        
        // Pequeno delay entre playlists para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`  ❌ Erro ao processar ${area.nome}:`, error);
        results.push({ 
          area: area.nome, 
          videos: 0, 
          status: `error: ${error instanceof Error ? error.message : 'unknown'}`
        });
      }
    }

    console.log(`\n✨ Indexação concluída! Total: ${totalVideos} vídeos`);

    return new Response(
      JSON.stringify({
        success: true,
        totalVideos,
        areas: results,
        message: `${totalVideos} vídeos indexados de ${results.filter(r => r.status === 'success').length} áreas`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função indexar-videoaulas-areas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
