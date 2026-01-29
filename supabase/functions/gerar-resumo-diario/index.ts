import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Noticia {
  id: number | string;
  titulo: string;
  imagem_url?: string;
  imagem?: string;
  fonte?: string;
  link?: string;
  data_publicacao?: string;
  categoria?: string;
}

interface Slide {
  ordem: number;
  titulo: string;
  subtitulo: string;
  imagem_url: string;
  texto_narrado: string;
  resumo_curto: string;
  noticia_id: number;
  hora_publicacao: string;
  emojis: { posicao: number; emoji: string }[];
  url_audio?: string;
}

interface Termo {
  termo: string;
  definicao: string;
}

// Função de curadoria inteligente com IA para selecionar as 20 notícias mais relevantes sem duplicatas
async function curarNoticiasComIA(
  noticias: Noticia[], 
  tipo: string, 
  chavesDisponiveis: string[]
): Promise<Noticia[]> {
  // Se tem 20 ou menos, retorna todas
  if (noticias.length <= 20) return noticias;

  console.log(`Iniciando curadoria de ${noticias.length} notícias do tipo ${tipo}...`);

  const tipoNome = tipo === 'politica' ? 'políticas' : tipo === 'concurso' ? 'de concursos' : 'jurídicas';
  
  const prompt = `Você é um editor-chefe de um portal de notícias ${tipoNome}.

Analise as ${noticias.length} notícias abaixo e selecione as 20 MAIS RELEVANTES e ÚNICAS.

REGRAS DE CURADORIA:
1. REMOVER DUPLICATAS: Se dois portais noticiam o mesmo fato, escolha apenas um (prefira fonte mais completa/confiável)
2. PRIORIZAR: ${tipo === 'politica' 
    ? 'Decisões do governo, votações, escândalos políticos, relações internacionais, pronunciamentos oficiais' 
    : tipo === 'concurso' 
    ? 'Abertura de editais, prazos importantes, resultados, nomeações, mudanças em concursos'
    : 'Decisões judiciais importantes, novas leis, mudanças na legislação, jurisprudência relevante'}
3. DIVERSIFICAR: Cobrir diferentes assuntos (não repetir várias notícias sobre o mesmo tema)
4. EVITAR: Notícias repetidas em fontes diferentes, colunas de opinião sem fato novo, conteúdo duplicado

NOTÍCIAS DISPONÍVEIS:
${noticias.map((n) => `[ID: ${n.id}] ${n.titulo} (${n.fonte || 'sem fonte'})`).join('\n')}

RESPONDA com um JSON contendo APENAS os IDs das 20 notícias selecionadas, em ordem de relevância (mais relevante primeiro):
{ "ids": [123, 456, 789, ...] }

Retorne SOMENTE o JSON, sem explicações ou markdown.`;

  for (const chave of chavesDisponiveis) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${chave}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429 || response.status === 503) {
          console.log(`Chave com rate limit, tentando próxima...`);
          continue;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        console.error('Resposta vazia da IA na curadoria');
        continue;
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const ids = parsed.ids;
        
        if (Array.isArray(ids) && ids.length > 0) {
          // Mapear IDs para notícias na ordem de relevância definida pela IA
          const noticiasCuradas = ids
            .map((id: number | string) => noticias.find(n => String(n.id) === String(id)))
            .filter((n): n is Noticia => n !== undefined)
            .slice(0, 20);
          
          console.log(`✅ Curadoria concluída: ${noticiasCuradas.length} notícias selecionadas de ${noticias.length}`);
          return noticiasCuradas;
        }
      }
    } catch (error) {
      console.error('Erro na curadoria com IA:', error);
    }
  }

  // Fallback: pegar as 20 primeiras sem curadoria
  console.log('⚠️ Fallback: usando as 20 primeiras notícias sem curadoria');
  return noticias.slice(0, 20);
}

