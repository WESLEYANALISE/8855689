import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
].filter(Boolean) as string[];

async function callGeminiWithFallback(prompt: string): Promise<string> {
  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error (key ${i + 1}):`, response.status, errorText);
        if (response.status === 429 || response.status === 503) {
          continue;
        }
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("No text in Gemini response");
      return text;
    } catch (error) {
      console.error(`Error with key ${i + 1}:`, error);
      if (i === API_KEYS.length - 1) throw error;
    }
  }
  throw new Error("All API keys failed");
}

// Extract video ID from YouTube URL
function extractVideoId(url: string): string {
  if (!url) return '';
  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /embed\/([^?&]+)/,
    /shorts\/([^?&]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return '';
}

// Fetch YouTube captions/transcript
async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  console.log(`Fetching transcript for video: ${videoId}`);
  
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(videoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video page: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract captionTracks from the page
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    
    let captionTracks;
    try {
      const tracksJson = captionMatch ? captionMatch[1] : null;
      if (tracksJson) {
        captionTracks = JSON.parse(tracksJson);
      }
    } catch {
      console.log("Failed to parse caption tracks");
    }

    // Find Portuguese or auto-generated Portuguese captions
    let captionUrl = null;
    if (captionTracks && captionTracks.length > 0) {
      const ptTrack = captionTracks.find((t: any) => 
        t.languageCode === "pt" || t.languageCode === "pt-BR"
      );
      const autoTrack = captionTracks.find((t: any) => 
        t.kind === "asr" && (t.languageCode === "pt" || t.languageCode === "pt-BR")
      );
      const anyTrack = captionTracks[0];
      
      captionUrl = (ptTrack || autoTrack || anyTrack)?.baseUrl;
    }

    if (!captionUrl) {
      // Alternative: try timedtext API directly
      const timedTextUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=pt&fmt=srv3`;
      const ttResponse = await fetch(timedTextUrl);
      if (ttResponse.ok) {
        const ttXml = await ttResponse.text();
        if (ttXml && ttXml.includes("<text")) {
          return parseXmlTranscript(ttXml);
        }
      }
      
      // Try auto-generated
      const autoUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=pt&kind=asr&fmt=srv3`;
      const autoResponse = await fetch(autoUrl);
      if (autoResponse.ok) {
        const autoXml = await autoResponse.text();
        if (autoXml && autoXml.includes("<text")) {
          return parseXmlTranscript(autoXml);
        }
      }
      
      throw new Error("Could not find captions for this video");
    }

    const captionsResponse = await fetch(captionUrl);
    if (!captionsResponse.ok) {
      throw new Error(`Failed to fetch captions: ${captionsResponse.status}`);
    }

    const captionsXml = await captionsResponse.text();
    return parseXmlTranscript(captionsXml);

  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw error;
  }
}

function parseXmlTranscript(xml: string): string {
  const textMatches = xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g);
  const texts: string[] = [];
  
  for (const match of textMatches) {
    let text = match[1];
    text = text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/\n/g, " ")
      .trim();
    
    if (text) {
      texts.push(text);
    }
  }
  
  return texts.join(" ");
}

async function generateSobreAula(titulo: string, transcricao: string): Promise<string> {
  const prompt = `Você é um professor de Direito especializado em criar resumos didáticos para a 2ª Fase da OAB.

Com base no título e transcrição da videoaula abaixo, crie um texto "Sobre esta aula" que:
1. Liste ESPECIFICAMENTE os pontos/dicas/conceitos ensinados na aula (ex: se o título menciona "8 dicas", liste as 8 dicas)
2. Explique brevemente cada ponto mencionado na aula
3. Destaque a aplicação prática de cada dica/conceito
4. Tenha entre 200-300 palavras

IMPORTANTE: Extraia o conteúdo REAL da transcrição. Se a aula fala sobre "dicas", liste cada dica. Se fala sobre "técnicas", liste cada técnica. Seja específico!

TÍTULO: ${titulo}

TRANSCRIÇÃO:
${transcricao.substring(0, 8000)}

Responda APENAS com o texto resumindo os pontos específicos ensinados, sem títulos ou formatação especial.`;

  return await callGeminiWithFallback(prompt);
}

async function generateQuestoes(titulo: string, transcricao: string, tentativa = 1): Promise<any[]> {
  const prompt = `Você é um professor de Direito criando questões para testar o aprendizado de estudantes da 2ª Fase da OAB.

TÍTULO: ${titulo}

TRANSCRIÇÃO:
${transcricao.substring(0, 12000)}

VOCÊ DEVE CRIAR EXATAMENTE 12 QUESTÕES. NÃO CRIE MENOS QUE 10.

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`):
[
  {
    "id": 1,
    "pergunta": "Pergunta específica sobre conceito da aula",
    "alternativas": ["A) Opção A", "B) Opção B", "C) Opção C", "D) Opção D"],
    "resposta_correta": 0,
    "explicacao": "Explicação detalhada."
  },
  ... (continue até ter 12 questões)
]

REGRAS OBRIGATÓRIAS:
1. MÍNIMO 10 questões, IDEAL 12 questões
2. Cada questão deve cobrir um aspecto DIFERENTE da aula
3. Perguntas específicas sobre: requisitos, prazos, fundamentos, procedimentos, dicas práticas
4. Alternativas plausíveis mas só uma correta
5. resposta_correta é índice 0-3
6. NÃO pergunte "qual o tema da aula" - pergunte sobre CONTEÚDO específico
7. Retorne APENAS o JSON`;

  const response = await callGeminiWithFallback(prompt);
  
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse questions JSON");
  }
  
  const questoes = JSON.parse(jsonMatch[0]);
  
  // Se gerou menos de 10 e ainda não tentou 2 vezes, tenta novamente
  if (questoes.length < 10 && tentativa < 2) {
    console.log(`Only ${questoes.length} questions generated, retrying...`);
    return generateQuestoes(titulo, transcricao, tentativa + 1);
  }
  
  return questoes;
}

