import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type ContextoVisual = {
  cena: string;
  elementos: string;
  atmosfera: string;
  variacoes: string[];
};

// Foco: cenas realistas e impactantes para tópicos comuns da 1ª fase
const MAPA_TEMAS: { keywords: string[]; contexto: ContextoVisual }[] = [
  {
    keywords: ["inventario", "partilha", "sucessao", "heranca", "arrolamento"],
    contexto: {
      cena: "Photorealistic Brazilian notary office scene about estate inventory and partition",
      elementos:
        "family members seated around a table with a notary and a lawyer, property deeds, inheritance documents, folders, subtle courthouse/notary environment, warm professional lighting, serious but hopeful mood",
      atmosfera: "high-stakes family decision, legal certainty, orderly and professional",
      variacoes: [
        "notary and lawyer guiding family through estate inventory papers",
        "close-up of hands sorting property deeds and inheritance documents on a table",
        "family meeting with legal counsel, organized folders and stamps, calm tension",
        "notary office counter with documents, signatures, and a lawyer briefing clients",
        "professional desk scene with inheritance folders, keys, and property documents"
      ],
    },
  },
  {
    keywords: ["litisconsorcio", "pluralidade de partes"],
    contexto: {
      cena: "Photorealistic courtroom scene representing joint litigation (multiple parties on one side)",
      elementos:
        "3-4 clients seated together with one lawyer at the same table, multiple case folders, unified posture, Brazilian courtroom setting, dramatic but realistic lighting",
      atmosfera: "solidarity, coordinated strategy, strength in numbers",
      variacoes: [
        "multiple plaintiffs signing a joint petition with a lawyer",
        "group of defendants in court with shared defense lawyer",
        "judge addressing multiple parties simultaneously",
        "lawyers conferring with multiple clients at a long table",
        "court hearing with both sides, one side has multiple aligned parties"
      ],
    },
  },
  {
    keywords: ["tutela", "liminar", "urgencia", "cautelar"],
    contexto: {
      cena: "Photorealistic urgent court hearing, immediate protective judicial order",
      elementos:
        "judge signing an urgent order, time pressure cues (clock), lawyer holding emergency documents, Brazilian courtroom, intense realistic lighting, no readable text",
      atmosfera: "urgency, protection, decisive action",
      variacoes: [
        "late-night courthouse office, urgent hearing atmosphere",
        "judge signing emergency order while lawyer waits",
        "lawyer rushing with documents to an urgent hearing",
        "protective order moment in court, dramatic lighting",
        "close-up of gavel and sealed folder implying immediate decision"
      ],
    },
  },
];

function pickContexto(titulo: string): ContextoVisual | null {
  const n = normalizeText(titulo);
  for (const entry of MAPA_TEMAS) {
    if (entry.keywords.some((k) => n.includes(normalizeText(k)))) return entry.contexto;
  }
  return null;
}

function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const k1 = Deno.env.get("GEMINI_KEY_1");
  const k2 = Deno.env.get("GEMINI_KEY_2");
  const k3 = Deno.env.get("GEMINI_KEY_3");
  const kPremium = Deno.env.get("DIREITO_PREMIUM_API_KEY");
  if (k1) keys.push(k1);
  if (k2) keys.push(k2);
  if (k3) keys.push(k3);
  if (kPremium) keys.push(kPremium);
  return keys;
}

async function generateImageBase64(prompt: string): Promise<string | null> {
  const keys = getGeminiKeys();
  if (keys.length === 0) throw new Error("Nenhuma chave Gemini configurada");

  const modelName = "gemini-2.5-flash-image";
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          }),
        }
      );

      if (resp.status === 429 || resp.status === 503) continue;
      if (!resp.ok) {
        const t = await resp.text();
        console.error(
          `[Capa Aprovacao] Erro Gemini chave ${i + 1}/${keys.length}: ${resp.status} ${t.substring(0, 200)}`
        );
        continue;
      }

      const data = await resp.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) return part.inlineData.data as string;
      }
    } catch (e) {
      console.error(`[Capa Aprovacao] Exceção Gemini chave ${i + 1}/${keys.length}:`, e);
      continue;
    }
  }

  return null;
}

