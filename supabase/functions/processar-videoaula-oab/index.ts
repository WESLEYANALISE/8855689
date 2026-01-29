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

async function generateSobreAula(titulo: string, transcricao: string, fase: string = "1ª"): Promise<string> {
  const prompt = `Você é um professor de Direito especializado em criar resumos didáticos para a ${fase} Fase da OAB.

Com base no título e transcrição da videoaula abaixo, crie um resumo estruturado em Markdown:

## 🎯 Tema Principal
[Qual o assunto central da aula]

## 📚 Tópicos Abordados
- [Liste os principais tópicos, conceitos e pontos ensinados]
- [Se menciona "dicas", liste cada uma]
- [Se menciona "técnicas", liste cada uma]

## 💡 Conceitos-Chave
- [Destaque definições e conceitos importantes]

## 📖 Aplicação Prática  
- [Exemplos práticos mencionados na aula]
- [Como aplicar na prova da OAB]

## ⭐ Pontos de Destaque
- [Principais aprendizados e pontos de atenção]

IMPORTANTE: Extraia o conteúdo REAL da transcrição. Seja específico e detalhado.

TÍTULO: ${titulo}

TRANSCRIÇÃO:
${transcricao.substring(0, 10000)}

Responda APENAS com o Markdown formatado.`;

  return await callGeminiWithFallback(prompt);
}

async function generateQuestoes(titulo: string, transcricao: string, fase: string = "1ª", tentativa = 1): Promise<any[]> {
  const prompt = `Você é um professor de Direito criando questões objetivas no estilo da ${fase} Fase da OAB.

TÍTULO: ${titulo}

TRANSCRIÇÃO:
${transcricao.substring(0, 15000)}

VOCÊ DEVE CRIAR O MÁXIMO DE QUESTÕES POSSÍVEL (entre 15 a 25 questões) objetivas de múltipla escolha.

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`):
[
  {
    "id": 1,
    "pergunta": "Pergunta específica sobre conceito da aula",
    "alternativas": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "resposta_correta": 0,
    "explicacao": "Explicação detalhada do porquê a resposta está correta."
  }
]

REGRAS OBRIGATÓRIAS:
1. Crie entre 15 a 25 questões objetivas - quanto mais, melhor!
2. Cada questão deve cobrir um aspecto DIFERENTE da aula
3. Perguntas sobre: conceitos, requisitos, prazos, fundamentos, procedimentos, exceções, hipóteses
4. 4 alternativas plausíveis mas só uma correta
5. resposta_correta é índice 0-3
6. NÃO pergunte "qual o tema da aula" - pergunte sobre CONTEÚDO específico
7. Crie questões de diferentes níveis de dificuldade (fácil, médio, difícil)
8. Retorne APENAS o JSON`;

  const response = await callGeminiWithFallback(prompt);
  
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse questions JSON");
  }
  
  const questoes = JSON.parse(jsonMatch[0]);
  
  // Se gerou menos de 10 e ainda não tentou 2 vezes, tenta novamente
  if (questoes.length < 10 && tentativa < 2) {
    console.log(`Only ${questoes.length} questions generated, retrying...`);
    return generateQuestoes(titulo, transcricao, fase, tentativa + 1);
  }
  
  return questoes;
}

async function generateFlashcards(titulo: string, transcricao: string, fase: string = "1ª", tentativa = 1): Promise<any[]> {
  const prompt = `Você é um professor de Direito criando flashcards para memorização da ${fase} Fase da OAB.

TÍTULO: ${titulo}

TRANSCRIÇÃO:
${transcricao.substring(0, 15000)}

