import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de fallback com múltiplas chaves API
const API_KEYS = [
  Deno.env.get('YOUTUBE_API_KEY'),
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

// Termos de busca por orientação política
const SEARCH_QUERIES: Record<string, string[]> = {
  esquerda: [
    'documentário movimentos sociais Brasil',
    'documentário reforma agrária MST',
    'documentário sindicalismo brasileiro',
    'documentário desigualdade social Brasil',
  ],
  centro: [
    'documentário democracia Brasil',
    'documentário sistema político brasileiro',
    'documentário constituição 1988',
    'documentário história república Brasil',
  ],
  direita: [
    'documentário Brasil Paralelo',
    'documentário liberalismo econômico',
    'documentário história conservadorismo',
    'documentário empreendedorismo Brasil',
  ],
};

interface YouTubeVideo {
  videoId: string;
  titulo: string;
  descricao: string;
  thumbnail: string;
  canal: string;
  duracao?: string;
  publicadoEm: string;
  visualizacoes?: string;
}

async function searchYouTube(query: string, apiKey: string, maxResults: number = 10): Promise<any> {
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=long&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${apiKey}`;
  const response = await fetch(searchUrl);
  
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }
  
  return response.json();
}

async function getVideoDetails(videoIds: string[], apiKey: string): Promise<any> {
  const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds.join(',')}&key=${apiKey}`;
  const response = await fetch(detailsUrl);
  
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }
  
  return response.json();
}

function parseDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatViews(views: string): string {
  const num = parseInt(views);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return views;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orientacao, maxResults = 12 } = await req.json();

    if (!orientacao || !SEARCH_QUERIES[orientacao]) {
      throw new Error('Orientação inválida. Use: esquerda, centro ou direita');
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já temos documentários em cache para essa orientação
    const { data: cachedDocs, error: cacheError } = await supabase
      .from('politica_documentarios')
      .select('*')
      .eq('orientacao', orientacao)
      .order('created_at', { ascending: false })
      .limit(maxResults);

    if (!cacheError && cachedDocs && cachedDocs.length >= maxResults) {
      console.log(`[buscar-documentarios] Retornando ${cachedDocs.length} documentários do cache para ${orientacao}`);
      
      // Formatar para o formato esperado pelo frontend - INCLUINDO O ID DO BANCO
      const videosFromCache = cachedDocs.map(doc => ({
        id: doc.id, // ← CRÍTICO: incluir ID para navegação na página dedicada
        videoId: doc.video_id,
        titulo: doc.titulo,
        descricao: doc.descricao,
        thumbnail: doc.thumbnail,
        canal: doc.canal,
        duracao: doc.duracao,
        publicadoEm: doc.publicado_em,
        visualizacoes: doc.visualizacoes,
      }));

      return new Response(
        JSON.stringify({ videos: videosFromCache, orientacao, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se não tem cache suficiente, buscar do YouTube
    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave API configurada');
    }

    console.log(`[buscar-documentarios] Buscando documentários no YouTube para: ${orientacao}`);

    const queries = SEARCH_QUERIES[orientacao];
    const videosPerQuery = Math.ceil(maxResults / queries.length);
    
    let allVideos: YouTubeVideo[] = [];
    let workingApiKey = '';
    
    // Encontrar uma chave API que funcione
    for (const apiKey of API_KEYS) {
      try {
        const testResult = await searchYouTube(queries[0], apiKey, 1);
        if (testResult.items) {
          workingApiKey = apiKey;
          console.log('[buscar-documentarios] Chave API funcionando encontrada');
          break;
        }
      } catch (err) {
        console.log('[buscar-documentarios] Chave falhou, tentando próxima...');
        continue;
      }
    }

    if (!workingApiKey) {
      throw new Error('Nenhuma chave API disponível');
    }

    // Buscar vídeos de todas as queries
    for (const query of queries) {
      try {
        const searchResult = await searchYouTube(query, workingApiKey, videosPerQuery);
        
        if (searchResult.items && searchResult.items.length > 0) {
          const videoIds = searchResult.items.map((item: any) => item.id.videoId);
          
          // Buscar detalhes (duração, views)
          const detailsResult = await getVideoDetails(videoIds, workingApiKey);
          const detailsMap = new Map();
          
          if (detailsResult.items) {
            detailsResult.items.forEach((item: any) => {
              detailsMap.set(item.id, {
                duracao: parseDuration(item.contentDetails?.duration || ''),
                visualizacoes: formatViews(item.statistics?.viewCount || '0'),
              });
            });
          }
          
          // Formatar vídeos
          const videos = searchResult.items.map((item: any) => {
            const details = detailsMap.get(item.id.videoId) || {};
            return {
              videoId: item.id.videoId,
              titulo: item.snippet.title,
              descricao: item.snippet.description,
              thumbnail: item.snippet.thumbnails?.high?.url || 
                        item.snippet.thumbnails?.medium?.url || 
                        item.snippet.thumbnails?.default?.url,
              canal: item.snippet.channelTitle,
              publicadoEm: item.snippet.publishedAt,
              duracao: details.duracao || '',
              visualizacoes: details.visualizacoes || '',
            };
          });
          
          allVideos = [...allVideos, ...videos];
        }
      } catch (err) {
        console.error(`[buscar-documentarios] Erro ao buscar query "${query}":`, err);
      }
    }

    // Remover duplicatas por videoId
    const uniqueVideos = allVideos.reduce((acc: YouTubeVideo[], video) => {
      if (!acc.find(v => v.videoId === video.videoId)) {
        acc.push(video);
      }
      return acc;
    }, []);

    // Limitar ao máximo solicitado
    const finalVideos = uniqueVideos.slice(0, maxResults);

    console.log(`[buscar-documentarios] ${finalVideos.length} vídeos únicos encontrados para ${orientacao}`);

    // Salvar no cache do Supabase e buscar os IDs gerados
    let videosWithIds = finalVideos;
    
    if (finalVideos.length > 0) {
      const docsToInsert = finalVideos.map(video => ({
        video_id: video.videoId,
        titulo: video.titulo,
        descricao: video.descricao,
        thumbnail: video.thumbnail,
        canal: video.canal,
        duracao: video.duracao,
        visualizacoes: video.visualizacoes,
        publicado_em: video.publicadoEm,
        orientacao: orientacao,
      }));

      // Usar upsert para não duplicar
      const { error: insertError } = await supabase
        .from('politica_documentarios')
        .upsert(docsToInsert, { onConflict: 'video_id', ignoreDuplicates: true });

      if (insertError) {
        console.error('[buscar-documentarios] Erro ao salvar no cache:', insertError);
      } else {
        console.log(`[buscar-documentarios] ${finalVideos.length} vídeos salvos no cache`);
        
        // Buscar os IDs dos vídeos salvos para retornar ao frontend
        const videoIds = finalVideos.map(v => v.videoId);
        const { data: savedDocs } = await supabase
          .from('politica_documentarios')
          .select('id, video_id')
          .in('video_id', videoIds);
        
        if (savedDocs) {
          const idMap = new Map(savedDocs.map(d => [d.video_id, d.id]));
          videosWithIds = finalVideos.map(v => ({
            ...v,
            id: idMap.get(v.videoId), // ← Incluir o ID do banco
          }));
        }
      }
    }

    return new Response(
      JSON.stringify({ videos: videosWithIds, orientacao, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[buscar-documentarios] Erro:', error);
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
