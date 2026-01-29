import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Converter "19 de janeiro de 2026" para "2026-01-19"
function parsePortugueseDate(dateStr: string): string | null {
  const months: Record<string, string> = {
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
    'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
    'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
  };
  
  const match = dateStr.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (!match) return null;
  
  const day = match[1].padStart(2, '0');
  const monthName = match[2].toLowerCase();
  const year = match[3];
  const month = months[monthName];
  
  if (!month) return null;
  return `${year}-${month}-${day}`;
}

// Converter "11 h 0" para "11:00"
function parsePortugueseTime(timeStr: string): string | null {
  const match = timeStr.match(/(\d{1,2})\s*h\s*(\d{1,2})?/i);
  if (!match) return null;
  
  const hours = match[1].padStart(2, '0');
  const minutes = (match[2] || '0').padStart(2, '0');
  return `${hours}:${minutes}`;
}

async function scrapePage(pageNum: number): Promise<{
  items: Array<{
    titulo: string;
    descricao: string;
    link: string;
    data_publicacao: string | null;
    hora_publicacao: string | null;
    categoria: string | null;
  }>;
  hasMore: boolean;
}> {
  const url = pageNum === 1 
    ? 'https://examedeordem.oab.org.br/Noticias'
    : `https://examedeordem.oab.org.br/Noticias?page=${pageNum}`;
  
  console.log(`Fetching page ${pageNum}: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page ${pageNum}: ${response.status}`);
  }

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  if (!doc) {
    throw new Error(`Failed to parse HTML for page ${pageNum}`);
  }

  const newsItems: Array<{
    titulo: string;
    descricao: string;
    link: string;
    data_publicacao: string | null;
    hora_publicacao: string | null;
    categoria: string | null;
  }> = [];

  // Buscar todos os blocos de notícia-resumo
  const noticiaResumos = doc.querySelectorAll('.noticia-resumo');
  
  for (const resumo of noticiaResumos) {
    const resumoEl = resumo as Element;
    
    // Buscar o link e título
    const linkEl = resumoEl.querySelector('h4 a, h3 a, a');
    if (!linkEl) continue;
    
    const href = (linkEl as Element).getAttribute('href');
    const titulo = (linkEl as Element).textContent?.trim();
    if (!href || !titulo) continue;

    let fullLink = href;
    if (href.startsWith('/')) {
      fullLink = `https://examedeordem.oab.org.br${href}`;
    }

    // Buscar descrição
    const pEl = resumoEl.querySelector('p');
    const descricao = pEl?.textContent?.trim()?.slice(0, 300) || '';

    // Buscar categoria (span dentro do resumo)
    const catEl = resumoEl.querySelector('span');
    const categoria = catEl?.textContent?.trim() || 'OAB';

    // Buscar data - procurar no elemento pai ou anterior
    let dataPublicacao: string | null = null;
    let horaPublicacao: string | null = null;

    const parent = resumoEl.parentElement;
    if (parent) {
      const dataEl = parent.querySelector('.noticia-data') || 
                     parent.parentElement?.querySelector('.noticia-data');
      if (dataEl) {
        const dataText = dataEl.textContent?.trim() || '';
        dataPublicacao = parsePortugueseDate(dataText);
      }

      const horaEl = parent.querySelector('.noticia-hora i') || 
                     parent.parentElement?.querySelector('.noticia-hora i');
      if (horaEl) {
        const horaText = horaEl.textContent?.trim() || '';
        horaPublicacao = parsePortugueseTime(horaText);
      }
    }

    newsItems.push({
      titulo: titulo.slice(0, 500),
      descricao,
      link: fullLink,
      data_publicacao: dataPublicacao,
      hora_publicacao: horaPublicacao,
      categoria
    });
  }

  // Fallback: buscar todos os links de notícias se não encontrou via estrutura
  if (newsItems.length < 3) {
    const allLinks = doc.querySelectorAll('a[href*="/Noticias/"]');
    const uniqueLinks = new Map<string, { href: string; text: string }>();
    
    for (const link of allLinks) {
      const linkEl = link as Element;
      const href = linkEl.getAttribute('href');
      const text = linkEl.textContent?.trim() || '';
      
      if (href && text && text.length > 10 && !uniqueLinks.has(href)) {
        uniqueLinks.set(href, { href, text });
      }
    }

    for (const [href, { text }] of uniqueLinks) {
      const exists = newsItems.some(item => item.link.includes(href));
      if (exists) continue;

      let fullLink = href;
      if (href.startsWith('/')) {
        fullLink = `https://examedeordem.oab.org.br${href}`;
      }
      
      newsItems.push({
        titulo: text.slice(0, 500),
        descricao: '',
        link: fullLink,
        data_publicacao: null,
        hora_publicacao: null,
        categoria: 'OAB'
      });
    }
  }

  // Verificar se há mais páginas (procurar link de próxima página)
  const paginationLinks = doc.querySelectorAll('a[href*="page="]');
  let hasMore = false;
  for (const link of paginationLinks) {
    const href = (link as Element).getAttribute('href') || '';
    const match = href.match(/page=(\d+)/);
    if (match && parseInt(match[1]) > pageNum) {
      hasMore = true;
      break;
    }
  }

  return { items: newsItems, hasMore };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Scraping ALL OAB news from examedeordem.oab.org.br/Noticias');

    // Buscar todas as páginas disponíveis (máximo 10 páginas para evitar timeout)
    const allNewsItems: Array<{
      titulo: string;
      descricao: string;
      link: string;
      data_publicacao: string | null;
      hora_publicacao: string | null;
      categoria: string | null;
    }> = [];

    let currentPage = 1;
    const maxPages = 10; // Limite de segurança
    let hasMore = true;

    while (hasMore && currentPage <= maxPages) {
      try {
        const { items, hasMore: more } = await scrapePage(currentPage);
        console.log(`Page ${currentPage}: found ${items.length} items`);
        
        allNewsItems.push(...items);
        hasMore = more && items.length > 0;
        currentPage++;
        
        // Pequeno delay entre requisições para não sobrecarregar o servidor
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (pageError) {
        console.error(`Error scraping page ${currentPage}:`, pageError);
        break;
      }
    }

    console.log(`Total scraped: ${allNewsItems.length} news items from ${currentPage - 1} pages`);

    if (allNewsItems.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No news items found on the page',
          total: 0,
          new: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remover duplicatas por link
    const uniqueNews = new Map<string, typeof allNewsItems[0]>();
    for (const item of allNewsItems) {
      if (!uniqueNews.has(item.link)) {
        uniqueNews.set(item.link, item);
      }
    }
    const newsItems = Array.from(uniqueNews.values());
    console.log(`After deduplication: ${newsItems.length} unique items`);

    // Get existing news links
    const { data: existingNews } = await supabase
      .from('noticias_oab_cache')
      .select('link');

    const existingLinks = new Set((existingNews || []).map(n => n.link));
    const newItems = newsItems.filter(item => item.link && !existingLinks.has(item.link));

    console.log(`${newItems.length} new items to insert`);

    if (newItems.length > 0) {
      const { error: insertError } = await supabase
        .from('noticias_oab_cache')
        .insert(newItems.map(item => ({
          titulo: item.titulo,
          descricao: item.descricao || null,
          link: item.link,
          data_publicacao: item.data_publicacao ? new Date(item.data_publicacao).toISOString() : null,
          hora_publicacao: item.hora_publicacao,
          categoria: item.categoria,
          processado: false
        })));

      if (insertError) {
        console.error('Error inserting news:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Scraped ${newsItems.length} news from ${currentPage - 1} pages, ${newItems.length} new items inserted`,
        total: newsItems.length,
        new: newItems.length,
        pages: currentPage - 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping OAB news:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});