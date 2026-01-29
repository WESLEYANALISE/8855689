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

// Fetch YouTube captions/transcript using youtube-transcript library approach
async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  console.log(`Fetching transcript for video: ${videoId}`);
  
  try {
    // First, try to get the video page to extract caption tracks
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
    if (!captionMatch) {
      console.log("No captions found in video page, trying alternative method...");
      // Try to get auto-generated captions
      const playerMatch = html.match(/"playerCaptionsTracklistRenderer":\s*{[^}]*"captionTracks":\s*(\[.*?\])/);
      if (!playerMatch) {
        throw new Error("No captions available for this video");
      }
    }

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

    // Fetch the actual captions
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
  // Parse XML transcript and extract text
  const textMatches = xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g);
  const texts: string[] = [];
  
  for (const match of textMatches) {
    let text = match[1];
    // Decode HTML entities
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
  const prompt = `Você é um professor de Direito especializado em criar resumos didáticos.

Com base no título e transcrição da videoaula abaixo, crie um texto "Sobre esta aula" que:
1. Explique o tema principal abordado
2. Liste os principais conceitos ensinados
3. Destaque a importância prática do conteúdo
4. Tenha entre 150-250 palavras

TÍTULO: ${titulo}

TRANSCRIÇÃO:
${transcricao.substring(0, 6000)}

Responda APENAS com o texto do "Sobre esta aula", sem títulos ou formatação especial.`;

  return await callGeminiWithFallback(prompt);
}

async function generateQuestoes(titulo: string, transcricao: string): Promise<any[]> {
  const prompt = `Você é um professor de Direito criando questões para testar o aprendizado de estudantes.

Com base no título e transcrição da videoaula abaixo, crie EXATAMENTE 5 questões de múltipla escolha.

TÍTULO: ${titulo}

TRANSCRIÇÃO:
${transcricao.substring(0, 6000)}

Retorne APENAS um JSON válido no seguinte formato (sem markdown, sem \`\`\`):
[
  {
    "id": 1,
    "pergunta": "Texto da pergunta?",
    "alternativas": ["A) Alternativa A", "B) Alternativa B", "C) Alternativa C", "D) Alternativa D"],
    "resposta_correta": 0,
    "explicacao": "Explicação de por que a alternativa correta está certa."
  }
]

REGRAS:
- Crie 5 questões sobre os principais conceitos da aula
- Cada questão deve ter 4 alternativas (A, B, C, D)
- resposta_correta é o índice da alternativa correta (0 a 3)
- A explicação deve ser didática e educativa
- Retorne APENAS o JSON, sem texto adicional`;

  const response = await callGeminiWithFallback(prompt);
  
  // Parse JSON from response
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse questions JSON");
  }
  
  return JSON.parse(jsonMatch[0]);
}

async function generateFlashcards(titulo: string, transcricao: string): Promise<any[]> {
  const prompt = `Você é um professor de Direito especializado em criar flashcards para memorização.

Com base no título e transcrição da videoaula abaixo, crie o MÁXIMO de flashcards possível (entre 8 e 15) sobre os conceitos mais importantes.

TÍTULO: ${titulo}

TRANSCRIÇÃO:
${transcricao.substring(0, 6000)}

Retorne APENAS um JSON válido no seguinte formato (sem markdown, sem \`\`\`):
[
  {
    "id": 1,
    "frente": "Pergunta ou conceito (lado da frente do card)",
    "verso": "Resposta ou explicação (lado de trás do card)",
    "exemplo": "Um exemplo prático e didático aplicando o conceito"
  }
]

REGRAS:
- Crie entre 8 e 15 flashcards cobrindo todos os conceitos importantes da aula
- A "frente" deve ter uma pergunta curta ou termo a ser definido
- O "verso" deve ter a resposta completa mas concisa
- O "exemplo" deve ser um caso prático real ou hipotético que ilustre o conceito
- Cubra definições, conceitos, exemplos, diferenças e aplicações práticas
- Retorne APENAS o JSON, sem texto adicional`;

  const response = await callGeminiWithFallback(prompt);
  
  // Parse JSON from response
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse flashcards JSON");
  }
  
  return JSON.parse(jsonMatch[0]);
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch videoaula
    const { data: videoaula, error: fetchError } = await supabase
      .from("videoaulas_iniciante")
      .select("*")
      .eq("id", videoaulaId)
      .single();

    if (fetchError || !videoaula) {
      throw new Error("Videoaula not found");
    }

    console.log(`Processing videoaula: ${videoaula.titulo}`);

    // Step 1: Fetch transcript from YouTube
    console.log("Fetching YouTube transcript...");
    let transcricao: string;
    
    try {
      transcricao = await fetchYouTubeTranscript(videoaula.video_id);
      console.log("Transcript fetched, length:", transcricao.length);
    } catch (transcriptError) {
      console.error("Failed to fetch transcript:", transcriptError);
      // Use title and description as fallback context
      transcricao = `Título: ${videoaula.titulo}. ${videoaula.descricao || "Aula sobre conceitos jurídicos fundamentais."}`;
      console.log("Using fallback context from title/description");
    }

    // Step 2: Generate "Sobre esta aula"
    console.log("Generating 'Sobre esta aula'...");
    const sobreAula = await generateSobreAula(videoaula.titulo, transcricao);
    console.log("'Sobre esta aula' generated");

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
      .from("videoaulas_iniciante")
      .update({
        transcricao,
        sobre_aula: sobreAula,
        flashcards,
        questoes,
      })
      .eq("id", videoaulaId);

    if (updateError) {
      throw new Error(`Failed to update: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Videoaula processed successfully",
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
    console.error("Error processing videoaula:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