async function compressWithTinyPNG(base64Data: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const TINYPNG_API_KEY = Deno.env.get("TINYPNG_API_KEY");

  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  const originalBuffer = bytes.buffer;

  if (!TINYPNG_API_KEY) {
    console.log("[Capa Aprovacao] TinyPNG não configurado, retornando PNG original");
    return { buffer: originalBuffer, contentType: "image/png" };
  }

  try {
    const shrink = await fetch("https://api.tinify.com/shrink", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${TINYPNG_API_KEY}`)}`,
        "Content-Type": "image/png",
      },
      body: originalBuffer,
    });

    if (!shrink.ok) {
      console.error("[Capa Aprovacao] Erro TinyPNG shrink:", shrink.status);
      return { buffer: originalBuffer, contentType: "image/png" };
    }

    const result = await shrink.json();

    // WebP 16:9 1280x720
    const webp = await fetch(result.output.url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${TINYPNG_API_KEY}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        convert: { type: "image/webp" },
        resize: { method: "cover", width: 1280, height: 720 },
      }),
    });

    if (webp.ok) {
      return { buffer: await webp.arrayBuffer(), contentType: "image/webp" };
    }

    const png = await fetch(result.output.url);
    return { buffer: await png.arrayBuffer(), contentType: "image/png" };
  } catch (e) {
    console.error("[Capa Aprovacao] Erro TinyPNG:", e);
    return { buffer: originalBuffer, contentType: "image/png" };
  }
}

function buildPrompt(params: { titulo: string; area?: string }): string {
  const titulo = params.titulo;
  const area = params.area || "Direito";
  const contexto = pickContexto(titulo);
  const variacao = contexto
    ? contexto.variacoes[Math.floor(Math.random() * contexto.variacoes.length)]
    : null;

  // Prompt: realista/impactante, sem texto
  return `CRITICAL: ABSOLUTELY NO TEXT OR LETTERS OR NUMBERS.

Create an ULTRA-DETAILED PHOTOREALISTIC cinematic image in 16:9 landscape, premium movie-poster lighting.

THEME: Brazilian legal studies, ${area}.
TOPIC: ${titulo}.

SCENE (photorealistic):
${variacao || `A realistic Brazilian legal environment illustrating the concept of "${titulo}" with professional atmosphere.`}

SCENE ELEMENTS:
${contexto?.elementos || "Brazilian courtroom or notary office environment, lawyers, documents, folders, subtle legal symbols (scales of justice), realistic textures"}

ATMOSPHERE:
${contexto?.atmosfera || "serious, premium, impactful, confident, cinematic"}

STYLE:
- photorealistic, sharp focus, high dynamic range
- dramatic but realistic lighting, high contrast
- rich details and textures, premium composition
- no faces close-up (avoid recognizable persons)

STRICT TEXT PROHIBITION:
- No readable text anywhere (documents, signs, screens must be blank or blurred)
- No logos, no watermarks, no typography`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { topico_id, titulo, area } = await req.json();
    if (!topico_id || !titulo) {
      return new Response(JSON.stringify({ error: "topico_id e titulo são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Cache por tópico: se já é v2, retorna
    const { data: existing } = await supabase
      .from("oab_trilhas_topicos")
      .select("capa_url, capa_versao")
      .eq("id", topico_id)
      .maybeSingle();

    if (existing?.capa_url && existing?.capa_versao === 2) {
      return new Response(JSON.stringify({ success: true, cached: true, capa_url: existing.capa_url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Capa Aprovacao] Gerando capa v2 para topico=${topico_id} titulo="${titulo}" area="${area}"`);

    const prompt = buildPrompt({ titulo, area });
    const base64 = await generateImageBase64(prompt);
    if (!base64) {
      return new Response(JSON.stringify({ success: false, error: "Falha ao gerar imagem" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { buffer, contentType } = await compressWithTinyPNG(base64);
    const extension = contentType === "image/webp" ? "webp" : "png";

    const fileName = `oab-trilhas/aprovacao-topicos/${topico_id}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("imagens").upload(fileName, buffer, {
      contentType,
      upsert: true,
    });
    if (uploadError) throw new Error(`Erro upload: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from("imagens").getPublicUrl(fileName);
    const capaUrl = urlData?.publicUrl;
    if (!capaUrl) throw new Error("Não foi possível obter URL pública da capa");

    const { error: updateError } = await supabase
      .from("oab_trilhas_topicos")
      .update({ capa_url: capaUrl, capa_versao: 2 })
      .eq("id", topico_id);
    if (updateError) throw new Error(`Erro ao atualizar tópico: ${updateError.message}`);

    console.log(`[Capa Aprovacao] ✅ Capa v2 salva: ${capaUrl}`);

    return new Response(JSON.stringify({ success: true, capa_url: capaUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Capa Aprovacao] Erro:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
