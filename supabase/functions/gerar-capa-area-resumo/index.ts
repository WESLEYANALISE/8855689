import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sistema de paletas de cores por área jurídica - identidade visual única
const PALETAS_POR_AREA: Record<string, { cores: string; visual: string; mood: string }> = {
  "Ética Profissional": {
    cores: "charcoal black, silver metallic, white marble, dignified gold accents",
    visual: "OAB emblem, ethics code books, distinguished lawyer's office with professional certificate",
    mood: "dignified, serious, professional integrity"
  },
  "Direito Constitucional": {
    cores: "imperial sapphire blue, regal gold, pristine white marble, patriotic green-yellow accents",
    visual: "Brazilian Supreme Court STF building, Constitution 1988 open, democratic pillars",
    mood: "majestic, sovereign, foundational"
  },
  "Direito Civil": {
    cores: "warm mahogany brown, cream parchment, antique gold, burgundy leather",
    visual: "elegant private law office, family portraits, inheritance documents, wedding rings",
    mood: "warm, traditional, personal relationships"
  },
  "Direito Penal": {
    cores: "deep crimson red, noir black shadows, steel gray, cold blue highlights",
    visual: "dramatic criminal courtroom, defendant's bench, handcuffs, judge's gavel",
    mood: "intense, dramatic, noir tension"
  },
  "Direito Processual Civil": {
    cores: "clean navy blue, organized white, silver accents, light gray",
    visual: "organized legal documents, court filing stamps, procedural timelines",
    mood: "clean, methodical, procedural order"
  },
  "Direito Processual Penal": {
    cores: "dark charcoal, police blue, courtroom brown, evidence yellow",
    visual: "police investigation room, criminal case folders, forensic atmosphere",
    mood: "serious, investigative, procedural justice"
  },
  "Direito do Trabalho": {
    cores: "worker orange, corporate blue, industrial gray, safety yellow",
    visual: "corporate negotiation table, labor union symbols, hard hats, worker protection",
    mood: "dynamic, protective, worker dignity"
  },
  "Direito Administrativo": {
    cores: "institutional gray, navy blue, official gold seals, government green",
    visual: "Brazilian government building interior, official stamps, public servant desk",
    mood: "formal, bureaucratic, institutional"
  },
  "Direito Tributário": {
    cores: "fiscal green, financial gold, accounting gray, treasury emerald",
    visual: "tax documents, Receita Federal symbols, calculator, financial reports",
    mood: "fiscal, precise, financial responsibility"
  },
  "Direito Empresarial": {
    cores: "corporate blue, executive gold, modern glass, silver chrome",
    visual: "corporate boardroom, company contracts, stock certificates, glass office tower",
    mood: "modern, corporate, business sophistication"
  },
  "Direito Ambiental": {
    cores: "forest green, earth brown, sky blue, natural moss tones",
    visual: "Amazon rainforest meeting law office, IBAMA symbols, sustainable nature",
    mood: "natural, protective, ecological balance"
  },
  "Direitos Humanos": {
    cores: "peaceful sky blue, diverse skin tones, unity white, hope gold",
    visual: "diverse hands of different ethnicities united, UN declaration, hopeful light",
    mood: "hopeful, unified, human dignity"
  },
  "Direito Internacional Público": {
    cores: "diplomatic blue, world gold, treaty white, flag multicolors",
    visual: "world map with treaties, multiple country flags, diplomatic seals",
    mood: "global, diplomatic, international order"
  },
  "Direito Internacional Privado": {
    cores: "elegant navy, cosmopolitan gold, passport burgundy, global silver",
    visual: "international contracts, multiple passports, global trade symbols",
    mood: "cosmopolitan, elegant, cross-border"
  },
  "Direito Financeiro": {
    cores: "treasury green, budget gold, fiscal gray, government blue",
    visual: "public budget documents, financial charts, treasury building",
    mood: "fiscal, governmental, public finance"
  },
  "Teoria e Filosofia do Direito": {
    cores: "classical marble white, philosophical indigo, ancient gold, parchment cream",
    visual: "Greek philosophical setting, Themis statue, philosophers, ancient law books",
    mood: "contemplative, classical, philosophical depth"
  },
  "Direito Eleitoral": {
    cores: "democratic blue, ballot white, electoral green-yellow, civic red",
    visual: "Brazilian electronic voting machine, ballot box, election banners",
    mood: "democratic, civic, participatory"
  },
  "Direito Previdenciário": {
    cores: "protective blue, caring orange, retirement gold, INSS green",
    visual: "retirement documents, elderly receiving benefits, INSS building",
    mood: "caring, protective, social security"
  },
  "Direito da Criança e do Adolescente": {
    cores: "hopeful sky blue, protective purple, caring pink, playful yellow",
    visual: "child protection imagery, ECA statute book, caring adult hands",
    mood: "hopeful, protective, nurturing"
  },
  "Direito Romano": {
    cores: "ancient marble white, Roman gold, imperial purple, bronze patina",
    visual: "Roman senator in toga, ancient scrolls, Latin inscriptions, Colosseum columns",
    mood: "ancient, foundational, classical Rome"
  },
  "História do Direito": {
    cores: "aged parchment sepia, medieval brown, historical gold, ink black",
    visual: "medieval manuscripts, historical timeline, ancient legal codes evolving",
    mood: "historical, evolutionary, archival"
  }
};

