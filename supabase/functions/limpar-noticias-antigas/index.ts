import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 Iniciando limpeza automática de notícias antigas...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Executar função de limpeza (padrão: 7 dias)
    const { data: resultadoLimpeza, error: errorLimpeza } = await supabase
      .rpc('limpar_noticias_antigas', { dias_reter: 7 });

    if (errorLimpeza) {
      console.error('❌ Erro ao executar limpeza:', errorLimpeza);
      throw errorLimpeza;
    }

    console.log('📊 Resultado da limpeza:', JSON.stringify(resultadoLimpeza, null, 2));

    // Coletar todas as imagens para deletar
    const todasImagens: string[] = [];
    let totalDeletados = 0;

    for (const resultado of resultadoLimpeza || []) {
      totalDeletados += resultado.registros_deletados || 0;
      
      if (resultado.imagens_para_deletar && resultado.imagens_para_deletar.length > 0) {
        todasImagens.push(...resultado.imagens_para_deletar);
      }
    }

    console.log(`📰 Total de notícias deletadas: ${totalDeletados}`);
    console.log(`🖼️ Total de imagens para limpar: ${todasImagens.length}`);

    // Deletar imagens do Storage (apenas se são do nosso bucket)
    let imagensDeletadas = 0;
    let errosImagens = 0;

    for (const imagemUrl of todasImagens) {
      if (!imagemUrl) continue;

      try {
        // Verificar se é uma URL do nosso Supabase Storage
        if (imagemUrl.includes('izspjvegxdfgkgibpyst.supabase.co/storage')) {
          // Extrair o path do bucket
          // Formato: https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/imagens/noticias/arquivo.jpg
          const match = imagemUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
          
          if (match) {
            const [, bucket, filePath] = match;
            
            const { error: deleteError } = await supabase.storage
              .from(bucket)
              .remove([filePath]);

            if (deleteError) {
              console.warn(`⚠️ Erro ao deletar imagem ${filePath}:`, deleteError.message);
              errosImagens++;
            } else {
              imagensDeletadas++;
            }
          }
        }
      } catch (err) {
        console.warn(`⚠️ Erro ao processar imagem ${imagemUrl}:`, err);
        errosImagens++;
      }
    }

    console.log(`✅ Imagens deletadas do Storage: ${imagensDeletadas}`);
    if (errosImagens > 0) {
      console.log(`⚠️ Erros ao deletar imagens: ${errosImagens}`);
    }

    const resumo = {
      success: true,
      data_execucao: new Date().toISOString(),
      noticias_deletadas: totalDeletados,
      imagens_encontradas: todasImagens.length,
      imagens_deletadas: imagensDeletadas,
      erros_imagens: errosImagens,
      detalhes: resultadoLimpeza
    };

    console.log('🎉 Limpeza concluída:', JSON.stringify(resumo, null, 2));

    return new Response(JSON.stringify(resumo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro na limpeza:', errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