async function generateFlashcards(titulo: string, transcricao: string, tentativa = 1): Promise<any[]> {
  const prompt = `Você é um professor de Direito criando flashcards para memorização da 2ª Fase da OAB.

TÍTULO: ${titulo}

TRANSCRIÇÃO:
${transcricao.substring(0, 12000)}

VOCÊ DEVE CRIAR EXATAMENTE 12 FLASHCARDS. NÃO CRIE MENOS QUE 10.

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`):
[
  {
    "id": 1,
    "frente": "Conceito ou pergunta específica",
    "verso": "Resposta/explicação detalhada",
    "exemplo": "Exemplo prático de aplicação"
  },
  ... (continue até ter 12 flashcards)
]

REGRAS OBRIGATÓRIAS:
1. MÍNIMO 10 flashcards, IDEAL 12 flashcards
2. Cada flashcard deve cobrir um conceito DIFERENTE
3. Cubra: definições, requisitos, prazos, procedimentos, dicas, armadilhas comuns
4. A "frente" deve ser uma pergunta ou conceito-chave
5. O "verso" deve ser a explicação completa
6. O "exemplo" deve mostrar aplicação prática
7. NÃO crie cards genéricos como "tema da aula"
8. Retorne APENAS o JSON`;

  const response = await callGeminiWithFallback(prompt);
  
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse flashcards JSON");
  }
  
  const flashcards = JSON.parse(jsonMatch[0]);
  
  // Se gerou menos de 10 e ainda não tentou 2 vezes, tenta novamente
  if (flashcards.length < 10 && tentativa < 2) {
    console.log(`Only ${flashcards.length} flashcards generated, retrying...`);
    return generateFlashcards(titulo, transcricao, tentativa + 1);
  }
  
  return flashcards;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoaulaId } = await req.json();
    
    if (!videoaulaId) {
      throw new Error("videoaulaId is required");
    }

    console.log(`[processar-videoaula-oab] Starting processing for ID: ${videoaulaId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch videoaula from VIDEO AULAS-NOVO table
    const { data: videoaula, error: fetchError } = await supabase
      .from("VIDEO AULAS-NOVO")
      .select("*")
      .eq("id", videoaulaId)
      .single();

    if (fetchError || !videoaula) {
      console.error("Fetch error:", fetchError);
      throw new Error("Videoaula not found");
    }

    console.log(`Processing videoaula OAB: ${videoaula.titulo}`);

    // Extract video ID from link field
    const videoId = extractVideoId(videoaula.link || '');
    if (!videoId) {
      throw new Error("Could not extract video ID from link");
    }
    console.log(`Extracted video ID: ${videoId}`);

    // Step 1: Fetch transcript from YouTube
    console.log("Fetching YouTube transcript...");
    let transcricao: string;
    
    try {
      transcricao = await fetchYouTubeTranscript(videoId);
      console.log("Transcript fetched, length:", transcricao.length);
    } catch (transcriptError) {
      console.error("Failed to fetch transcript:", transcriptError);
      // Use title as fallback context
      transcricao = `Aula sobre: ${videoaula.titulo}. Esta é uma aula da 2ª Fase da OAB sobre ${videoaula.area || 'direito'}. O conteúdo aborda aspectos práticos e teóricos relevantes para a prova prático-profissional.`;
      console.log("Using fallback context from title");
    }

    // Step 2: Generate "Sobre esta aula"
    console.log("Generating 'Sobre esta aula'...");
    const sobreAula = await generateSobreAula(videoaula.titulo, transcricao);
    console.log("'Sobre esta aula' generated, length:", sobreAula.length);

    // Step 3: Generate flashcards
    console.log("Generating flashcards...");
    const flashcards = await generateFlashcards(videoaula.titulo, transcricao);
    console.log("Flashcards generated:", flashcards.length);

    // Step 4: Generate questions
    console.log("Generating questions...");
    const questoes = await generateQuestoes(videoaula.titulo, transcricao);
    console.log("Questions generated:", questoes.length);

    // Save to database
    const { error: updateError } = await supabase
      .from("VIDEO AULAS-NOVO")
      .update({
        transcricao,
        sobre_aula: sobreAula,
        flashcards,
        questoes,
      })
      .eq("id", videoaulaId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(`Failed to update: ${updateError.message}`);
    }

    console.log(`[processar-videoaula-oab] Successfully processed videoaula ${videoaulaId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Videoaula OAB processed successfully",
        data: {
          transcricao_length: transcricao.length,
          sobre_aula_length: sobreAula.length,
          flashcards_count: flashcards.length,
          questoes_count: questoes.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[processar-videoaula-oab] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
