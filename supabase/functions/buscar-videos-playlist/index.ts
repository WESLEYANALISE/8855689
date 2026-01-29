import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de fallback com 3 chaves API (também usadas para YouTube API)
const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { playlistLink } = await req.json();

    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave API configurada');
    }

    // Extrair ID da playlist do link
    const playlistId = extractPlaylistId(playlistLink);
    if (!playlistId) {
      throw new Error('Link de playlist inválido');
    }

    console.log('Buscando vídeos da playlist:', playlistId);

    // Tentar cada chave API com fallback
    let data: any = null;
    let lastError = '';
    
    for (let i = 0; i < API_KEYS.length; i++) {
      const apiKey = API_KEYS[i];
      console.log(`Tentando chave ${i + 1}/${API_KEYS.length}`);
      
      try {
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
        const response = await fetch(playlistUrl);
        
        if (response.ok) {
          data = await response.json();
          console.log(`Chave ${i + 1} funcionou!`);
          break;
        }
        
        const errorData = await response.text();
        lastError = errorData;
        console.log(`Chave ${i + 1} falhou: ${response.status}`);
        
        if (response.status === 429 || response.status === 403) {
          continue;
        }
        continue;
      } catch (err) {
        console.error(`Erro com chave ${i + 1}:`, err);
        lastError = err instanceof Error ? err.message : String(err);
        continue;
      }
    }
    
    if (!data) {
      throw new Error(`Erro ao buscar playlist: ${lastError}`);
    }
    
    // Formatar os vídeos
    const videos = data.items.map((item: any) => ({
      videoId: item.contentDetails.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
    }));

    console.log(`${videos.length} vídeos encontrados`);

    return new Response(
      JSON.stringify({ videos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função buscar-videos-playlist:', error);
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

function extractPlaylistId(url: string): string | null {
  // Extrai o ID da playlist de um link padrão do YouTube
  const match = url.match(/[?&]list=([^&]+)/);
  return match ? match[1] : null;
}