async function gerarTextoResumo(noticias: Noticia[], tipo: string, chavesDisponiveis: string[], dataResumo: string): Promise<{ abertura: string; fechamento: string; slides: Slide[]; termos: Termo[] }> {
  // Definir nome do tipo para o prompt
  let tipoNome: string;
  switch (tipo) {
    case 'politica':
      tipoNome = 'política brasileira';
      break;
    case 'direito':
    case 'juridica':
      tipoNome = 'direito e legislação';
      break;
    case 'concurso':
      tipoNome = 'concursos públicos';
      break;
    default:
      tipoNome = 'jurídico';
  }
  
  const [ano, mes, dia] = dataResumo.split('-');
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const dataFormatada = `${parseInt(dia)} de ${meses[parseInt(mes) - 1]}`;
  
  // Saudação personalizada por tipo
  let saudacao: string;
  switch (tipo) {
    case 'politica':
      saudacao = `E aí, pessoal! Hoje é dia ${dataFormatada} e eu vou te contar o que rolou na política brasileira.`;
      break;
    case 'concurso':
      saudacao = `Olá, concurseiro! Hoje é dia ${dataFormatada} e eu vou te atualizar sobre as principais notícias de concursos públicos.`;
      break;
    case 'direito':
    case 'juridica':
    default:
      saudacao = `Olá! Hoje é dia ${dataFormatada} e eu vou te atualizar sobre as principais notícias jurídicas.`;
  }

  const prompt = `Você é um apresentador de podcast descontraído mas informativo chamado "Resumo do Dia".

Gere um roteiro para apresentar as ${noticias.length} notícias mais importantes do dia de forma envolvente e natural.

REGRAS IMPORTANTES:
1. Comece com: "${saudacao}"
2. Para CADA notícia, gere:
   - titulo: título original da notícia
   - subtitulo: 2 linhas (máximo 120 caracteres) que complementam e contextualizam o título
   - texto_narrado: narração de 20-25 segundos, com mais contexto e detalhes importantes. Inclua números, datas, nomes de envolvidos e consequências esperadas quando relevante.
   - resumo_curto: resumo de 3-4 frases para leitura rápida
   - emojis: array de 2-4 emojis em momentos-chave (posição 0.0 a 1.0)

3. EMOJIS DISPONÍVEIS (use vários por notícia conforme o contexto):
   - 😮 Surpresa/novidade - 🤔 Reflexão - ⚠️ Alerta - 📢 Anúncio - 💡 Insight
   - 😱 Chocante - ✅ Positivo - ❌ Negativo - ⚖️ Decisão judicial - 📜 Nova lei
   - 🏛️ Institucional - 👀 Atenção - 🔥 Polêmica - 💰 Financeiro - 🗳️ Votação
   - 📊 Estatísticas - 🤝 Acordo - 🚨 Urgente - 📈 Alta - 📉 Queda
   - 🎯 Meta - 💬 Declaração - 🔍 Investigação - ⏰ Prazo

4. Finalize com despedida curta

5. TERMOS TÉCNICOS: Extraia 5-10 termos ${tipo === 'concurso' ? 'de concursos públicos' : tipo === 'politica' ? 'políticos' : 'jurídicos'} mencionados com definições simples (máx 2 frases)

FORMATO DE RESPOSTA (JSON VÁLIDO):
{
  "abertura": "<saudação inicial>",
  "slides": [
    {
      "ordem": 1,
      "noticia_id": <id>,
      "titulo": "<título original>",
      "subtitulo": "<2 linhas que complementam o título, máx 120 caracteres>",
      "texto_narrado": "<narração de 20-25 segundos com mais detalhes>",
      "resumo_curto": "<resumo de 3-4 frases>",
      "emojis": [{ "posicao": 0.15, "emoji": "📢" }, { "posicao": 0.4, "emoji": "😮" }]
    }
  ],
  "fechamento": "<despedida curta>",
  "termos": [{ "termo": "Habeas Corpus", "definicao": "Instrumento jurídico que protege a liberdade de locomoção." }]
}

NOTÍCIAS DO DIA (${tipoNome}):
${noticias.map((n, i) => `${i + 1}. ID: ${n.id} | Título: ${n.titulo}`).join('\n')}

Retorne APENAS o JSON válido, sem markdown ou explicações.`;

  let lastError = null;
  
  for (const chave of chavesDisponiveis) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${chave}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 16000 },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429 || response.status === 503) continue;
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Resposta vazia da API");

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON não encontrado na resposta");
      
      const resultado = JSON.parse(jsonMatch[0]);

      const slides: Slide[] = resultado.slides.map((s: any, idx: number) => {
        const noticia = noticias.find(n => String(n.id) === String(s.noticia_id)) || noticias[idx];
        const imagemUrl = noticia?.imagem_url || noticia?.imagem || '';
        const dataPublicacao = noticia?.data_publicacao ? new Date(noticia.data_publicacao) : null;
        const horaPublicacao = dataPublicacao 
          ? dataPublicacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : '';
        return {
          ordem: s.ordem || idx + 1,
          titulo: s.titulo || noticia?.titulo,
          subtitulo: s.subtitulo || '',
          imagem_url: imagemUrl,
          texto_narrado: s.texto_narrado,
          resumo_curto: s.resumo_curto || '',
          noticia_id: s.noticia_id || noticia?.id,
          hora_publicacao: horaPublicacao,
          emojis: s.emojis || []
        };
      });

      return { 
        abertura: resultado.abertura,
        fechamento: resultado.fechamento,
        slides, 
        termos: resultado.termos || [] 
      };
    } catch (error) {
      lastError = error;
      console.error(`Erro com chave Gemini:`, error);
    }
  }

  throw lastError || new Error("Todas as chaves falharam");
}

