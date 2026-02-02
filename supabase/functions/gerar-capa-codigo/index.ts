import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de códigos para nomes completos
const CODIGOS_NOMES: Record<string, string> = {
  'CP': 'Código Penal',
  'CC': 'Código Civil',
  'CF': 'Constituição Federal',
  'CDC': 'Código de Defesa do Consumidor',
  'CLT': 'Consolidação das Leis do Trabalho',
  'CPP': 'Código de Processo Penal',
  'CPC': 'Código de Processo Civil',
  'ECA': 'Estatuto da Criança e do Adolescente',
  'CTN': 'Código Tributário Nacional',
  'CTB': 'Código de Trânsito Brasileiro',
  'LEP': 'Lei de Execução Penal',
  'LCP': 'Lei das Contravenções Penais',
};

// Cores temáticas para cada código
const CODIGOS_CORES: Record<string, string> = {
  'CP': 'deep crimson red and dark burgundy',
  'CC': 'royal blue and navy',
  'CF': 'gold and forest green',
  'CDC': 'teal and emerald',
  'CLT': 'amber and brown',
  'CPP': 'dark red and charcoal',
  'CPC': 'sapphire blue and slate',
  'ECA': 'purple and lavender',
  'CTN': 'olive green and bronze',
  'CTB': 'orange and gray',
  'LEP': 'dark gray and maroon',
  'LCP': 'burgundy and cream',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codigo_tabela, force_regenerate } = await req.json();

    if (!codigo_tabela) {
      return new Response(
        JSON.stringify({ error: "codigo_tabela é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalizar código
    const codigoNorm = codigo_tabela.toUpperCase().split(' ')[0].split('-')[0].trim();
    const codigoNome = CODIGOS_NOMES[codigoNorm] || codigo_tabela;
    const cores = CODIGOS_CORES[codigoNorm] || 'deep navy and burgundy';

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[Capa Código] Verificando capa para: ${codigoNorm} (${codigoNome})`);

    // Verificar se já existe capa para este código
    if (!force_regenerate) {
      const { data: existingCapa } = await supabase
        .from('codigos_capas')
        .select('capa_url')
        .eq('codigo_tabela', codigoNorm)
        .single();

      if (existingCapa?.capa_url) {
        console.log(`[Capa Código] ✓ Capa já existe: ${existingCapa.capa_url}`);
        return new Response(
          JSON.stringify({ success: true, capa_url: existingCapa.capa_url, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`[Capa Código] Gerando nova capa para ${codigoNorm}...`);

    // Gerar prompt para a imagem
    const imagePrompt = `CINEMATIC 16:9 horizontal illustration, EDGE-TO-EDGE composition with NO white borders or margins.
Dark rich background covering the entire frame in ${cores} tones.
Brazilian legal education theme representing "${codigoNome}" (${codigoNorm}).
Elements: scales of justice, law books, legal gavels, abstract geometric patterns representing law and order.
Professional, sophisticated, authoritative mood for legal education.
Modern minimal style with dramatic lighting and rich textures.
NO TEXT, NO WORDS, NO LETTERS, NO PEOPLE FACES, NO CHARACTERS.
Ultra high resolution, vibrant contrast, cinematic lighting.`;

    // Fallback URLs para cada código (usar imediatamente se a geração falhar)
    const fallbackUrls: Record<string, string> = {
      'CP': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1280&h=720&fit=crop&q=80',
      'CC': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1280&h=720&fit=crop&q=80',
      'CF': 'https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=1280&h=720&fit=crop&q=80',
      'CDC': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1280&h=720&fit=crop&q=80',
      'CLT': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1280&h=720&fit=crop&q=80',
      'CPP': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1280&h=720&fit=crop&q=80',
      'CPC': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1280&h=720&fit=crop&q=80',
      'ECA': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1280&h=720&fit=crop&q=80',
      'CTN': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1280&h=720&fit=crop&q=80',
      'CTB': 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1280&h=720&fit=crop&q=80',
      'LEP': 'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=1280&h=720&fit=crop&q=80',
      'LCP': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1280&h=720&fit=crop&q=80',
    };

    let capaUrl: string | null = null;

    // Tentar chamar a edge function de geração de imagem
    try {
      const { data: imageData, error: imageError } = await supabase.functions.invoke("gerar-imagem-hf", {
        body: { prompt: imagePrompt }
      });

      if (imageError) {
        console.error("[Capa Código] Erro ao gerar imagem, usando fallback:", imageError.message);
      } else if (imageData?.image) {
        // Converter base64 para upload no storage
        const base64Data = imageData.image.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload para o storage
        const fileName = `codigos-capas/${codigoNorm}-${Date.now()}.webp`;
        
        const { error: uploadError } = await supabase.storage
          .from("imagens")
          .upload(fileName, imageBuffer, {
            contentType: "image/webp",
            upsert: true
          });

        if (uploadError) {
          console.error("[Capa Código] Erro no upload, usando fallback:", uploadError);
        } else {
          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from("imagens")
            .getPublicUrl(fileName);
          capaUrl = urlData?.publicUrl;
        }
      }
    } catch (genError: any) {
      console.error("[Capa Código] Exceção ao gerar imagem, usando fallback:", genError.message);
    }

    // Se não conseguiu gerar, usar fallback
    if (!capaUrl) {
      console.log("[Capa Código] Usando imagem fallback do Unsplash");
      capaUrl = fallbackUrls[codigoNorm] || fallbackUrls['CP'];
    }

    // Salvar na tabela codigos_capas
    const { error: upsertError } = await supabase
      .from('codigos_capas')
      .upsert({
        codigo_tabela: codigoNorm,
        codigo_nome: codigoNome,
        capa_url: capaUrl,
        updated_at: new Date().toISOString()
      }, { onConflict: 'codigo_tabela' });

    if (upsertError) {
      console.error("[Capa Código] Erro ao salvar:", upsertError);
      // Não lançar erro, a imagem foi gerada com sucesso
    }

    console.log(`[Capa Código] ✓ Capa gerada e salva: ${capaUrl}`);

    return new Response(
      JSON.stringify({ success: true, capa_url: capaUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[Capa Código] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
