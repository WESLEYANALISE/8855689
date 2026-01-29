import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LivroAnnas {
  titulo: string;
  autor: string;
  editora?: string;
  ano?: string;
  idioma: string;
  formato: string;
  tamanho: string;
  capa?: string;
  descricao?: string;
  link: string;
  md5: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, idioma, formato, limite = 15 } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Termo de busca muito curto' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const browserlessToken = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessToken) {
      console.error('BROWSERLESS_API_KEY não configurada');
      return new Response(
        JSON.stringify({ success: false, error: 'Serviço de scraping não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Buscando livros no Anna's Archive: "${query}" (idioma: ${idioma || 'todos'})`);

    // Montar URL de busca com filtros
    const searchParams = new URLSearchParams({
      q: query,
      sort: 's', // Sort by most relevant
    });
    
    if (idioma === 'pt') {
      searchParams.append('lang', 'pt');
    }
    
    if (formato === 'pdf') {
      searchParams.append('ext', 'pdf');
    } else if (formato === 'epub') {
      searchParams.append('ext', 'epub');
    }

    const searchUrl = `https://annas-archive.se/search?${searchParams.toString()}`;
    console.log('URL de busca:', searchUrl);

    // Script Puppeteer para extração (formato Browserless v2)
    const puppeteerCode = `
export default async function({ page }) {
  await page.goto('${searchUrl}', { 
    waitUntil: 'networkidle2', 
    timeout: 30000 
  });
  
  // Aguardar resultados
  await page.waitForSelector('a[href*="/md5/"]', { timeout: 10000 }).catch(() => null);
  await new Promise(r => setTimeout(r, 1500));
  
  const livros = await page.evaluate((limite) => {
    const results = [];
    const links = document.querySelectorAll('a[href*="/md5/"]');
    
    links.forEach((link, index) => {
      if (index >= limite) return;
      
      try {
        const href = link.getAttribute('href') || '';
        const md5Match = href.match(/\\/md5\\/([a-f0-9]+)/i);
        if (!md5Match) return;
        
        const md5 = md5Match[1];
        const container = link;
        const fullText = container.textContent || '';
        
        // Extrair título
        const textos = fullText.split('\\n').map(t => t.trim()).filter(t => t.length > 3);
        let titulo = textos[0] || 'Sem título';
        
        // Extrair autor
        let autor = '';
        for (const texto of textos) {
          if (texto.toLowerCase().includes('by ')) {
            autor = texto.replace(/by\\s+/i, '').trim();
            break;
          }
        }
        if (!autor && textos.length > 1) autor = textos[1];
        
        // Formato
        let formato = 'PDF';
        const formatMatch = fullText.match(/\\b(pdf|epub|mobi|azw3|djvu)\\b/i);
        if (formatMatch) formato = formatMatch[1].toUpperCase();
        
        // Tamanho
        let tamanho = '';
        const tamanhoMatch = fullText.match(/\\b(\\d+(?:\\.\\d+)?\\s*(?:MB|KB|GB))\\b/i);
        if (tamanhoMatch) tamanho = tamanhoMatch[1];
        
        // Idioma
        let idioma = 'en';
        if (fullText.toLowerCase().includes('portuguese') || fullText.includes('[pt]')) {
          idioma = 'pt';
        } else if (fullText.toLowerCase().includes('spanish') || fullText.includes('[es]')) {
          idioma = 'es';
        }
        
        // Ano
        let ano = '';
        const anoMatch = fullText.match(/\\b(19|20)\\d{2}\\b/);
        if (anoMatch) ano = anoMatch[0];
        
        // Capa
        let capa = '';
        const img = container.querySelector('img');
        if (img && img.src && !img.src.includes('placeholder')) {
          capa = img.src;
        }
        
        results.push({
          titulo: titulo.substring(0, 200),
          autor: autor.substring(0, 100),
          ano,
          idioma,
          formato,
          tamanho,
          capa,
          link: 'https://annas-archive.se' + href,
          md5
        });
      } catch (e) {}
    });
    
    return results;
  }, ${limite});
  
  return {
    data: { livros, total: livros.length },
    type: "application/json"
  };
}
    `;

    const response = await fetch(`https://production-sfo.browserless.io/function?token=${browserlessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/javascript' },
      body: puppeteerCode,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro Browserless:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Erro no scraping: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const livros: LivroAnnas[] = result?.data?.livros || result?.livros || [];

    console.log(`Busca concluída: ${livros.length} livros encontrados`);

    return new Response(
      JSON.stringify({
        success: true,
        livros,
        total: livros.length,
        query,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