function createWavFromL16(pcmData: Uint8Array, mimeType: string = "audio/L16;codec=pcm;rate=24000"): Uint8Array {
  const rateMatch = mimeType.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
  
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length;
  const fileSize = 36 + dataSize;
  
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  view.setUint8(0, 'R'.charCodeAt(0));
  view.setUint8(1, 'I'.charCodeAt(0));
  view.setUint8(2, 'F'.charCodeAt(0));
  view.setUint8(3, 'F'.charCodeAt(0));
  view.setUint32(4, fileSize, true);
  view.setUint8(8, 'W'.charCodeAt(0));
  view.setUint8(9, 'A'.charCodeAt(0));
  view.setUint8(10, 'V'.charCodeAt(0));
  view.setUint8(11, 'E'.charCodeAt(0));
  
  view.setUint8(12, 'f'.charCodeAt(0));
  view.setUint8(13, 'm'.charCodeAt(0));
  view.setUint8(14, 't'.charCodeAt(0));
  view.setUint8(15, ' '.charCodeAt(0));
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  
  view.setUint8(36, 'd'.charCodeAt(0));
  view.setUint8(37, 'a'.charCodeAt(0));
  view.setUint8(38, 't'.charCodeAt(0));
  view.setUint8(39, 'a'.charCodeAt(0));
  view.setUint32(40, dataSize, true);
  
  const wavFile = new Uint8Array(44 + pcmData.length);
  wavFile.set(new Uint8Array(header), 0);
  wavFile.set(pcmData, 44);
  
  return wavFile;
}

