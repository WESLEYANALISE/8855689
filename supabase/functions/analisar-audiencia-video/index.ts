import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

async function obterTranscricaoYouTube(videoId: string, apiKey: string): Promise<string | null> {
  try {
    // Tentar obter legendas do vídeo
    const captionsUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`;
    const captionsResponse = await fetch(captionsUrl);
    
    if (!captionsResponse.ok) {
      console.log(`Não foi possível obter legendas para ${videoId}`);
      return null;
    }
    
    const captionsData = await captionsResponse.json();
    
    // Procurar legenda em português
    const legendaPt = captionsData.items?.find((item: any) => 
      item.snippet.language === 'pt' || item.snippet.language === 'pt-BR'
    );
    
    if (legendaPt) {
      console.log(`Legenda disponível em PT para ${videoId}`);
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao obter transcrição:', error);
    return null;
  }
}

async function analisarComGemini(videoInfo: any, transcricao: string | null, gerarSegmentos: boolean): Promise<any> {
  // Prompt base para análise
  let prompt = `Você é um especialista em análise de audiências e sessões de tribunais brasileiros.

Analise as seguintes informações sobre um vídeo de ${videoInfo.tribunal}:

**Título:** ${videoInfo.titulo}
**Descrição:** ${videoInfo.descricao || 'Não disponível'}
**Canal:** ${videoInfo.canal_nome}
**Duração:** ${videoInfo.duracao_segundos ? Math.round(videoInfo.duracao_segundos / 60) + ' minutos' : 'Não disponível'}
${transcricao ? `**Transcrição:** ${transcricao.substring(0, 8000)}` : ''}

Com base nessas informações, forneça uma análise estruturada em JSON com o seguinte formato:

{
  "resumo": "Resumo detalhado do conteúdo da sessão/audiência (2-3 parágrafos)",
  "temas_principais": ["tema1", "tema2", "tema3"],
  "participantes": [
    {"nome": "Nome do participante", "cargo": "Cargo/função", "tempo_estimado_fala": "estimativa em minutos"}
  ],
  "pontos_discutidos": [
    {"tema": "Tema discutido", "resumo": "Breve resumo do ponto"}
  ],
  "termos_chave": ["termo1", "termo2", "termo3", "termo4", "termo5"],
  "tipo_sessao": "Tipo (Plenário, Turma, Audiência Pública, etc.)",
  "decisao_final": "Descrição da decisão, se houver",
  "votos": [
    {"ministro": "Nome", "voto": "Favorável/Contrário/Abstenção", "argumento": "Resumo do argumento"}
  ]`;

  // Se deve gerar segmentos para transcrição interativa
  if (gerarSegmentos && videoInfo.duracao_segundos) {
    prompt += `,
  "segmentos_transcricao": [
    {
      "texto": "Trecho do conteúdo falado neste momento",
      "inicio_segundos": 0,
      "fim_segundos": 30
    }
  ]`;
  }

  prompt += `
}

${gerarSegmentos && videoInfo.duracao_segundos ? `
IMPORTANTE para segmentos_transcricao:
- Crie segmentos que cubram a duração total do vídeo (${videoInfo.duracao_segundos} segundos)
- Cada segmento deve ter entre 20-60 segundos de duração
- Os textos devem ser uma estimativa do que provavelmente é dito baseado no título, descrição e contexto
- Distribua os pontos principais do resumo ao longo dos segmentos
- Use linguagem jurídica formal apropriada para tribunais
- Gere entre 10-30 segmentos dependendo da duração do vídeo
` : ''}

Se não houver informações suficientes para algum campo, use um array vazio [] ou null.
Responda APENAS com o JSON, sem texto adicional.`;

  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];
    console.log(`Tentando Gemini com chave ${i + 1}/${API_KEYS.length}`);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192,
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.log(`Chave ${i + 1} falhou: ${error}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extrair JSON da resposta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      console.log('Resposta não contém JSON válido');
    } catch (err) {
      console.error(`Erro com chave ${i + 1}:`, err);
    }
  }

  throw new Error('Todas as chaves API falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoDbId, forcarReanalise = false, gerarTranscricao = true } = await req.json();

    if (!videoDbId) {
      throw new Error('videoDbId é obrigatório');
    }

    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar vídeo com dados do canal
    const { data: video, error: videoError } = await supabase
      .from('audiencias_videos')
      .select(`
        *,
        canais_audiencias(tribunal, nome)
      `)
      .eq('id', videoDbId)
      .single();

    if (videoError || !video) {
      throw new Error(`Vídeo não encontrado: ${videoDbId}`);
    }

    // Verificar se já tem análise
    if (!forcarReanalise) {
      const { data: analiseExistente } = await supabase
        .from('audiencias_analises')
        .select('id')
        .eq('video_id', videoDbId)
        .single();

      if (analiseExistente) {
        return new Response(
          JSON.stringify({ message: 'Vídeo já foi analisado', analiseId: analiseExistente.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Analisando vídeo: ${video.titulo}`);

    // Atualizar status para "analisando"
    await supabase
      .from('audiencias_videos')
      .update({ status: 'analisando' })
      .eq('id', videoDbId);

    // Tentar obter transcrição
    let transcricao = video.transcricao;
    if (!transcricao && API_KEYS.length > 0) {
      transcricao = await obterTranscricaoYouTube(video.video_id, API_KEYS[0]);
      
      if (transcricao) {
        await supabase
          .from('audiencias_videos')
          .update({ transcricao })
          .eq('id', videoDbId);
      }
    }

    // Preparar dados para análise
    const videoInfo = {
      titulo: video.titulo,
      descricao: video.descricao,
      tribunal: video.canais_audiencias?.tribunal || 'Tribunal',
      canal_nome: video.canais_audiencias?.nome || 'Canal',
      duracao_segundos: video.duracao_segundos
    };

    // Analisar com Gemini (incluindo segmentos se gerarTranscricao=true)
    const analise = await analisarComGemini(videoInfo, transcricao, gerarTranscricao && !!video.duracao_segundos);

    // Deletar análise existente se forçando reanalise
    if (forcarReanalise) {
      await supabase
        .from('audiencias_analises')
        .delete()
        .eq('video_id', videoDbId);
      
      // Deletar transcrição existente também
      await supabase
        .from('audiencias_transcricoes')
        .delete()
        .eq('video_id', videoDbId);
    }

    // Salvar análise
    const { data: novaAnalise, error: analiseError } = await supabase
      .from('audiencias_analises')
      .insert({
        video_id: videoDbId,
        resumo: analise.resumo,
        temas_principais: analise.temas_principais || [],
        participantes: analise.participantes || [],
        pontos_discutidos: analise.pontos_discutidos || [],
        termos_chave: analise.termos_chave || [],
        tipo_sessao: analise.tipo_sessao,
        decisao_final: analise.decisao_final,
        votos: analise.votos || []
      })
      .select()
      .single();

    if (analiseError) {
      throw new Error(`Erro ao salvar análise: ${analiseError.message}`);
    }

    // Salvar segmentos de transcrição se gerados
    if (analise.segmentos_transcricao && analise.segmentos_transcricao.length > 0) {
      console.log(`Salvando ${analise.segmentos_transcricao.length} segmentos de transcrição`);
      
      const { error: transcricaoError } = await supabase
        .from('audiencias_transcricoes')
        .insert({
          video_id: videoDbId,
          segmentos: analise.segmentos_transcricao,
          fonte: 'gemini',
          idioma: 'pt-BR'
        });

      if (transcricaoError) {
        console.error('Erro ao salvar transcrição:', transcricaoError);
      } else {
        // Disparar geração de embeddings em background
        console.log('Disparando geração de embeddings...');
        supabase.functions.invoke('gerar-embeddings-transcricao', {
          body: { videoId: videoDbId }
        }).catch(err => console.error('Erro ao gerar embeddings:', err));
      }
    }

    // Atualizar status do vídeo para "concluido"
    await supabase
      .from('audiencias_videos')
      .update({ status: 'concluido' })
      .eq('id', videoDbId);

    console.log(`Análise concluída para: ${video.titulo}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analise: novaAnalise,
        temTranscricao: !!(analise.segmentos_transcricao?.length)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função analisar-audiencia-video:', error);
    
    // Tentar atualizar status para erro
    try {
      const { videoDbId } = await req.json();
      if (videoDbId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('audiencias_videos')
          .update({ 
            status: 'erro',
            erro_mensagem: error instanceof Error ? error.message : 'Erro desconhecido'
          })
          .eq('id', videoDbId);
      }
    } catch {}

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
