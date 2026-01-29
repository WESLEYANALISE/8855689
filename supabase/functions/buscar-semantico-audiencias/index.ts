import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rotação de API keys
const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

async function gerarEmbedding(texto: string, apiKeyIndex = 0): Promise<number[] | null> {
  if (apiKeyIndex >= API_KEYS.length) {
    console.error('Todas as API keys falharam');
    return null;
  }

  const apiKey = API_KEYS[apiKeyIndex];
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text: texto }] }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na API key ${apiKeyIndex}: ${response.status} - ${errorText}`);
      
      if (response.status === 429 || response.status === 503) {
        console.log(`Tentando próxima API key (${apiKeyIndex + 1})`);
        return gerarEmbedding(texto, apiKeyIndex + 1);
      }
      return null;
    }

    const data = await response.json();
    return data.embedding?.values || null;
  } catch (error) {
    console.error(`Erro ao gerar embedding: ${error}`);
    return gerarEmbedding(texto, apiKeyIndex + 1);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limite = 15, similaridadeMinima = 0.5 } = await req.json();

    if (!query || query.trim().length < 3) {
      throw new Error('Query de busca deve ter pelo menos 3 caracteres');
    }

    console.log(`Busca semântica: "${query}"`);

    // Gerar embedding da query
    const queryEmbedding = await gerarEmbedding(query);
    
    if (!queryEmbedding) {
      throw new Error('Erro ao gerar embedding da query');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Formatar embedding como string para pgvector
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Buscar segmentos similares usando a função SQL
    const { data: resultados, error } = await supabase.rpc('buscar_segmentos_similares', {
      query_embedding: embeddingStr,
      limite,
      similaridade_minima: similaridadeMinima
    });

    if (error) {
      console.error('Erro na busca:', error);
      throw new Error('Erro ao buscar segmentos similares');
    }

    console.log(`Encontrados ${resultados?.length || 0} resultados`);

    // Agrupar por vídeo para melhor UX
    const videosMap = new Map<string, {
      video_id: string;
      video_titulo: string;
      tribunal: string;
      thumbnail: string | null;
      segmentos: Array<{
        id: string;
        texto: string;
        inicio_segundos: number;
        fim_segundos: number;
        similaridade: number;
      }>;
      melhor_similaridade: number;
    }>();

    for (const resultado of resultados || []) {
      const videoId = resultado.video_id;
      
      if (!videosMap.has(videoId)) {
        videosMap.set(videoId, {
          video_id: videoId,
          video_titulo: resultado.video_titulo,
          tribunal: resultado.tribunal,
          thumbnail: resultado.thumbnail,
          segmentos: [],
          melhor_similaridade: 0
        });
      }

      const video = videosMap.get(videoId)!;
      video.segmentos.push({
        id: resultado.id,
        texto: resultado.texto,
        inicio_segundos: resultado.inicio_segundos,
        fim_segundos: resultado.fim_segundos,
        similaridade: resultado.similaridade
      });

      if (resultado.similaridade > video.melhor_similaridade) {
        video.melhor_similaridade = resultado.similaridade;
      }
    }

    // Converter para array e ordenar por melhor similaridade
    const videosOrdenados = Array.from(videosMap.values())
      .sort((a, b) => b.melhor_similaridade - a.melhor_similaridade);

    return new Response(
      JSON.stringify({
        success: true,
        query,
        totalSegmentos: resultados?.length || 0,
        totalVideos: videosOrdenados.length,
        resultados: videosOrdenados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro na busca semântica:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
