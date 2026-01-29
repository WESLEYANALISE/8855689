import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar leis sem data
    const { data: leisSemData, error: fetchError } = await supabase
      .from('leis_push_2025')
      .select('id, numero_lei, tipo_ato, url_planalto')
      .is('data_publicacao', null)
      .limit(50); // Processar em lotes

    if (fetchError) {
      throw new Error(`Erro ao buscar leis: ${fetchError.message}`);
    }

    console.log(`Encontradas ${leisSemData?.length || 0} leis sem data`);

    const mesesPt: Record<string, string> = {
      'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
      'abril': '04', 'maio': '05', 'junho': '06', 'julho': '07',
      'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
    };

    let corrigidos = 0;
    const erros: string[] = [];
    const detalhes: { numero: string; data: string; fonte: string }[] = [];

    for (const lei of leisSemData || []) {
      let dataCorrigida: string | null = null;
      let fonte = '';
      
      // Tentar buscar a data do DOU da página do Planalto via Firecrawl
      if (!dataCorrigida && firecrawlKey && lei.url_planalto) {
        try {
          console.log(`Buscando data do DOU para: ${lei.numero_lei} em ${lei.url_planalto}`);
          
          const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: lei.url_planalto,
              formats: ['html'],
              onlyMainContent: false,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const html = data.data?.html || data.html || '';
            
            // Padrão 1: "Publicação DOU" ou "DOU de dd/mm/yyyy" ou "DOU de dd.mm.yyyy"
            const douMatch1 = html.match(/DOU\s+(?:de\s+)?(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})/i);
            if (douMatch1) {
              const dia = douMatch1[1].padStart(2, '0');
              const mes = douMatch1[2].padStart(2, '0');
              const ano = douMatch1[3];
              dataCorrigida = `${ano}-${mes}-${dia}`;
              fonte = 'DOU página';
            }
            
            // Padrão 2: "Publicação: dd de mês de yyyy"
            if (!dataCorrigida) {
              const douMatch2 = html.match(/Publica[çc][aã]o[:\s]+(\d{1,2})\s+(?:de\s+)?(\w+)\s+(?:de\s+)?(\d{4})/i);
              if (douMatch2) {
                const dia = douMatch2[1].padStart(2, '0');
                const mesNome = douMatch2[2].toLowerCase();
                const ano = douMatch2[3];
                const mes = mesesPt[mesNome];
                if (mes) {
                  dataCorrigida = `${ano}-${mes}-${dia}`;
                  fonte = 'Publicação página';
                }
              }
            }
            
            // Padrão 3: Data no cabeçalho da lei "de dd de mês de yyyy"
            if (!dataCorrigida) {
              const leiMatch = html.match(/de\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
              if (leiMatch) {
                const dia = leiMatch[1].padStart(2, '0');
                const mesNome = leiMatch[2].toLowerCase();
                const ano = leiMatch[3];
                const mes = mesesPt[mesNome];
                if (mes) {
                  dataCorrigida = `${ano}-${mes}-${dia}`;
                  fonte = 'Data da lei';
                }
              }
            }
          }
        } catch (e) {
          console.error(`Erro ao buscar página: ${e}`);
        }
      }
      
      if (dataCorrigida) {
        const { error: updateError } = await supabase
          .from('leis_push_2025')
          .update({ data_publicacao: dataCorrigida })
          .eq('id', lei.id);
        
        if (updateError) {
          erros.push(`${lei.numero_lei}: ${updateError.message}`);
        } else {
          corrigidos++;
          detalhes.push({ numero: lei.numero_lei, data: dataCorrigida, fonte });
          console.log(`Corrigido: ${lei.numero_lei} -> ${dataCorrigida} (${fonte})`);
        }
      } else {
        console.log(`Sem data encontrada para: ${lei.numero_lei}`);
      }
      
      // Delay entre requisições para não sobrecarregar
      await new Promise(r => setTimeout(r, 500));
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_sem_data: leisSemData?.length || 0,
        corrigidos,
        detalhes: detalhes.slice(0, 30),
        erros: erros.slice(0, 10)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
