import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Formatar timestamp de milissegundos para MM:SS
function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Parsear XML de legendas para texto com timestamps
function parseXMLCaptions(xmlText: string): string | null {
  try {
    const segments: { start: number; text: string }[] = [];
    
    const textRegex = /<text start="([^"]+)"[^>]*>([^<]*)<\/text>/g;
    let match;
    
    while ((match = textRegex.exec(xmlText)) !== null) {
      const startSeconds = parseFloat(match[1]) * 1000;
      let text = match[2]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, ' ')
        .trim();
      
      if (text) {
        segments.push({ start: startSeconds, text });
      }
    }
    
    if (segments.length === 0) return null;
    
    const transcricao = segments
      .map(s => `[${formatTimestamp(s.start)}] ${s.text}`)
      .join('\n');
    
    return transcricao.length > 50 ? transcricao : null;
  } catch (error) {
    console.error("Erro ao parsear XML:", error);
    return null;
  }
}

// Processar eventos de legendas JSON
function processarEventosLegenda(events: any[]): string | null {
  const transcricao = events
    .filter((e: any) => e.segs && e.segs.length > 0)
    .map((e: any) => {
      const timestamp = formatTimestamp(e.tStartMs || 0);
      const texto = e.segs
        .map((s: any) => s.utf8 || '')
        .join('')
        .trim();
      return texto ? `[${timestamp}] ${texto}` : null;
    })
    .filter(Boolean)
    .join('\n');

  return transcricao && transcricao.length > 50 ? transcricao : null;
}

// MÉTODO 1: Usar Firecrawl para buscar a página do YouTube e extrair legendas
async function buscarViaFirecrawl(videoId: string): Promise<string | null> {
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
  
  if (!firecrawlApiKey) {
    console.log("⚠️ FIRECRAWL_API_KEY não configurada");
    return null;
  }
  
  try {
    console.log("📥 Método 1 (Firecrawl): Buscando página do YouTube para:", videoId);
    
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlApiKey}`
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        formats: ["html"],
        waitFor: 2000
      })
    });

    if (!response.ok) {
      console.log("❌ Erro no Firecrawl:", response.status);
      return null;
    }

    const data = await response.json();
    const html = data.data?.html || "";
    
    if (!html) {
      console.log("⚠️ HTML vazio do Firecrawl");
      return null;
    }

    // Extrair captionTracks do HTML
    const captionMatch = html.match(/"captionTracks":(\[.*?\])/);
    if (!captionMatch) {
      console.log("⚠️ Nenhuma legenda encontrada via Firecrawl");
      return null;
    }

    let captionTracks;
    try {
      captionTracks = JSON.parse(captionMatch[1]);
    } catch (e) {
      console.log("❌ Erro ao parsear captionTracks");
      return null;
    }

    if (!captionTracks || captionTracks.length === 0) {
      console.log("⚠️ Array de legendas vazio");
      return null;
    }

    console.log("📝 Legendas via Firecrawl:", 
      captionTracks.map((t: any) => `${t.languageCode}${t.kind === 'asr' ? ' (auto)' : ''}`).join(', ')
    );

    // Selecionar legenda
    const selectedCaption = 
      captionTracks.find((t: any) => t.languageCode === 'pt' && t.kind !== 'asr') ||
      captionTracks.find((t: any) => t.languageCode === 'pt-BR' && t.kind !== 'asr') ||
      captionTracks.find((t: any) => t.languageCode === 'pt') ||
      captionTracks.find((t: any) => t.languageCode === 'pt-BR') ||
      captionTracks.find((t: any) => t.kind === 'asr') ||
      captionTracks[0];

    if (!selectedCaption?.baseUrl) {
      console.log("❌ Nenhuma URL de legenda válida");
      return null;
    }

    console.log(`📥 Baixando legenda: ${selectedCaption.languageCode}${selectedCaption.kind === 'asr' ? ' (auto)' : ''}`);

    // Baixar legendas via Firecrawl também para evitar bloqueio
    const captionResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlApiKey}`
      },
      body: JSON.stringify({
        url: selectedCaption.baseUrl + "&fmt=json3",
        formats: ["rawHtml"]
      })
    });

    if (captionResponse.ok) {
      const captionData = await captionResponse.json();
      const rawContent = captionData.data?.rawHtml || captionData.data?.html || "";
      
      if (rawContent) {
        try {
          // Tentar parsear como JSON
          const jsonData = JSON.parse(rawContent);
          if (jsonData.events?.length > 0) {
            const transcricao = processarEventosLegenda(jsonData.events);
            if (transcricao) {
              console.log("✅ Legendas via Firecrawl (JSON) obtidas! Tamanho:", transcricao.length);
              return transcricao;
            }
          }
        } catch (e) {
          // Tentar como XML
          const transcricao = parseXMLCaptions(rawContent);
          if (transcricao) {
            console.log("✅ Legendas via Firecrawl (XML) obtidas! Tamanho:", transcricao.length);
            return transcricao;
          }
        }
      }
    }

    // Fallback: tentar baixar diretamente (pode funcionar se a URL de legenda não tiver proteção)
    try {
      const directResponse = await fetch(selectedCaption.baseUrl + "&fmt=json3");
      if (directResponse.ok) {
        const jsonData = await directResponse.json();
        if (jsonData.events?.length > 0) {
          const transcricao = processarEventosLegenda(jsonData.events);
          if (transcricao) {
            console.log("✅ Legendas via URL direta obtidas! Tamanho:", transcricao.length);
            return transcricao;
          }
        }
      }
    } catch (e) {
      console.log("⚠️ Falha ao baixar legendas diretamente");
    }

    return null;
  } catch (error) {
    console.error("❌ Erro no Método 1 (Firecrawl):", error);
    return null;
  }
}

