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

interface Segmento {
  texto: string;
  inicio_segundos: number;
  fim_segundos: number;
}

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
        // Tentar próxima key
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
    const { transcricaoId, videoId } = await req.json();

    if (!transcricaoId && !videoId) {
      throw new Error('transcricaoId ou videoId é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Gerando embeddings para transcrição: ${transcricaoId || videoId}`);

    // Buscar transcrição
    let query = supabase.from('audiencias_transcricoes').select('*');
    
    if (transcricaoId) {
      query = query.eq('id', transcricaoId);
    } else {
      query = query.eq('video_id', videoId);
    }

    const { data: transcricao, error: errTranscricao } = await query.single();

    if (errTranscricao || !transcricao) {
      throw new Error('Transcrição não encontrada');
    }

    const segmentos = (transcricao.segmentos as unknown as Segmento[]) || [];
    
    if (segmentos.length === 0) {
      throw new Error('Nenhum segmento encontrado na transcrição');
    }

    console.log(`Processando ${segmentos.length} segmentos`);

    // Verificar se já existem embeddings
    const { data: existentes } = await supabase
      .from('audiencias_segmentos_embeddings')
      .select('indice_segmento')
      .eq('transcricao_id', transcricao.id);

    const indicesExistentes = new Set(existentes?.map(e => e.indice_segmento) || []);

    // Processar em lotes de 5 para evitar rate limiting
    const BATCH_SIZE = 5;
    let processados = 0;
    let erros = 0;

    for (let i = 0; i < segmentos.length; i += BATCH_SIZE) {
      const lote = segmentos.slice(i, i + BATCH_SIZE);
      
      const promises = lote.map(async (segmento, loteIndex) => {
        const indice = i + loteIndex;
        
        // Pular se já existe
        if (indicesExistentes.has(indice)) {
          console.log(`Segmento ${indice} já processado, pulando`);
          return null;
        }

        const embedding = await gerarEmbedding(segmento.texto);
        
        if (!embedding) {
          erros++;
          return null;
        }

        // Formatar embedding como string para pgvector
        const embeddingStr = `[${embedding.join(',')}]`;

        const { error: insertError } = await supabase
          .from('audiencias_segmentos_embeddings')
          .insert({
            transcricao_id: transcricao.id,
            video_id: transcricao.video_id,
            indice_segmento: indice,
            texto: segmento.texto,
            inicio_segundos: segmento.inicio_segundos,
            fim_segundos: segmento.fim_segundos,
            embedding: embeddingStr
          });

        if (insertError) {
          console.error(`Erro ao inserir segmento ${indice}:`, insertError);
          erros++;
          return null;
        }

        processados++;
        return true;
      });

      await Promise.all(promises);

      // Pequeno delay entre lotes
      if (i + BATCH_SIZE < segmentos.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`Embeddings gerados: ${processados}, erros: ${erros}`);

    return new Response(
      JSON.stringify({
        success: true,
        processados,
        erros,
        total: segmentos.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro ao gerar embeddings:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
