import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Modelos de imagem disponíveis (ordem de prioridade)
const MODELOS_IMAGEM = [
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-preview-image-generation'
];

// Gerar imagem com Gemini - suporta múltiplos modelos
async function gerarImagemComGemini(prompt: string, apiKey: string, modelo: string): Promise<{ success: boolean; data?: string; error?: string; isQuotaError?: boolean; isNotFoundError?: boolean }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[gerar-capa-estudos] Erro na API Gemini (${modelo}): ${response.status}`, errorText.substring(0, 200));
      const isQuotaError = response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED');
      const isInvalidKey = response.status === 400 && errorText.includes('API_KEY_INVALID');
      const isNotFoundError = response.status === 404;
      return { 
        success: false, 
        error: `GEMINI_ERROR_${response.status}: ${errorText.substring(0, 200)}`,
        isQuotaError: isQuotaError || isInvalidKey,
        isNotFoundError
      };
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.data);
    
    if (!imagePart?.inlineData?.data) {
      return { success: false, error: 'Imagem não gerada pela IA', isQuotaError: false, isNotFoundError: false };
    }
    
    return { success: true, data: imagePart.inlineData.data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      isQuotaError: false,
      isNotFoundError: false
    };
  }
}

// Função com fallback multi-modelo e multi-chave
async function gerarImagemComFallback(prompt: string, apiKeys: string[]): Promise<string> {
  const keysValidas = apiKeys.filter(k => k && k.trim().length > 0);
  
  console.log(`[gerar-capa-estudos] ${keysValidas.length} chave(s) Gemini, ${MODELOS_IMAGEM.length} modelos disponíveis`);
  
  let lastError = '';
  
  // Para cada modelo
  for (const modelo of MODELOS_IMAGEM) {
    console.log(`[gerar-capa-estudos] 🎨 Tentando modelo: ${modelo}`);
    let modeloFalhouPor404 = false;
    
    // Para cada chave
    for (let i = 0; i < keysValidas.length; i++) {
      console.log(`[gerar-capa-estudos] Tentando GEMINI_KEY_${i + 1} com ${modelo}...`);
      
      const result = await gerarImagemComGemini(prompt, keysValidas[i], modelo);
      
      if (result.success && result.data) {
        console.log(`[gerar-capa-estudos] ✅ Sucesso com GEMINI_KEY_${i + 1} no modelo ${modelo}`);
        return result.data;
      }
      
      lastError = result.error || 'Erro desconhecido';
      console.log(`[gerar-capa-estudos] ❌ GEMINI_KEY_${i + 1} falhou: ${lastError.substring(0, 150)}`);
      
      // Se modelo não existe (404), pular para próximo modelo
      if (result.isNotFoundError) {
        console.log(`[gerar-capa-estudos] Modelo ${modelo} não disponível, tentando próximo...`);
        modeloFalhouPor404 = true;
        break;
      }
      
      // Se erro de cota, continuar para próxima chave
      if (result.isQuotaError) {
        continue;
      }
    }
    
    if (!modeloFalhouPor404) {
      console.log(`[gerar-capa-estudos] ⚠️ Todas as chaves falharam no modelo ${modelo}, tentando próximo modelo...`);
    }
  }
  
  throw new Error(`Todas as ${keysValidas.length} chaves falharam em todos os ${MODELOS_IMAGEM.length} modelos. Último erro: ${lastError}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[gerar-capa-estudos] Iniciando geração de capa de Estudos...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Coletar as chaves GEMINI_KEY disponíveis
    const apiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];

    console.log(`[gerar-capa-estudos] ${apiKeys.length} chaves GEMINI_KEY disponíveis`);

    // Prompt para a capa de estudos
    const prompt = `Create a photorealistic image of a university law school classroom scene for a book cover.

SCENE REQUIREMENTS:
- A distinguished male professor in his 50s wearing a formal dark suit is teaching
- He is pointing at a green chalkboard while explaining
- On the chalkboard there must be CLEARLY VISIBLE:
  1. KELSEN'S PYRAMID (Pirâmide de Kelsen) - a hierarchical triangle diagram showing legal hierarchy with "Constituição" at the top, then "Leis Complementares", then "Leis Ordinárias", then "Decretos", then "Normas" at the base
  2. SCALES OF JUSTICE (Balança da Justiça) - the classic symbol with two balanced scales
- Young diverse law students aged 19-23 years old (mix of male and female) sitting at traditional wooden desks
- Students are taking notes attentively and paying attention
- Warm golden academic lighting
- Traditional lecture hall with wooden wall panels
- Law books visible on shelves in background
- Educational and professional atmosphere

STYLE: 8K photorealistic, cinematic lighting, portrait orientation 2:3 aspect ratio suitable for book cover.

⛔ FORBIDDEN: Blurry text, illegible drawings, modern classroom, plastic furniture.`;

    console.log("[gerar-capa-estudos] Gerando imagem com Gemini...");

    // Gerar imagem com fallback
    const imageBase64 = await gerarImagemComFallback(prompt, apiKeys);

    // Converter base64 para Uint8Array
    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`[gerar-capa-estudos] Imagem gerada, tamanho: ${bytes.length} bytes`);

    // Upload para Supabase Storage (bucket 'imagens' já existe)
    const fileName = `bibliotecas/capa-estudos-${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from("imagens")
      .upload(fileName, bytes, {
        contentType: "image/png",
        upsert: true
      });

    if (uploadError) {
      console.error("[gerar-capa-estudos] Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("imagens")
      .getPublicUrl(fileName);

    console.log("[gerar-capa-estudos] ✅ Imagem uploaded:", publicUrlData.publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrlData.publicUrl
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[gerar-capa-estudos] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
