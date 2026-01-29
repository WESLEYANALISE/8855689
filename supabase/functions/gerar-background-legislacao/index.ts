import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prompts temáticos para cada tipo de página
const promptsPerPage: Record<string, string> = {
  legislacao: "A majestic vertical image of the Brazilian National Congress (Congresso Nacional) building in Brasília at twilight, with dramatic lighting. In the foreground, elegant stacks of legal law books and documents with a gavel. The Brazilian flag waves subtly. Ultra high resolution, cinematic quality, professional photography, vertical orientation 9:16 aspect ratio.",
  
  codigos: "A sophisticated vertical image of a grand legal library with tall mahogany bookshelves filled with ancient law books and codes. A golden scale of justice prominently displayed. Warm ambient lighting creating depth. Classical architecture with columns. Ultra high resolution, cinematic quality, vertical orientation 9:16 aspect ratio.",
  
  constituicao: "A powerful vertical image of the Brazilian Constitution book opened dramatically with golden light emanating from its pages. The book rests on a marble pedestal with the Brazilian coat of arms (Brasão da República) visible. Dramatic chiaroscuro lighting. Ultra high resolution, cinematic quality, vertical orientation 9:16 aspect ratio.",
  
  estatutos: "An elegant vertical image of a distinguished legal chamber with ornate wooden furniture. Multiple statute books arranged artistically. A judge's gavel on polished wood desk. Stained glass windows casting colored light. Classical legal atmosphere. Ultra high resolution, cinematic quality, vertical orientation 9:16 aspect ratio.",
  
  previdenciario: "A professional vertical image representing social security and labor law. Hands shaking over legal documents, with pension and benefit forms visible. Background shows a modern government building. Warm, trustworthy colors. Ultra high resolution, cinematic quality, vertical orientation 9:16 aspect ratio.",
  
  sumulas: "A formal vertical image of a Supreme Court chamber with the Brazilian STF seal visible. A judge's gavel striking decisively. Stacks of judicial precedent documents. Marble columns and wood paneling. Authoritative and prestigious atmosphere. Ultra high resolution, cinematic quality, vertical orientation 9:16 aspect ratio.",
  
  pec: "A dynamic vertical image of the Brazilian Congress in session, with legislators debating constitutional amendments. The distinctive architecture of the Chamber of Deputies visible. Documents and voting materials. Democratic process in action. Ultra high resolution, cinematic quality, vertical orientation 9:16 aspect ratio."
};

// Função para gerar imagem com Gemini via API REST (mesmas chaves da professora)
async function gerarImagemComGemini(prompt: string): Promise<string | null> {
  const API_KEYS = [
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
    Deno.env.get('GEMINI_KEY_3'),
    Deno.env.get('DIREITO_PREMIUM_API_KEY')
  ].filter(Boolean);
  
  console.log(`[gerar-background-legislacao] Tentando ${API_KEYS.length} chaves Gemini disponíveis`);
  
  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      console.log(`[gerar-background-legislacao] Tentando chave ${i + 1}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEYS[i]}`,
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
        console.log(`[gerar-background-legislacao] Chave ${i + 1} falhou: ${response.status} - ${errorText}`);
        continue;
      }
      
      const data = await response.json();
      
      for (const part of data.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          console.log(`[gerar-background-legislacao] Sucesso com chave ${i + 1}`);
          return part.inlineData.data;
        }
      }
    } catch (err) {
      console.log(`[gerar-background-legislacao] Chave ${i + 1} erro:`, err);
      continue;
    }
  }
  
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pageKey, action } = await req.json();
    
    if (!pageKey) {
      return new Response(
        JSON.stringify({ error: 'pageKey é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle delete action
    if (action === 'delete') {
      console.log(`[gerar-background-legislacao] Deletando background para: ${pageKey}`);
      
      const fileName = `background-${pageKey}.png`;
      const { error: deleteError } = await supabase.storage
        .from('backgrounds')
        .remove([fileName]);
      
      if (deleteError) {
        console.error('[gerar-background-legislacao] Erro ao deletar:', deleteError);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Background deletado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new background using Gemini
    const prompt = promptsPerPage[pageKey] || promptsPerPage['legislacao'];
    console.log(`[gerar-background-legislacao] Gerando imagem para: ${pageKey}`);
    console.log(`[gerar-background-legislacao] Prompt: ${prompt.substring(0, 100)}...`);

    const base64Image = await gerarImagemComGemini(prompt);
    
    if (!base64Image) {
      throw new Error('Nenhuma imagem gerada. Todas as chaves Gemini falharam.');
    }

    // Convert base64 to blob
    const binaryData = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const fileName = `background-${pageKey}.png`;
    
    // First try to delete existing file
    await supabase.storage.from('backgrounds').remove([fileName]);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('backgrounds')
      .upload(fileName, binaryData, {
        contentType: 'image/png',
        upsert: true,
        cacheControl: '31536000' // 1 year cache
      });

    if (uploadError) {
      console.error('[gerar-background-legislacao] Erro no upload:', uploadError);
      // Return base64 as fallback
      return new Response(
        JSON.stringify({ 
          success: true, 
          imageUrl: `data:image/png;base64,${base64Image}`,
          isBase64: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('backgrounds')
      .getPublicUrl(fileName);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    console.log(`[gerar-background-legislacao] Upload concluído: ${publicUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrl,
        isBase64: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[gerar-background-legislacao] Erro:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