function getPromptForArea(area: string): string {
  const areaConfig = PALETAS_POR_AREA[area] || {
    cores: "professional navy blue, gold accents, white marble, warm brown leather",
    visual: "elegant law library, legal books, gavel, scales of justice",
    mood: "professional, authoritative, scholarly"
  };
  
  return `Generate a CINEMATIC LANDSCAPE cover image in STRICT 16:9 HORIZONTAL format (WIDER than TALL).

CRITICAL REQUIREMENTS:
1. Image MUST be LANDSCAPE orientation - significantly wider than tall
2. NO text, NO words, NO letters, NO typography anywhere in the image
3. Photorealistic, ultra-high resolution, cinematic quality
4. This is a COVER for the entire legal area "${area}" - must be representative and iconic

MANDATORY COLOR PALETTE (apply throughout entire composition):
${areaConfig.cores}

VISUAL ELEMENTS (create an iconic representation):
${areaConfig.visual}

MOOD & ATMOSPHERE:
${areaConfig.mood}

COMPOSITION REQUIREMENTS:
- Wide establishing shot that captures the essence of this legal area
- Dramatic cinematic lighting with golden hour atmosphere
- Professional legal/academic setting
- Must work as a cover for educational content
- Ultra high resolution photorealistic rendering
- This image will represent ALL topics in "${area}" - make it universally applicable`;
}

async function gerarImagemComGemini(prompt: string): Promise<string | null> {
  const API_KEYS = [
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
    Deno.env.get('GEMINI_KEY_3'),
  ].filter(Boolean);
  
  console.log(`[Capa Área] Tentando ${API_KEYS.length} chaves Gemini disponíveis`);
  
  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      console.log(`[Capa Área] Tentando chave ${i + 1}...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${API_KEYS[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"]
            }
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`[Capa Área] Chave ${i + 1} falhou: ${response.status} - ${errorText.substring(0, 200)}`);
        continue;
      }
      
      const data = await response.json();
      
      for (const part of data.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          console.log(`[Capa Área] ✅ Sucesso com chave ${i + 1}`);
          return part.inlineData.data;
        }
      }
      
      console.log(`[Capa Área] Chave ${i + 1} não retornou imagem`);
    } catch (err) {
      console.log(`[Capa Área] Chave ${i + 1} erro:`, err);
      continue;
    }
  }
  
  return null;
}

async function comprimirComTinyPNG(base64Data: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const TINYPNG_API_KEY = Deno.env.get("TINYPNG_API_KEY");
  
  // Converter base64 para ArrayBuffer
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const originalBuffer = bytes.buffer;
  
  if (!TINYPNG_API_KEY) {
    console.log("[Capa Área] TinyPNG não configurado, retornando imagem original");
    return { buffer: originalBuffer, contentType: "image/png" };
  }

  try {
    const response = await fetch("https://api.tinify.com/shrink", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${TINYPNG_API_KEY}`)}`,
        "Content-Type": "image/png",
      },
      body: originalBuffer,
    });

    if (!response.ok) {
      console.error("[Capa Área] Erro TinyPNG:", response.status);
      return { buffer: originalBuffer, contentType: "image/png" };
    }

    const result = await response.json();
    
    // Baixar versão WebP em 16:9 landscape (1280x720)
    const webpResponse = await fetch(result.output.url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${TINYPNG_API_KEY}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        convert: { type: "image/webp" },
        resize: { method: "cover", width: 1280, height: 720 }
      }),
    });

    if (webpResponse.ok) {
      console.log("[Capa Área] ✅ Imagem convertida para WebP 1280x720");
      return { buffer: await webpResponse.arrayBuffer(), contentType: "image/webp" };
    }
    
    // Fallback: baixar PNG comprimido
    const pngResponse = await fetch(result.output.url);
    return { buffer: await pngResponse.arrayBuffer(), contentType: "image/png" };
  } catch (error) {
    console.error("[Capa Área] Erro ao comprimir imagem:", error);
    return { buffer: originalBuffer, contentType: "image/png" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, aplicar_em_todos } = await req.json();
    
    if (!area) {
      return new Response(
        JSON.stringify({ error: "área é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Capa Área] Gerando imagem para área: "${area}"`);
    
    const prompt = getPromptForArea(area);
    
    const base64Image = await gerarImagemComGemini(prompt);
    
    if (!base64Image) {
      return new Response(
        JSON.stringify({ error: "Falha ao gerar imagem com todas as chaves Gemini" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Comprimir imagem
    console.log(`[Capa Área] Comprimindo imagem...`);
    const { buffer: compressedBuffer, contentType } = await comprimirComTinyPNG(base64Image);
    const extension = contentType === "image/webp" ? "webp" : "png";

    // Upload para Supabase Storage - pasta específica para capas de área
    const areaSlug = area.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").toLowerCase();
    const fileName = `area-${areaSlug}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("gerador-imagens")
      .upload(`capas-area-resumo/${fileName}`, compressedBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from("gerador-imagens")
      .getPublicUrl(`capas-area-resumo/${fileName}`);

    let resumosAtualizados = 0;

    // Se aplicar_em_todos = true, atualizar TODOS os resumos da área
    if (aplicar_em_todos !== false) {
      const { data, error: updateError } = await supabase
        .from("RESUMO")
        .update({ url_imagem_resumo: publicUrl })
        .eq("area", area)
        .select("id");

      if (updateError) {
        throw new Error(`Erro ao atualizar resumos: ${updateError.message}`);
      }

      resumosAtualizados = data?.length || 0;
      console.log(`[Capa Área] ✅ Capa aplicada a ${resumosAtualizados} resumos da área "${area}"`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrl,
        area,
        resumos_atualizados: resumosAtualizados
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Capa Área] Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
