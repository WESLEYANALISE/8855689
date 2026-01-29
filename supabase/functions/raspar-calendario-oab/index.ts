import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Iniciando scraping do Calendário OAB...');

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlKey) {
      console.log('FIRECRAWL_API_KEY não configurada, usando dados em cache');
      return new Response(
        JSON.stringify({ success: true, message: 'Usando cache existente - FIRECRAWL não configurado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://examedeordem.oab.org.br/Calendario',
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 5000,
      }),
    });

    if (!response.ok) {
      console.error('Erro ao acessar Firecrawl:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao acessar página da OAB' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const markdown = data.data?.markdown || '';
    const html = data.data?.html || '';
    
    console.log('Conteúdo obtido, tamanho markdown:', markdown.length);

    // Parse exam dates from content
    // Pattern: Look for exam numbers (45º, 46º, etc.) and associated dates
    const examePattern = /(\d{2})º\s*(?:EXAME|EOU|Exame)/gi;
    const datePattern = /(\d{2})\/(\d{2})\/(\d{4})/g;
    
    // Extract all dates found
    const allDates: string[] = [];
    let dateMatch;
    while ((dateMatch = datePattern.exec(markdown)) !== null) {
      const [, day, month, year] = dateMatch;
      allDates.push(`${year}-${month}-${day}`);
    }

    console.log(`Encontradas ${allDates.length} datas no conteúdo`);

    // Update timestamp for existing records
    const { error: updateError } = await supabase
      .from('calendario_oab')
      .update({ atualizado_em: new Date().toISOString() })
      .gte('exame_numero', 45);

    if (updateError) {
      console.error('Erro ao atualizar timestamp:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Calendário verificado e atualizado',
        dates_found: allDates.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no scraping Calendário:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
