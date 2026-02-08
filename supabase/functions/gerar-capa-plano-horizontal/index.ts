import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROMPTS: Record<string, string> = {
  mensal: "Professional legal scene in horizontal 16:9 format, young ambitious law student in modern law office, warm amber lighting, elegant wooden desk with legal books, confident posture, cinematic composition, ultra realistic, 8K quality, warm golden tones",
  anual: "Professional legal scene in horizontal 16:9 format, experienced lawyer in sophisticated law firm, amber and gold ambient lighting, impressive legal library background, confident stance, cinematic wide shot, ultra realistic, 8K quality, warm golden tones",
  vitalicio: "Professional legal scene in horizontal 16:9 format, distinguished senior judge or senior partner in prestigious courtroom or law chamber, dramatic amber lighting, majestic wooden interior, powerful presence, cinematic masterpiece, ultra realistic, 8K quality, warm golden tones",
};

// Configurações de API para fallback
const API_CONFIGS = [
  {
    name: "Lovable Gateway",
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    keyEnv: "LOVABLE_API_KEY",
    model: "google/gemini-2.5-flash-image-preview",
  },
  {
    name: "Gemini 1",
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
    keyEnv: "GEMINI_KEY_1",
    isGeminiDirect: true,
  },
  {
    name: "Gemini 2",
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
    keyEnv: "GEMINI_KEY_2",
    isGeminiDirect: true,
  },
  {
    name: "Gemini 3",
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
    keyEnv: "GEMINI_KEY_3",
    isGeminiDirect: true,
  },
];

async function generateWithLovableGateway(apiKey: string, prompt: string): Promise<string | null> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    console.error(`Lovable Gateway error: ${response.status}`);
    return null;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
}

async function generateWithGeminiDirect(apiKey: string, prompt: string): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["image", "text"],
        responseMimeType: "image/png",
      },
    }),
  });

  if (!response.ok) {
    console.error(`Gemini Direct error: ${response.status}`);
    return null;
  }

  const data = await response.json();
  const imageData = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;
  
  if (imageData?.data) {
    return `data:${imageData.mimeType || 'image/png'};base64,${imageData.data}`;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plano, label } = await req.json();
    
    if (!plano || !PROMPTS[plano]) {
      return new Response(
        JSON.stringify({ error: "Plano inválido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Gerando capa horizontal para plano: ${plano}`);
    const prompt = PROMPTS[plano];
    let imageUrl: string | null = null;

    // Tentar Lovable Gateway primeiro
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (lovableKey) {
      console.log("Tentando Lovable Gateway...");
      imageUrl = await generateWithLovableGateway(lovableKey, prompt);
      if (imageUrl) {
        console.log("Sucesso com Lovable Gateway");
      }
    }

    // Fallback para Gemini keys
    if (!imageUrl) {
      const geminiKeys = [
        Deno.env.get("GEMINI_KEY_1"),
        Deno.env.get("GEMINI_KEY_2"),
        Deno.env.get("GEMINI_KEY_3"),
      ].filter(Boolean);

      for (const key of geminiKeys) {
        console.log("Tentando Gemini Direct...");
        imageUrl = await generateWithGeminiDirect(key!, prompt);
        if (imageUrl) {
          console.log("Sucesso com Gemini Direct");
          break;
        }
      }
    }

    if (!imageUrl) {
      console.error("Todas as APIs falharam");
      return new Response(
        JSON.stringify({ error: "Erro ao gerar imagem", imageUrl: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Capa horizontal gerada com sucesso para: ${plano}`);

    return new Response(
      JSON.stringify({ imageUrl, plano }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, imageUrl: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