VOCÊ DEVE CRIAR O MÁXIMO DE FLASHCARDS POSSÍVEL (entre 15 a 20 flashcards) para memorização.

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`):
[
  {
    "id": 1,
    "frente": "Conceito ou pergunta específica",
    "verso": "Resposta/explicação detalhada",
    "exemplo": "Exemplo prático de aplicação no dia a dia ou em provas"
  }
]

REGRAS OBRIGATÓRIAS:
1. Crie entre 15 a 20 flashcards - quanto mais, melhor!
2. Cada flashcard DEVE ter os 3 campos: frente, verso e exemplo
3. Cada flashcard deve cobrir um conceito DIFERENTE
4. Cubra: definições, requisitos, prazos, procedimentos, armadilhas comuns, exceções
5. A "frente" deve ser uma pergunta ou conceito-chave
6. O "verso" deve ser a explicação completa
7. O "exemplo" deve ser um caso prático, situação real ou como cai em prova
8. NÃO crie cards genéricos como "tema da aula"
9. Retorne APENAS o JSON`;

  const response = await callGeminiWithFallback(prompt);
  
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse flashcards JSON");
  }
  
  const flashcards = JSON.parse(jsonMatch[0]);
  
  // Se gerou menos de 10 e ainda não tentou 2 vezes, tenta novamente
  if (flashcards.length < 10 && tentativa < 2) {
    console.log(`Only ${flashcards.length} flashcards generated, retrying...`);
    return generateFlashcards(titulo, transcricao, fase, tentativa + 1);
  }
  
  return flashcards;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { videoaulaId, tabela, id, videoId: rawVideoId, titulo: rawTitulo } = body;
    
    // Support both old format (videoaulaId) and new format (tabela + id)
    const isNewFormat = tabela && id;
    const targetId = isNewFormat ? id : videoaulaId;
    const targetTabela = isNewFormat ? tabela : "VIDEO AULAS-NOVO";
    
    if (!targetId) {
      throw new Error("videoaulaId or (tabela + id) is required");
    }

    console.log(`[processar-videoaula-oab] Starting processing for ID: ${targetId} in table: ${targetTabela}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch videoaula from appropriate table
    const { data: videoaula, error: fetchError } = await supabase
      .from(targetTabela)
      .select("*")
      .eq("id", targetId)
      .single();

    if (fetchError || !videoaula) {
      console.error("Fetch error:", fetchError);
      throw new Error("Videoaula not found");
    }

    console.log(`Processing videoaula OAB: ${videoaula.titulo}`);

    // Extract video ID - handle different column names
    let videoId: string;
    if (rawVideoId) {
      videoId = rawVideoId;
    } else if (videoaula.video_id) {
      videoId = videoaula.video_id;
    } else if (videoaula.link) {
      videoId = extractVideoId(videoaula.link);
    } else {
      throw new Error("Could not find video ID");
    }
    
    if (!videoId) {
      throw new Error("Could not extract video ID");
    }
    console.log(`Using video ID: ${videoId}`);

    // Step 1: Fetch transcript from YouTube
    console.log("Fetching YouTube transcript...");
    let transcricao: string;
    
    try {
      transcricao = await fetchYouTubeTranscript(videoId);
      console.log("Transcript fetched, length:", transcricao.length);
    } catch (transcriptError) {
      console.error("Failed to fetch transcript:", transcriptError);
      // Use title as fallback context
      const area = videoaula.area || 'direito';
      transcricao = `Aula sobre: ${videoaula.titulo}. Esta é uma aula da OAB sobre ${area}. O conteúdo aborda aspectos práticos e teóricos relevantes para a prova.`;
      console.log("Using fallback context from title");
    }

    // Determinar fase (1ª ou 2ª) baseado na tabela
    const fase = targetTabela.includes("primeira") ? "1ª" : "2ª";
    console.log(`Processing for OAB ${fase} Fase`);

    // Step 2: Generate "Sobre esta aula"
    console.log("Generating 'Sobre esta aula'...");
    const sobreAula = await generateSobreAula(videoaula.titulo, transcricao, fase);
    console.log("'Sobre esta aula' generated, length:", sobreAula.length);

    // Step 3: Generate flashcards
    console.log("Generating flashcards...");
    const flashcards = await generateFlashcards(videoaula.titulo, transcricao, fase);
    console.log("Flashcards generated:", flashcards.length);

    // Step 4: Generate questions
    console.log("Generating questions...");
    const questoes = await generateQuestoes(videoaula.titulo, transcricao, fase);
    console.log("Questions generated:", questoes.length);

    // Save to database
    const { error: updateError } = await supabase
      .from(targetTabela)
      .update({
        transcricao,
        sobre_aula: sobreAula,
        flashcards,
        questoes,
      })
      .eq("id", targetId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(`Failed to update: ${updateError.message}`);
    }

    console.log(`[processar-videoaula-oab] Successfully processed videoaula ${targetId}`);

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
