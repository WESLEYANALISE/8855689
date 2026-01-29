import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const { prompt: customPrompt } = await req.json();

    const prompt = customPrompt || `Create a stunning vertical hero image (9:16 aspect ratio) representing Brazilian democracy and law:

The iconic Palácio do Planalto (Presidential Palace) in Brasília, Brazil at golden hour with dramatic lighting. In the foreground, an elegant open book representing the Brazilian Federal Constitution with visible ornate text. The sky should have warm golden and orange tones with some clouds. The architectural modernist style of the Planalto palace should be clearly visible. Professional photography style, cinematic lighting, ultra high resolution, photorealistic. The overall mood should convey justice, democracy and governmental authority.`;

    console.log('Gerando imagem com Nano Banana...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', errorText);
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    console.log('Resposta recebida:', JSON.stringify(data).substring(0, 200));

    const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      throw new Error('Nenhuma imagem gerada');
    }

    // Upload para Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Converter base64 para blob
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const fileName = `planalto-constituicao-${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('gerador-imagens')
      .upload(fileName, binaryData, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      // Retorna a imagem base64 se o upload falhar
      return new Response(
        JSON.stringify({ 
          success: true, 
          image_base64: imageBase64,
          message: 'Imagem gerada (base64)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: publicUrl } = supabase.storage
      .from('gerador-imagens')
      .getPublicUrl(fileName);

    console.log('Imagem salva:', publicUrl.publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrl.publicUrl,
        message: 'Imagem gerada e salva com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
