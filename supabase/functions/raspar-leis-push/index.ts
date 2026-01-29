import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeiExtraida {
  numero_lei: string;
  ementa: string;
  data_publicacao: string | null;
  url_planalto: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the year from request or use current year
    const body = await req.json().catch(() => ({}));
    const year = body.year || new Date().getFullYear();
    
    const urlPlanalto = `https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/leis-ordinarias/${year}-leis-ordinarias`;
    
    console.log(`Raspando leis de ${year}: ${urlPlanalto}`);

    // Scrape the page using Firecrawl
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: urlPlanalto,
        formats: ['markdown', 'html'],
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Firecrawl error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to scrape Planalto' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData.data?.markdown || '';
    const html = scrapeData.data?.html || '';
    
    console.log('Conteúdo raspado, analisando leis...');

    // Extract laws from the content
    const leisExtraidas = extrairLeis(markdown, html, year);
    
    console.log(`${leisExtraidas.length} leis encontradas na página`);

    if (leisExtraidas.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhuma lei encontrada na página',
          novas_leis: 0,
          total_pagina: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check which laws already exist
    const numerosLeis = leisExtraidas.map(l => l.numero_lei);
    const { data: existingLeis } = await supabase
      .from('leis_push_2025')
      .select('numero_lei')
      .in('numero_lei', numerosLeis);

    const existingNumeros = new Set((existingLeis || []).map(l => l.numero_lei));
    const novasLeis = leisExtraidas.filter(l => !existingNumeros.has(l.numero_lei));

    console.log(`${novasLeis.length} leis novas para inserir`);

    // Insert new laws
    if (novasLeis.length > 0) {
      const { error: insertError } = await supabase
        .from('leis_push_2025')
        .insert(novasLeis.map(lei => ({
          numero_lei: lei.numero_lei,
          ementa: lei.ementa,
          data_publicacao: lei.data_publicacao,
          url_planalto: lei.url_planalto,
          status: 'pendente'
        })));

      if (insertError) {
        console.error('Erro ao inserir leis:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Chamar automaticamente a formatação das novas leis
      console.log(`Iniciando formatação automática de ${novasLeis.length} novas leis...`);
      
      try {
        const formatacaoResponse = await fetch(
          `${supabaseUrl}/functions/v1/automacao-formatacao-leis`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ limite: novasLeis.length + 5 })
          }
        );
        
        if (formatacaoResponse.ok) {
          const formatacaoResult = await formatacaoResponse.json();
          console.log('Formatação automática concluída:', formatacaoResult);
        } else {
          console.error('Erro na formatação automática:', await formatacaoResponse.text());
        }
      } catch (formatError) {
        console.error('Erro ao chamar formatação automática:', formatError);
        // Não retorna erro - a raspagem foi bem sucedida, formatação pode ser feita depois
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${novasLeis.length} novas leis encontradas e salvas`,
        novas_leis: novasLeis.length,
        total_pagina: leisExtraidas.length,
        leis: novasLeis.map(l => l.numero_lei),
        formatacao_automatica: novasLeis.length > 0 ? 'iniciada' : 'não necessária'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao raspar leis:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extrairLeis(markdown: string, html: string, year: number): LeiExtraida[] {
  const leis: LeiExtraida[] = [];
  
  // Parse HTML table rows - each <tr class="visaoQuadrosTr"> contains a law
  const rowRegex = /<tr\s+class="visaoQuadrosTr"[^>]*>([\s\S]*?)<\/tr>/gi;
  
  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowContent = rowMatch[1];
    
    // Extract the link and law info from first cell
    const linkMatch = rowContent.match(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    
    const url = linkMatch[1];
    const linkText = linkMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    
    // Extract law number from URL (e.g., L15290.htm -> 15290)
    const numMatch = url.match(/L(\d+)\.htm/i);
    if (!numMatch) continue;
    
    const numeroLei = numMatch[1];
    
    // Extract date from link text (e.g., "Lei nº 15.290, de 18.12.2025")
    const dateMatch = linkText.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    let dataPublicacao: string | null = null;
    
    if (dateMatch) {
      const dia = dateMatch[1].padStart(2, '0');
      const mes = dateMatch[2].padStart(2, '0');
      const ano = dateMatch[3];
      dataPublicacao = `${ano}-${mes}-${dia}`;
    }
    
    // Extract ementa from second cell - buscar todas as células td
    const tdRegex = /<td\s+class="visaoQuadrosTd"[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
      cells.push(tdMatch[1]);
    }
    
    let ementa = '';
    
    // A ementa geralmente está na segunda célula (index 1)
    if (cells.length >= 2) {
      ementa = cells[1]
        .replace(/<[^>]+>/g, ' ')         // Remove HTML tags
        .replace(/&nbsp;/g, ' ')           // Remove &nbsp;
        .replace(/\s+/g, ' ')             // Normalize whitespace
        .trim();
      
      // Remove common artifacts
      ementa = ementa
        .replace(/^[\s|]+/, '')
        .replace(/\s*\.\s*$/, '.')
        .trim();
    }
    
    // Validar que a ementa não é o título da lei
    const isEmentaInvalida = (texto: string) => {
      if (!texto || texto.length < 20) return true;
      // Se começa com "Lei nº", "Lei Ordinária", etc., é inválida
      if (/^Lei\s+(nº|Ordinária|Complementar)/i.test(texto)) return true;
      if (/^\d+\.\d+/i.test(texto)) return true; // Apenas número
      return false;
    };

    // Se ementa estiver vazia ou for o título da lei, tentar extrair do markdown
    if (isEmentaInvalida(ementa)) {
      // Tentar encontrar a ementa no markdown
      const ementaMarkdownMatch = markdown.match(new RegExp(`${linkText}[\\s\\S]{0,50}\\|([^|\\n]+)`, 'i'));
      if (ementaMarkdownMatch && !isEmentaInvalida(ementaMarkdownMatch[1].trim())) {
        ementa = ementaMarkdownMatch[1].trim();
      }
    }
    
    // Se ainda não tiver ementa válida, marcar como pendente (NUNCA salvar o título como ementa)
    if (isEmentaInvalida(ementa)) {
      ementa = 'Ementa pendente de extração';
    }
    
    // Format law number with dot (e.g., 15290 -> 15.290)
    const leiKey = `Lei Ordinária ${formatarNumeroLei(numeroLei)}/${year}`;
    
    // Avoid duplicates
    if (!leis.find(l => l.numero_lei === leiKey)) {
      console.log(`Lei extraída: ${leiKey} - Ementa: ${ementa.substring(0, 50)}...`);
      leis.push({
        numero_lei: leiKey,
        ementa: ementa,
        data_publicacao: dataPublicacao,
        url_planalto: url.startsWith('http') ? url : `https://www.planalto.gov.br${url}`
      });
    }
  }
  
  return leis;
}

function mesParaNumero(mes: string): string | null {
  const meses: Record<string, string> = {
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
    'abril': '04', 'maio': '05', 'junho': '06',
    'julho': '07', 'agosto': '08', 'setembro': '09',
    'outubro': '10', 'novembro': '11', 'dezembro': '12'
  };
  return meses[mes.toLowerCase()] || null;
}

function formatarNumeroLei(numero: string): string {
  const num = parseInt(numero);
  if (num >= 10000) {
    return `${Math.floor(num / 1000)}.${String(num % 1000).padStart(3, '0')}`;
  }
  return numero;
}

function getAtoRange(ano: number): string {
  if (ano >= 2023) return '2023-2026';
  if (ano >= 2019) return '2019-2022';
  if (ano >= 2015) return '2015-2018';
  if (ano >= 2011) return '2011-2014';
  if (ano >= 2007) return '2007-2010';
  return '2004-2006';
}
