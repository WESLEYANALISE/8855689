import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type TipoImagem = 'hero' | 'mensal' | 'trimestral' | 'vitalicio';

const PROMPTS: Record<TipoImagem, string> = {
  hero: `PHOTOREALISTIC 8K CINEMATIC wide shot photograph:
Five Brazilian legal professionals (judges in black robes, prosecutors, lawyers in suits) walking TOGETHER from BEHIND through a grand courthouse marble hallway. They walk AWAY from camera towards bright golden light at the end of the corridor.
Style: Like a powerful movie poster. Dramatic morning light streaming through tall windows. Polished marble floors reflecting their silhouettes. Power, unity, determination.
Aspect ratio 16:9. Ultra high resolution. NO text, NO watermarks, NO logos.`,

  mensal: `PHOTOREALISTIC cinematic full body portrait photograph:
Young ambitious Brazilian female lawyer standing confidently in modern law office.
She wears an elegant dark navy tailored suit, holding a leather briefcase.
FULL BODY visible from head to knees, standing pose, slight side angle.
Background: contemporary glass office with city skyline view, soft bokeh.
Professional studio lighting, warm golden hour tones. Fresh, ambitious energy.
Portrait aspect ratio 3:4. Ultra high resolution. NO text, NO watermarks.`,

  trimestral: `PHOTOREALISTIC cinematic full body portrait photograph:
Established successful Brazilian male lawyer in his prime standing with authority.
He wears a premium charcoal three-piece suit with subtle gold cufflinks and tie pin.
FULL BODY visible from head to knees, powerful stance, facing slightly left.
Background: luxurious law firm library with mahogany shelves, leather chairs.
Dramatic lighting emphasizing success and expertise. Confident, commanding presence.
Portrait aspect ratio 3:4. Ultra high resolution. NO text, NO watermarks.`,

  vitalicio: `PHOTOREALISTIC cinematic full body portrait photograph:
Distinguished senior Brazilian judge or legal master, the pinnacle of legal excellence.
Wearing formal black judicial robe with elegant details, standing with gravitas.
FULL BODY visible from head to knees, dignified pose, slight profile view.
Background: grand Supreme Court marble hall with classical columns, Brazilian flag.
Golden hour lighting emphasizing wisdom, lifetime achievement, and legacy.
Portrait aspect ratio 3:4. Ultra high resolution. NO text, NO watermarks.`
};

// Gerar imagem usando Lovable Gateway com modelos suportados
async function gerarImagemComLovableGateway(prompt: string, tipo: TipoImagem): Promise<string | null> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!apiKey) {
    console.log('⏭️ LOVABLE_API_KEY não configurada');
    return null;
  }

  // Modelos de imagem suportados pelo Lovable Gateway
  const modelsToTry = [
    'google/gemini-2.5-flash-image',
    'google/gemini-3-pro-image-preview'
  ];

  for (const model of modelsToTry) {
    try {
      console.log(`🔄 Tentando ${model} para ${tipo}...`);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${model} erro ${response.status}:`, errorText.substring(0, 300));
        continue;
      }

      const data = await response.json();
      
      // Tentar extrair imagem de diferentes formatos de resposta
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const imageB64 = data.choices?.[0]?.message?.images?.[0]?.b64_json;
      
      if (imageUrl) {
        console.log(`✅ ${model} gerou imagem para ${tipo} com sucesso!`);
        // Se já é base64, retorna diretamente
        if (imageUrl.startsWith('data:')) {
          return imageUrl;
        }
        // Se é URL, baixar e converter
        const imgResponse = await fetch(imageUrl);
        const imgBuffer = await imgResponse.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
        return `data:image/png;base64,${base64}`;
      }
      
      if (imageB64) {
        console.log(`✅ ${model} gerou imagem para ${tipo} com sucesso!`);
        return `data:image/png;base64,${imageB64}`;
      }

      console.log(`⚠️ ${model} não retornou imagem no formato esperado`);
    } catch (error) {
      console.error(`❌ ${model} falhou:`, error);
    }
  }

  return null;
}

// Nome fixo para cada tipo - imagens permanentes
const NOMES_ARQUIVOS: Record<TipoImagem, string> = {
  hero: 'assinatura-hero-permanente.png',
  mensal: 'assinatura-mensal-permanente.png',
  trimestral: 'assinatura-trimestral-permanente.png',
  vitalicio: 'assinatura-vitalicio-permanente.png'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, forcarNova } = await req.json() as { tipo: TipoImagem; forcarNova?: boolean };

    if (!tipo || !PROMPTS[tipo]) {
      throw new Error('Tipo de imagem inválido');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const fileName = NOMES_ARQUIVOS[tipo];

    // Verificar se imagem já existe (a menos que forcarNova seja true)
    if (!forcarNova) {
      const { data: existingFile } = await supabase.storage
        .from('gerador-imagens')
        .list('', { search: fileName });

      if (existingFile && existingFile.length > 0) {
        const { data: publicUrl } = supabase.storage
          .from('gerador-imagens')
          .getPublicUrl(fileName);

        console.log(`✅ Imagem ${tipo} já existe, retornando cache:`, publicUrl.publicUrl);
        return new Response(
          JSON.stringify({ success: true, imageUrl: publicUrl.publicUrl, tipo, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Gerar nova imagem
    const prompt = PROMPTS[tipo];
    console.log(`📸 Gerando nova imagem: ${tipo}`);

    const imageBase64 = await gerarImagemComLovableGateway(prompt, tipo);

    if (!imageBase64) {
      throw new Error('Falha ao gerar imagem com todas as opções disponíveis');
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from('gerador-imagens')
      .upload(fileName, binaryData, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('⚠️ Upload falhou, retornando base64:', uploadError);
      return new Response(
        JSON.stringify({ success: true, imageUrl: imageBase64, tipo }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: publicUrl } = supabase.storage
      .from('gerador-imagens')
      .getPublicUrl(fileName);

    console.log(`✅ Nova imagem ${tipo} salva:`, publicUrl.publicUrl);

    return new Response(
      JSON.stringify({ success: true, imageUrl: publicUrl.publicUrl, tipo, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
