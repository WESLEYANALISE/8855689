import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de temas visuais para títulos de capítulos jurídicos
function gerarPromptCapaTemático(capituloTitulo: string, livroTitulo: string): string {
  const tituloLower = capituloTitulo.toLowerCase();
  
  // Mapear tema visual baseado no título do capítulo
  let temaVisual = '';
  let atmosfera = 'dramatic courtroom with classical architecture';
  
  if (tituloLower.includes('apresentação') || tituloLower.includes('introdução') || tituloLower.includes('prefácio')) {
    temaVisual = 'An ancient leather-bound book opening with golden light emanating from its pages, scales of justice visible in the warm glow, dusty law library atmosphere';
    atmosfera = 'warm golden light, scholarly atmosphere';
  } else if (tituloLower.includes('fatos') || tituloLower.includes('caso')) {
    temaVisual = 'Dark cave entrance with faint light from rescue lamps, silhouettes of rescuers approaching, dramatic shadows on rocky walls';
    atmosfera = 'suspenseful, dark with highlights of hope';
  } else if (tituloLower.includes('julgamento') || tituloLower.includes('tribunal') || tituloLower.includes('suprema corte')) {
    temaVisual = 'Majestic supreme court interior with marble columns, judges in robes seated at elevated bench, dramatic overhead lighting through dome';
    atmosfera = 'solemn, powerful, institutional grandeur';
  } else if (tituloLower.includes('voto') && tituloLower.includes('truepenny')) {
    temaVisual = 'Distinguished elderly judge at ornate wooden bench, quill pen in hand, heavy law books surrounding him, expression of measured wisdom';
    atmosfera = 'traditional, authoritative, contemplative';
  } else if (tituloLower.includes('voto') && tituloLower.includes('foster')) {
    temaVisual = 'Dynamic courtroom scene with passionate advocate gesturing emphatically, jury watching intently, scales of justice prominent';
    atmosfera = 'energetic, persuasive, enlightened';
  } else if (tituloLower.includes('voto') && tituloLower.includes('tatting')) {
    temaVisual = 'Judge in chamber wrestling with documents, conflicted expression, window showing stormy sky, classical statues of justice in background';
    atmosfera = 'internal conflict, philosophical struggle, moody';
  } else if (tituloLower.includes('voto') && tituloLower.includes('keen')) {
    temaVisual = 'Strict judge holding ancient law codex firmly, stern expression, stark lighting emphasizing rigid posture, legal texts surrounding';
    atmosfera = 'rigid, principled, uncompromising';
  } else if (tituloLower.includes('voto') && tituloLower.includes('handy')) {
    temaVisual = 'Modern-thinking judge looking through window at common people outside courthouse, human connection emphasized, softer lighting';
    atmosfera = 'pragmatic, humanistic, accessible';
  } else if (tituloLower.includes('conclusão') || tituloLower.includes('decisão') || tituloLower.includes('sentença')) {
    temaVisual = 'Gavel striking sound block with dramatic motion blur, scales of justice perfectly balanced, spotlight on the moment of decision';
    atmosfera = 'climactic, definitive, consequential';
  } else if (tituloLower.includes('pós-escrito') || tituloLower.includes('epílogo') || tituloLower.includes('posfácio')) {
    temaVisual = 'Empty courtroom at dusk, sunlight streaming through tall windows, dust motes floating, sense of aftermath and reflection';
    atmosfera = 'reflective, peaceful, contemplative';
  } else {
    // Tema genérico para outros capítulos
    temaVisual = `Scene representing "${capituloTitulo}" - classical legal setting with dramatic lighting, books of law, scales of justice`;
    atmosfera = 'professional, scholarly, legal atmosphere';
  }

  return `Create a photorealistic 16:9 cinematic image for the chapter "${capituloTitulo}" from the legal classic "${livroTitulo}".

SCENE DESCRIPTION:
${temaVisual}

ATMOSPHERE: ${atmosfera}

CRITICAL TECHNICAL REQUIREMENTS:
- Fill the ENTIRE 16:9 frame edge-to-edge with the scene
- ABSOLUTELY NO letterboxing, black bars, white bars, or borders of ANY kind
- The image must extend fully to ALL four edges
- NO text, NO titles, NO watermarks, NO captions
- Ultra high resolution, photorealistic quality
- Dramatic chiaroscuro lighting with rich shadows
- Professional cinematographic composition (rule of thirds)
- Depth of field with sharp focus on subject

The image should evoke the emotional and thematic essence of this chapter.`;
}