// MÉTODO 2: Buscar via API Innertube (fallback)
async function buscarViaInnertube(videoId: string): Promise<string | null> {
  try {
    console.log("📥 Método 2 (Innertube): Buscando legendas para:", videoId);
    
    const innertubeBody = {
      context: {
        client: {
          hl: "pt",
          gl: "BR",
          clientName: "WEB",
          clientVersion: "2.20231219.04.00"
        }
      },
      videoId: videoId
    };

    const innertubeResponse = await fetch(
      "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Origin": "https://www.youtube.com",
        },
        body: JSON.stringify(innertubeBody)
      }
    );

    if (!innertubeResponse.ok) {
      console.log("❌ Erro na API Innertube:", innertubeResponse.status);
      return null;
    }

    const playerData = await innertubeResponse.json();
    
    if (playerData.playabilityStatus?.status !== "OK") {
      console.log("⚠️ Vídeo não disponível via Innertube:", playerData.playabilityStatus?.reason || "desconhecido");
      return null;
    }

    const captionTracks = playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!captionTracks || captionTracks.length === 0) {
      console.log("⚠️ Nenhuma legenda encontrada via Innertube");
      return null;
    }

    console.log("📝 Legendas via Innertube:", 
      captionTracks.map((t: any) => `${t.languageCode}${t.kind === 'asr' ? ' (auto)' : ''}`).join(', ')
    );

    const selectedCaption = 
      captionTracks.find((t: any) => t.languageCode === 'pt' && t.kind !== 'asr') ||
      captionTracks.find((t: any) => t.languageCode === 'pt-BR') ||
      captionTracks.find((t: any) => t.languageCode === 'pt') ||
      captionTracks.find((t: any) => t.kind === 'asr') ||
      captionTracks[0];

    if (!selectedCaption?.baseUrl) return null;

    // Tentar baixar legendas
    try {
      const jsonResponse = await fetch(selectedCaption.baseUrl + "&fmt=json3");
      if (jsonResponse.ok) {
        const captionData = await jsonResponse.json();
        if (captionData.events?.length > 0) {
          const transcricao = processarEventosLegenda(captionData.events);
          if (transcricao) {
            console.log("✅ Legendas via Innertube obtidas! Tamanho:", transcricao.length);
            return transcricao;
          }
        }
      }
    } catch (e) {}

    return null;
  } catch (error) {
    console.error("❌ Erro no Método 2 (Innertube):", error);
    return null;
  }
}

// MÉTODO 3: TimedText API direto
async function buscarViaTimedText(videoId: string): Promise<string | null> {
  try {
    console.log("📥 Método 3 (TimedText): Buscando legendas para:", videoId);
    
    const urls = [
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=pt&fmt=json3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=pt-BR&fmt=json3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=pt&kind=asr&fmt=json3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&fmt=json3`,
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        
        const text = await response.text();
        if (!text || text.length < 10) continue;
        
        try {
          const data = JSON.parse(text);
          if (data.events?.length > 0) {
            const transcricao = processarEventosLegenda(data.events);
            if (transcricao) {
              console.log("✅ Legendas via TimedText obtidas! Tamanho:", transcricao.length);
              return transcricao;
            }
          }
        } catch (e) {}
      } catch (e) {
        continue;
      }
    }

    console.log("⚠️ Nenhuma legenda encontrada via TimedText");
    return null;
  } catch (error) {
    console.error("❌ Erro no Método 3:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId, documentarioId, titulo } = await req.json();

    if (!videoId || !documentarioId) {
      return new Response(
        JSON.stringify({ error: "videoId e documentarioId são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("=== Iniciando busca de transcrição para:", videoId, "===");
    console.log("Título:", titulo);

    let transcricao: string | null = null;
    let fonte = "";

    // MÉTODO 1: Firecrawl (principal - contorna bloqueios)
    transcricao = await buscarViaFirecrawl(videoId);
    if (transcricao) {
      fonte = "firecrawl";
    }
    
    // MÉTODO 2: Innertube API (fallback)
    if (!transcricao) {
      transcricao = await buscarViaInnertube(videoId);
      if (transcricao) {
        fonte = "innertube";
      }
    }
    
    // MÉTODO 3: TimedText direto
    if (!transcricao) {
      transcricao = await buscarViaTimedText(videoId);
      if (transcricao) {
        fonte = "timedtext";
      }
    }

    // Se nenhum método funcionou
    if (!transcricao) {
      console.log("❌ Nenhum método conseguiu obter a transcrição");
      return new Response(
        JSON.stringify({ 
          error: "Transcrição não disponível para este vídeo",
          message: "O vídeo não possui legendas disponíveis (automáticas ou manuais)"
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📊 Transcrição obtida via:", fonte, "| Tamanho:", transcricao.length);

    // Salvar no Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from("documentarios_juridicos")
      .update({
        transcricao_texto: transcricao,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentarioId);

    if (updateError) {
      console.error("❌ Erro ao salvar transcrição:", updateError);
      throw new Error("Erro ao salvar transcrição no banco de dados");
    }

    console.log("✅ Transcrição salva com sucesso para:", titulo);

    return new Response(
      JSON.stringify({ 
        success: true,
        transcricao,
        fonte,
        caracteres: transcricao.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Erro na transcrição:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
