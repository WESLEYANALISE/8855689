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

function getPromptForSubtema(titulo: string, area: string): string {
  const areaConfig = PALETAS_POR_AREA[area] || PALETAS_POR_AREA["Direito Constitucional"];
  
  return `Generate a CINEMATIC LANDSCAPE cover image in STRICT 16:9 HORIZONTAL format (WIDER than TALL).

CRITICAL REQUIREMENTS:
1. Image MUST be LANDSCAPE orientation - significantly wider than tall
2. NO text, NO words, NO letters, NO typography anywhere in the image
3. Photorealistic, ultra-high resolution, cinematic quality
4. FULL BLEED edge-to-edge composition, NO white borders, NO margins

SUBJECT: "${titulo}" - Legal subtopic in ${area}

MANDATORY COLOR PALETTE (apply throughout entire composition):
${areaConfig.cores}

VISUAL ELEMENTS (adapt to specific subtopic):
${areaConfig.visual}

MOOD & ATMOSPHERE:
${areaConfig.mood}

TECHNICAL SPECS:
- Cinematic lighting with dramatic shadows and highlights
- Rich color grading matching the specified palette
- Professional legal/academic atmosphere
- Suitable as educational content cover
- Ultra high resolution photorealistic rendering
- FULL BLEED: image extends to ALL edges, no white corners`;
}

// Gerar imagem com Gemini usando fetch direto - MESMO MÉTODO DOS CONCEITOS
async function gerarImagemComGemini(prompt: string): Promise<string | null> {
  const keys: string[] = [];
  const key1 = Deno.env.get('GEMINI_KEY_1');
  const key2 = Deno.env.get('GEMINI_KEY_2');
  const key3 = Deno.env.get('GEMINI_KEY_3');
  
  if (key1) keys.push(key1);
  if (key2) keys.push(key2);
  if (key3) keys.push(key3);
  
  if (keys.length === 0) {
    throw new Error('Nenhuma chave Gemini configurada');
  }
  
  console.log(`[Capa Subtema] Tentando ${keys.length} chaves Gemini disponíveis`);
  
  // MODELO CORRETO PARA GERAÇÃO DE IMAGEM - IGUAL AOS CONCEITOS
  const modelName = "gemini-2.5-flash-image";
  let lastError: Error | null = null;
  
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    try {
      console.log(`[Capa Subtema] Tentando chave ${i + 1}/${keys.length} com ${modelName}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
              role: 'user', 
              parts: [{ text: prompt }] 
            }]
          }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`[Capa Subtema] Chave ${i + 1} com rate limit, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Capa Subtema] Erro na chave ${i + 1}:`, response.status, errorText.substring(0, 200));
        continue;
      }

      const data = await response.json();
      
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          console.log(`[Capa Subtema] ✅ Sucesso com chave ${i + 1}`);
          return part.inlineData.data; // Retorna base64 puro
        }
      }
      
      console.log(`[Capa Subtema] Chave ${i + 1} não retornou imagem, tentando próxima...`);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Capa Subtema] Erro na chave ${i + 1}:`, lastError.message);
    }
  }
  
  console.error('[Capa Subtema] Todas as chaves Gemini falharam');
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
    console.log("[Capa Subtema] TinyPNG não configurado, retornando imagem original");
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
      console.error("[Capa Subtema] Erro TinyPNG:", response.status);
      return { buffer: originalBuffer, contentType: "image/png" };
    }

    const result = await response.json();
    
    // Baixar versão WebP em 16:9 landscape (1280x720) - MESMO QUE CONCEITOS
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
      console.log("[Capa Subtema] ✅ Imagem convertida para WebP 1280x720");
      return { buffer: await webpResponse.arrayBuffer(), contentType: "image/webp" };
    }
    
    // Fallback: baixar PNG comprimido
    const pngResponse = await fetch(result.output.url);
    return { buffer: await pngResponse.arrayBuffer(), contentType: "image/png" };
  } catch (error) {
    console.error("[Capa Subtema] Erro ao comprimir imagem:", error);
    return { buffer: originalBuffer, contentType: "image/png" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumo_id, titulo, area } = await req.json();
    
    if (!resumo_id) {
      return new Response(
        JSON.stringify({ error: "resumo_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já tem capa
    const { data: resumo } = await supabase
      .from("RESUMO")
      .select("url_imagem_resumo")
      .eq("id", resumo_id)
      .single();

    if (resumo?.url_imagem_resumo) {
      return new Response(
        JSON.stringify({ success: true, message: "Capa já existe", url: resumo.url_imagem_resumo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Capa Subtema] Gerando imagem para resumo ${resumo_id}: "${titulo}" (${area})`);
    
    const prompt = getPromptForSubtema(titulo, area);
    console.log(`[Capa Subtema] Usando paleta de: ${area}`);
    
    const base64Image = await gerarImagemComGemini(prompt);
    
    if (!base64Image) {
      return new Response(
        JSON.stringify({ error: "Falha ao gerar imagem com todas as chaves Gemini" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Comprimir imagem
    console.log(`[Capa Subtema] Comprimindo imagem...`);
    const { buffer: compressedBuffer, contentType } = await comprimirComTinyPNG(base64Image);
    const extension = contentType === "image/webp" ? "webp" : "png";

    // Upload para Supabase Storage
    const fileName = `resumo-${resumo_id}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("gerador-imagens")
      .upload(`capas-resumo/${fileName}`, compressedBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from("gerador-imagens")
      .getPublicUrl(`capas-resumo/${fileName}`);

    // Atualizar RESUMO com URL da capa
    const { error: updateError } = await supabase
      .from("RESUMO")
      .update({ url_imagem_resumo: publicUrl })
      .eq("id", resumo_id);

    if (updateError) {
      throw new Error(`Erro ao atualizar resumo: ${updateError.message}`);
    }

    console.log(`[Capa Subtema] ✅ Capa salva com sucesso para resumo ${resumo_id}`);

    return new Response(
      JSON.stringify({ success: true, url: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Capa Subtema] Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