async function gerarAudioTTS(texto: string, chavesDisponiveis: string[]): Promise<Uint8Array> {
  const textoNormalizado = texto
    .replace(/\*\*/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 6000);

  let lastError: Error | null = null;
  const totalChaves = chavesDisponiveis.length;

  console.log(`[TTS] Iniciando geração de áudio com ${totalChaves} chaves disponíveis`);
  console.log(`[TTS] Texto a narrar: ${textoNormalizado.length} caracteres`);

  for (let i = 0; i < totalChaves; i++) {
    const chave = chavesDisponiveis[i];
    const chaveId = `CHAVE_${i + 1}`;
    
    try {
      console.log(`[TTS] Tentativa ${i + 1}/${totalChaves} - Usando ${chaveId} (${chave.substring(0, 8)}...)`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${chave}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: textoNormalizado }] }],
            generationConfig: {
              response_modalities: ["AUDIO"],
              speech_config: {
                voice_config: { prebuilt_voice_config: { voice_name: "Aoede" } }
              }
            }
          })
        }
      );

      const contentType = response.headers.get('content-type') || '';
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TTS] ❌ ${chaveId} falhou com status ${response.status}`);
        console.error(`[TTS] Erro detalhado: ${errorText.substring(0, 300)}`);
        
        // Sempre continua para próxima chave em caso de erro
        if (response.status === 429) {
          console.log(`[TTS] ${chaveId}: Quota excedida (429) - tentando próxima chave...`);
          lastError = new Error(`${chaveId}: Quota excedida`);
        } else if (response.status === 400) {
          console.log(`[TTS] ${chaveId}: Chave inválida/expirada (400) - tentando próxima chave...`);
          lastError = new Error(`${chaveId}: Chave inválida ou expirada`);
        } else if (response.status === 503) {
          console.log(`[TTS] ${chaveId}: Serviço indisponível (503) - tentando próxima chave...`);
          lastError = new Error(`${chaveId}: Serviço indisponível`);
        } else {
          lastError = new Error(`${chaveId}: Erro ${response.status} - ${errorText.substring(0, 100)}`);
        }
        continue;
      }

      if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.error(`[TTS] ${chaveId}: Resposta não é JSON. Content-Type: ${contentType}`);
        lastError = new Error(`${chaveId}: Resposta inválida`);
        continue;
      }

      const data = await response.json();
      
      if (data.error) {
        console.error(`[TTS] ${chaveId}: Erro na resposta JSON:`, data.error.message || data.error);
        lastError = new Error(`${chaveId}: ${data.error.message || 'Erro desconhecido'}`);
        continue;
      }
      
      const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const audioBase64 = inlineData?.data;
      const mimeType = inlineData?.mimeType || "audio/L16;codec=pcm;rate=24000";
      
      if (!audioBase64) {
        console.error(`[TTS] ${chaveId}: Nenhum áudio na resposta`);
        lastError = new Error(`${chaveId}: Sem áudio na resposta`);
        continue;
      }

      console.log(`[TTS] ✅ Sucesso com ${chaveId}! MimeType: ${mimeType}, tamanho base64: ${audioBase64.length}`);
      
      const binaryString = atob(audioBase64);
      const pcmBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        pcmBytes[i] = binaryString.charCodeAt(i);
      }
      
      return createWavFromL16(pcmBytes, mimeType);
    } catch (error) {
      console.error(`[TTS] ${chaveId}: Exceção -`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continua para próxima chave
    }
  }

  console.error(`[TTS] ❌ TODAS AS ${totalChaves} CHAVES FALHARAM`);
  throw lastError || new Error("Falha ao gerar áudio - todas as chaves falharam");
}

async function uploadAudioSegment(supabase: any, audioBytes: Uint8Array, tipo: string, data: string, segmento: string): Promise<string> {
  const fileName = `resumo-${tipo}-${data}-${segmento}.wav`;
  const filePath = `resumos-diarios/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('audios')
    .upload(filePath, audioBytes, { contentType: 'audio/wav', upsert: true });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('audios').getPublicUrl(filePath);
  return urlData.publicUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, data: dataParam, forceRegenerate = false, stream = false } = await req.json();

    if (!tipo || !['politica', 'juridica', 'direito', 'concurso'].includes(tipo)) {
      throw new Error("Tipo deve ser 'politica', 'juridica', 'direito' ou 'concurso'");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
      Deno.env.get("GEMINI_KEY_3"),
      Deno.env.get("DIREITO_PREMIUM_API_KEY"),
    ].filter(Boolean) as string[];

    let dataHoje: string;
    if (dataParam) {
      dataHoje = dataParam;
    } else {
      const hoje = new Date();
      hoje.setHours(hoje.getHours() - 3);
      dataHoje = hoje.toISOString().split('T')[0];
    }

    // Verificar se já existe
    if (!forceRegenerate) {
      const { data: existente } = await supabase
        .from('resumos_diarios')
        .select('*')
        .eq('tipo', tipo)
        .eq('data', dataHoje)
        .single();

      if (existente?.url_audio_abertura) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Resumo já existe",
          resumo: existente 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // Buscar notícias com base no tipo
    // - politica: noticias_politicas_cache (todas)
    // - juridica/direito: noticias_juridicas_cache WHERE categoria = 'Direito' OR categoria IS NULL
    // - concurso: noticias_juridicas_cache WHERE categoria = 'Concurso Público'
    let noticias: Noticia[] = [];
    const dataInicio = `${dataHoje}T00:00:00+00:00`;
    const dataFim = `${dataHoje}T23:59:59+00:00`;

    if (tipo === 'politica') {
      const { data, error } = await supabase
        .from('noticias_politicas_cache')
        .select('*')
        .gte('data_publicacao', dataInicio)
        .lte('data_publicacao', dataFim)
        .order('data_publicacao', { ascending: false });
      
      if (error) throw error;
      noticias = data || [];
    } else if (tipo === 'concurso') {
      // Buscar na tabela correta de notícias de concursos
      const { data, error } = await supabase
        .from('noticias_concursos_cache')
        .select('*')
        .gte('data_publicacao', dataInicio)
        .lte('data_publicacao', dataFim)
        .order('data_publicacao', { ascending: false });
      
      if (error) throw error;
      noticias = data || [];
    } else {
      // tipo === 'direito' ou 'juridica'
      const { data, error } = await supabase
        .from('noticias_juridicas_cache')
        .select('*')
        .eq('categoria', 'Direito')
        .gte('data_publicacao', dataInicio)
        .lte('data_publicacao', dataFim)
        .order('data_publicacao', { ascending: false });
      
      if (error) throw error;
      noticias = data || [];
    }

    if (!noticias || noticias.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Nenhuma notícia encontrada para ${dataHoje} do tipo ${tipo}` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Curadoria inteligente: selecionar as 20 notícias mais relevantes sem duplicatas
    console.log(`${noticias.length} notícias encontradas, iniciando curadoria...`);
    const noticiasLimitadas = await curarNoticiasComIA(noticias, tipo, geminiKeys);
    console.log(`${noticiasLimitadas.length} notícias selecionadas após curadoria`);

    // Se stream=true, usar SSE para progresso em tempo real
    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const send = (event: string, data: any) => {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          };

          try {
            send('progress', { step: 'roteiro', message: 'Gerando roteiro...', progress: 0 });
            
            const { abertura, fechamento, slides, termos } = await gerarTextoResumo(noticiasLimitadas, tipo, geminiKeys, dataHoje);
            
            const totalSteps = slides.length + 2; // abertura + slides + fechamento
            let currentStep = 0;

            // Abertura
            send('progress', { step: 'abertura', message: 'Gerando áudio da abertura...', progress: Math.round((currentStep / totalSteps) * 100) });
            const audioAbertura = await gerarAudioTTS(abertura, geminiKeys);
            const urlAudioAbertura = await uploadAudioSegment(supabase, audioAbertura, tipo, dataHoje, 'abertura');
            currentStep++;
            send('progress', { step: 'abertura_done', message: 'Abertura concluída ✓', progress: Math.round((currentStep / totalSteps) * 100) });

            // Slides
            const slidesComAudio: Slide[] = [];
            for (let i = 0; i < slides.length; i++) {
              const slide = slides[i];
              send('progress', { 
                step: `slide_${i}`, 
                message: `Gerando áudio ${i + 1}/${slides.length}: ${slide.titulo.substring(0, 50)}...`, 
                progress: Math.round((currentStep / totalSteps) * 100),
                currentSlide: i + 1,
                totalSlides: slides.length
              });
              
              try {
                const audioSlide = await gerarAudioTTS(slide.texto_narrado, geminiKeys);
                const urlAudioSlide = await uploadAudioSegment(supabase, audioSlide, tipo, dataHoje, `slide_${i}`);
                slidesComAudio.push({ ...slide, url_audio: urlAudioSlide });
              } catch (error) {
                console.error(`Erro slide ${i}:`, error);
                slidesComAudio.push({ ...slide, url_audio: '' });
              }
              
              currentStep++;
              send('progress', { 
                step: `slide_${i}_done`, 
                message: `Áudio ${i + 1}/${slides.length} concluído ✓`, 
                progress: Math.round((currentStep / totalSteps) * 100),
                currentSlide: i + 1,
                totalSlides: slides.length
              });
            }

            // Fechamento
            send('progress', { step: 'fechamento', message: 'Gerando áudio do fechamento...', progress: Math.round((currentStep / totalSteps) * 100) });
            const audioFechamento = await gerarAudioTTS(fechamento, geminiKeys);
            const urlAudioFechamento = await uploadAudioSegment(supabase, audioFechamento, tipo, dataHoje, 'fechamento');
            currentStep++;
            send('progress', { step: 'fechamento_done', message: 'Fechamento concluído ✓', progress: 100 });

            // Salvar
            send('progress', { step: 'salvando', message: 'Salvando boletim...', progress: 100 });
            
            const textoCompleto = [abertura, ...slidesComAudio.map(s => s.texto_narrado), fechamento].join(' ');

            const { data: resumo, error: saveError } = await supabase
              .from('resumos_diarios')
              .upsert({
                tipo,
                data: dataHoje,
                noticias_ids: noticiasLimitadas.map(n => n.id),
                texto_resumo: textoCompleto,
                slides: slidesComAudio,
                termos,
                url_audio: urlAudioAbertura,
                url_audio_abertura: urlAudioAbertura,
                url_audio_fechamento: urlAudioFechamento,
                total_noticias: noticiasLimitadas.length,
                hora_corte: '23:00:00'
              }, { onConflict: 'tipo,data' })
              .select()
              .single();

            if (saveError) throw saveError;

            send('complete', { success: true, message: 'Boletim gerado com sucesso!', resumo });
            controller.close();
          } catch (error: any) {
            send('error', { message: error.message || 'Erro ao gerar boletim' });
            controller.close();
          }
        }
      });

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    }

    // Modo não-streaming (compatibilidade)
    console.log(`Gerando resumo para ${noticias.length} notícias de ${tipo}`);

    const { abertura, fechamento, slides, termos } = await gerarTextoResumo(noticiasLimitadas, tipo, geminiKeys, dataHoje);
    console.log(`Texto gerado, ${slides.length} slides, ${termos.length} termos.`);

    console.log(`Gerando áudio da abertura...`);
    const audioAbertura = await gerarAudioTTS(abertura, geminiKeys);
    const urlAudioAbertura = await uploadAudioSegment(supabase, audioAbertura, tipo, dataHoje, 'abertura');
    console.log(`✅ Áudio abertura: ${urlAudioAbertura}`);

    const slidesComAudio: Slide[] = [];
    const BATCH_SIZE = 3;
    
    for (let i = 0; i < slides.length; i += BATCH_SIZE) {
      const batch = slides.slice(i, i + BATCH_SIZE);
      console.log(`Gerando áudios dos slides ${i + 1} a ${Math.min(i + BATCH_SIZE, slides.length)}...`);
      
      const resultados = await Promise.all(
        batch.map(async (slide, batchIdx) => {
          const slideIndex = i + batchIdx;
          try {
            const audioSlide = await gerarAudioTTS(slide.texto_narrado, geminiKeys);
            const urlAudioSlide = await uploadAudioSegment(supabase, audioSlide, tipo, dataHoje, `slide_${slideIndex}`);
            console.log(`✅ Áudio slide ${slideIndex + 1}: ${urlAudioSlide}`);
            return { ...slide, url_audio: urlAudioSlide };
          } catch (error) {
            console.error(`Erro ao gerar áudio do slide ${slideIndex + 1}:`, error);
            return { ...slide, url_audio: '' };
          }
        })
      );
      
      slidesComAudio.push(...resultados);
      
      if (i + BATCH_SIZE < slides.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Gerando áudio do fechamento...`);
    const audioFechamento = await gerarAudioTTS(fechamento, geminiKeys);
    const urlAudioFechamento = await uploadAudioSegment(supabase, audioFechamento, tipo, dataHoje, 'fechamento');
    console.log(`✅ Áudio fechamento: ${urlAudioFechamento}`);

    const textoCompleto = [abertura, ...slidesComAudio.map(s => s.texto_narrado), fechamento].join(' ');

    const { data: resumo, error: saveError } = await supabase
      .from('resumos_diarios')
      .upsert({
        tipo,
        data: dataHoje,
        noticias_ids: noticiasLimitadas.map(n => n.id),
        texto_resumo: textoCompleto,
        slides: slidesComAudio,
        termos,
        url_audio: urlAudioAbertura,
        url_audio_abertura: urlAudioAbertura,
        url_audio_fechamento: urlAudioFechamento,
        total_noticias: noticiasLimitadas.length,
        hora_corte: '23:00:00'
      }, { onConflict: 'tipo,data' })
      .select()
      .single();

    if (saveError) throw saveError;

    console.log(`✅ Resumo salvo com ${slidesComAudio.length} áudios individuais!`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Resumo gerado com sucesso",
      resumo 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    console.error("Erro:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
