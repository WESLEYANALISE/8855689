import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REVISION = "v1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`🚀 [atualizar-lei-push ${REVISION}] Iniciando...`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leiId } = await req.json();
    
    if (!leiId) {
      return new Response(
        JSON.stringify({ success: false, error: "ID da lei é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar a lei existente
    const { data: lei, error: leiError } = await supabase
      .from('leis_push_2025')
      .select('id, numero_lei, url_planalto, ementa')
      .eq('id', leiId)
      .single();

    if (leiError || !lei) {
      console.error('❌ Lei não encontrada:', leiError);
      return new Response(
        JSON.stringify({ success: false, error: "Lei não encontrada" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📜 Atualizando: ${lei.numero_lei}`);
    console.log(`🔗 URL: ${lei.url_planalto}`);

    if (!lei.url_planalto) {
      return new Response(
        JSON.stringify({ success: false, error: "Lei não possui URL do Planalto" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Chamar raspar-planalto-browserless para obter dados atualizados
    const { data: raspData, error: raspError } = await supabase.functions.invoke('raspar-planalto-browserless', {
      body: { urlPlanalto: lei.url_planalto }
    });

    if (raspError || !raspData?.success) {
      console.error('❌ Erro ao raspar:', raspError || raspData?.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: raspData?.error || raspError?.message || "Erro ao raspar lei do Planalto"
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Raspagem OK: ${raspData.artigos?.length || 0} artigos`);

    // Montar texto formatado a partir dos artigos
    let textoFormatado = '';
    if (raspData.artigos && raspData.artigos.length > 0) {
      textoFormatado = raspData.artigos
        .map((art: { texto: string }) => art.texto)
        .join('\n\n');
    }

    // Atualizar a lei no banco
    const { error: updateError } = await supabase
      .from('leis_push_2025')
      .update({
        artigos: raspData.artigos || [],
        texto_formatado: textoFormatado,
        updated_at: new Date().toISOString()
      })
      .eq('id', leiId);

    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao atualizar lei no banco" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Lei atualizada com sucesso!`);

    return new Response(
      JSON.stringify({ 
        success: true,
        revisao: REVISION,
        numeroLei: lei.numero_lei,
        totalArtigos: raspData.artigos?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Erro geral: ${errorMessage}`);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