// Gerar capa com Gemini 2.5 Flash Preview Image via Lovable Gateway
async function gerarCapaCapitulo(capituloTitulo: string, livroTitulo: string, supabase: any): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.warn('[CAPA] LOVABLE_API_KEY não configurada');
    return null;
  }

  try {
    const prompt = gerarPromptCapaTemático(capituloTitulo, livroTitulo);
    console.log(`[CAPA] Gerando capa temática para: ${capituloTitulo}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CAPA] Erro na API: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData || !imageData.startsWith('data:image')) {
      console.warn('[CAPA] Resposta sem imagem válida');
      return null;
    }

    // Converter base64 para Uint8Array
    const base64Data = imageData.split(',')[1];
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Nome único baseado no título do capítulo
    const slugLivro = livroTitulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
    const slugCap = capituloTitulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
    const fileName = `leitura-capas/${slugLivro}/${slugCap}-${Date.now()}.webp`;

    // Upload para Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('gerador-imagens')
      .upload(fileName, imageBytes, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      console.error('[CAPA] Erro no upload:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('gerador-imagens')
      .getPublicUrl(fileName);

    console.log(`[CAPA] ✓ Capa gerada: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('[CAPA] Erro ao gerar capa:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const livroTitulo = body.livroTitulo || body.tituloLivro;
    
    if (!livroTitulo) {
      return new Response(
        JSON.stringify({ error: 'livroTitulo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`\n========================================`);
    console.log(`[REGENERAR CAPAS] Iniciando para: ${livroTitulo}`);
    console.log(`========================================\n`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar todos os capítulos do livro (páginas com is_chapter_start = true)
    const { data: capitulos, error: errorCap } = await supabase
      .from('leitura_paginas_formatadas')
      .select('id, numero_pagina, capitulo_titulo, url_capa_capitulo')
      .ilike('livro_titulo', `%${livroTitulo}%`)
      .eq('is_chapter_start', true)
      .order('numero_pagina', { ascending: true });

    if (errorCap || !capitulos?.length) {
      console.error('[ERRO] Sem capítulos encontrados:', errorCap);
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum capítulo encontrado para este livro' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[INFO] ${capitulos.length} capítulos encontrados`);

    // Para cada capítulo: deletar capa antiga e gerar nova
    const resultados: Array<{ capitulo: string; sucesso: boolean; url?: string }> = [];
    
    for (const cap of capitulos) {
      console.log(`\n------------------------------------------`);
      console.log(`[PROCESSANDO] ${cap.capitulo_titulo}`);
      
      // Deletar capa antiga do Storage se existir
      if (cap.url_capa_capitulo) {
        try {
          // Extrair path do arquivo da URL
          const urlParts = cap.url_capa_capitulo.split('/storage/v1/object/public/');
          if (urlParts[1]) {
            const [bucket, ...pathParts] = urlParts[1].split('/');
            const filePath = pathParts.join('/');
            
            console.log(`[DELETAR] Removendo capa antiga: ${filePath}`);
            const { error: deleteError } = await supabase.storage
              .from(bucket)
              .remove([filePath]);
            
            if (deleteError) {
              console.warn(`[DELETAR] Aviso ao deletar:`, deleteError.message);
            } else {
              console.log(`[DELETAR] ✓ Capa antiga removida`);
            }
          }
        } catch (e) {
          console.warn('[DELETAR] Não foi possível deletar capa antiga:', e);
        }
      }

      // Gerar nova capa temática
      const novaUrl = await gerarCapaCapitulo(cap.capitulo_titulo, livroTitulo, supabase);

      // Atualizar registro no banco
      if (novaUrl) {
        const { error: updateError } = await supabase
          .from('leitura_paginas_formatadas')
          .update({ url_capa_capitulo: novaUrl })
          .eq('id', cap.id);

        if (updateError) {
          console.error(`[ERRO] Falha ao atualizar URL:`, updateError);
          resultados.push({ capitulo: cap.capitulo_titulo, sucesso: false });
        } else {
          console.log(`[SALVO] ✓ Nova capa salva para ${cap.capitulo_titulo}`);
          resultados.push({ capitulo: cap.capitulo_titulo, sucesso: true, url: novaUrl });
        }
      } else {
        resultados.push({ capitulo: cap.capitulo_titulo, sucesso: false });
      }

      // Pausa entre gerações para evitar rate limit
      await new Promise(r => setTimeout(r, 2000));
    }

    const sucessos = resultados.filter(r => r.sucesso).length;
    const falhas = resultados.filter(r => !r.sucesso).length;

    console.log(`\n========================================`);
    console.log(`[CONCLUÍDO] Regeneração de capas para "${livroTitulo}"`);
    console.log(`  - ${sucessos} capas regeneradas com sucesso`);
    console.log(`  - ${falhas} falhas`);
    console.log(`========================================\n`);

    return new Response(
      JSON.stringify({
        success: true,
        totalCapitulos: capitulos.length,
        capasRegeneradas: sucessos,
        falhas,
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[ERRO GERAL]', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
