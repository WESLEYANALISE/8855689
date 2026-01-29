import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Raspagem em lote dos textos brutos das leis pendentes
 * - Busca leis com texto_bruto vazio
 * - Raspa cada URL do Planalto usando Firecrawl ou fetch direto
 * - Atualiza o texto_bruto de cada lei
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { limite = 10, dataFiltro } = await req.json().catch(() => ({}));
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 RASPAGEM EM LOTE DE TEXTOS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 Limite: ${limite}`);
    console.log(`📅 Filtro de data: ${dataFiltro || 'nenhum'}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar leis pendentes (sem texto_bruto)
    let query = supabase
      .from('leis_push_2025')
      .select('id, numero_lei, url_planalto, tipo_ato, data_dou')
      .or('texto_bruto.is.null,texto_bruto.eq.')
      .not('url_planalto', 'is', null)
      .order('data_dou', { ascending: false })
      .limit(limite);
    
    if (dataFiltro) {
      query = query.eq('data_dou', dataFiltro);
    }

    const { data: leisPendentes, error: fetchError } = await query;

    if (fetchError) {
      console.error('Erro ao buscar leis pendentes:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!leisPendentes || leisPendentes.length === 0) {
      console.log('✅ Nenhuma lei pendente encontrada');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhuma lei pendente para raspar',
          processadas: 0,
          total: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 ${leisPendentes.length} leis pendentes encontradas`);

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    let processadas = 0;
    let erros = 0;
    const resultados: Array<{ id: string; numero: string; status: 'sucesso' | 'erro'; erro?: string }> = [];

    for (const lei of leisPendentes) {
      console.log(`\n📄 Processando: ${lei.numero_lei}`);
      console.log(`   URL: ${lei.url_planalto}`);
      
      try {
        let textoBruto = '';
        let raspouComSucesso = false;
        
        // Tentar com Firecrawl primeiro
        if (firecrawlApiKey) {
          try {
            console.log('   🔥 Tentando Firecrawl...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: lei.url_planalto,
                formats: ['markdown'],
                onlyMainContent: false,
                waitFor: 2000,
                timeout: 25000,
              }),
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (firecrawlResponse.ok) {
              const data = await firecrawlResponse.json();
              textoBruto = data.data?.markdown || data.markdown || '';
              if (textoBruto && textoBruto.length > 100) {
                raspouComSucesso = true;
                console.log(`   ✅ Firecrawl OK: ${textoBruto.length} caracteres`);
              }
            }
          } catch (fcError) {
            console.log(`   ⚠️ Firecrawl falhou: ${fcError}`);
          }
        }
        
        // Fallback: fetch direto
        if (!raspouComSucesso) {
          console.log('   🌐 Tentando fetch direto...');
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);
            
            const directResponse = await fetch(lei.url_planalto, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
              },
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (directResponse.ok) {
              const html = await directResponse.text();
              // Extrair apenas o texto principal do HTML
              textoBruto = extrairTextoDoHtml(html);
              if (textoBruto && textoBruto.length > 100) {
                raspouComSucesso = true;
                console.log(`   ✅ Fetch direto OK: ${textoBruto.length} caracteres`);
              }
            }
          } catch (directError) {
            console.log(`   ⚠️ Fetch direto falhou: ${directError}`);
          }
        }
        
        if (raspouComSucesso && textoBruto) {
          // Salvar no banco
          const { error: updateError } = await supabase
            .from('leis_push_2025')
            .update({ 
              texto_bruto: textoBruto,
              updated_at: new Date().toISOString()
            })
            .eq('id', lei.id);
          
          if (updateError) {
            console.log(`   ❌ Erro ao salvar: ${updateError.message}`);
            erros++;
            resultados.push({ id: lei.id, numero: lei.numero_lei, status: 'erro', erro: updateError.message });
          } else {
            processadas++;
            resultados.push({ id: lei.id, numero: lei.numero_lei, status: 'sucesso' });
          }
        } else {
          erros++;
          resultados.push({ id: lei.id, numero: lei.numero_lei, status: 'erro', erro: 'Falha ao raspar conteúdo' });
        }
        
        // Delay entre requisições para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (err) {
        console.error(`   ❌ Erro ao processar ${lei.numero_lei}:`, err);
        erros++;
        resultados.push({ 
          id: lei.id, 
          numero: lei.numero_lei, 
          status: 'erro', 
          erro: err instanceof Error ? err.message : 'Erro desconhecido' 
        });
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`✅ Processamento concluído: ${processadas}/${leisPendentes.length} sucesso, ${erros} erros`);
    console.log('═══════════════════════════════════════════════════════════');

    return new Response(
      JSON.stringify({
        success: true,
        processadas,
        erros,
        total: leisPendentes.length,
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Função auxiliar para extrair texto de HTML
function extrairTextoDoHtml(html: string): string {
  // Remover scripts, styles, e tags
  let texto = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
  
  return texto;
}
