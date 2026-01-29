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

    console.log('Iniciando scraping do FAQ OAB...');

    // Fetch FAQ page using firecrawl
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
        url: 'https://examedeordem.oab.org.br/PerguntasFrequentes',
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
    
    console.log('Conteúdo obtido, tamanho:', markdown.length);

    // Parse FAQ items from markdown
    // The FAQ page typically has questions as headers and answers as paragraphs
    const faqItems: { numero: number; pergunta: string; resposta: string }[] = [];
    
    // Try to extract Q&A pairs using regex patterns
    const qaPattern = /(?:^|\n)#+\s*(\d+[\.\)]\s*)?(.+?)[\?\n]+([\s\S]*?)(?=(?:\n#+|\n\d+[\.\)]|$))/gi;
    let match;
    let numero = 1;
    
    while ((match = qaPattern.exec(markdown)) !== null) {
      const pergunta = match[2]?.trim();
      const resposta = match[3]?.trim();
      
      if (pergunta && resposta && pergunta.length > 10 && resposta.length > 20) {
        faqItems.push({
          numero,
          pergunta: pergunta.replace(/\*+/g, '').trim(),
          resposta: resposta.replace(/\*+/g, '').replace(/\n+/g, ' ').trim().slice(0, 1000),
        });
        numero++;
      }
    }

    console.log(`Extraídos ${faqItems.length} itens do FAQ`);

    // Only update if we found items
    if (faqItems.length > 0) {
      // Upsert FAQ items
      for (const item of faqItems) {
        const { error } = await supabase
          .from('faq_oab_cache')
          .upsert({
            numero: item.numero,
            pergunta: item.pergunta,
            resposta: item.resposta,
            ultima_atualizacao: new Date().toISOString(),
          }, {
            onConflict: 'numero',
          });

        if (error) {
          console.error('Erro ao salvar FAQ item:', error);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `FAQ atualizado com ${faqItems.length} itens`,
        items: faqItems.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no scraping FAQ:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
