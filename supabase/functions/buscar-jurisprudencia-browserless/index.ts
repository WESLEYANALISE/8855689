import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JurisprudenciaResult {
  id: string;
  numeroProcesso: string;
  classe: string;
  relator: string;
  orgaoJulgador: string;
  dataJulgamento: string | null;
  dataRegistro: string | null;
  ementa: string;
  linkInteiroTeor: string;
  tribunal: string;
  fonte: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { termo, pagina = 1 } = await req.json();

    if (!termo || termo.trim() === '') {
      return new Response(
        JSON.stringify({ success: false, error: 'Termo de busca é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const BROWSERLESS_API_KEY = Deno.env.get('BROWSERLESS_API_KEY');
    if (!BROWSERLESS_API_KEY) {
      throw new Error('BROWSERLESS_API_KEY não configurada');
    }

    console.log(`[Browserless] Iniciando busca por: "${termo}", página: ${pagina}`);

    // Puppeteer script para navegação no e-SAJ TJSP
    const puppeteerScript = `
      export default async function({ page }) {
        try {
          // Configurar User-Agent
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          
          console.log('[TJSP] Navegando para página de consulta...');
          
          // Navegar para a página de consulta
          await page.goto('https://esaj.tjsp.jus.br/cjsg/consultaCompleta.do', { 
            waitUntil: 'networkidle2',
            timeout: 60000 
          });
          
          // Aguardar scripts carregarem completamente
          await new Promise(r => setTimeout(r, 3000));
          
          console.log('[TJSP] Página carregada, buscando campo de pesquisa...');
          
          // Tentar múltiplos seletores para o campo de busca
          const campoSelectors = [
            '#iddados\\\\.buscaInteiroTeor',
            'input[name="dados.buscaInteiroTeor"]',
            'input.spwCampoTexto[size="100"]',
            '#iddados\\\\.buscaInteiroTeor'
          ];
          
          let campoEncontrado = null;
          for (const selector of campoSelectors) {
            try {
              await page.waitForSelector(selector, { timeout: 5000 });
              campoEncontrado = selector;
              console.log('[TJSP] Campo encontrado com seletor:', selector);
              break;
            } catch (e) {
              console.log('[TJSP] Seletor não encontrado:', selector);
            }
          }
          
          if (!campoEncontrado) {
            throw new Error('Campo de busca não encontrado na página');
          }
          
          // Limpar e preencher o termo de busca
          await page.click(campoEncontrado);
          await page.type(campoEncontrado, ${JSON.stringify(termo)}, { delay: 30 });
          
          console.log('[TJSP] Termo digitado, clicando em pesquisar...');
          
          // Aguardar antes de clicar
          await new Promise(r => setTimeout(r, 500));
          
          // Clicar no botão de pesquisa
          await page.click('#pbSubmit');
          
          // Aguardar os resultados carregarem
          await page.waitForSelector('.fundocinza1, .mensagemRetorno, #divDadosResultado-A, .espacoResultado', { 
            timeout: 60000 
          });
          
          // Aguardar estabilização da página
          await new Promise(r => setTimeout(r, 3000));
          
          console.log('[TJSP] Resultados carregados');
          
          ${pagina > 1 ? `
          // Navegar para a página específica
          console.log('[TJSP] Navegando para página ${pagina}...');
          await page.goto('https://esaj.tjsp.jus.br/cjsg/trocaDePagina.do?tipoDeDecisao=A&pagina=${pagina}', {
            waitUntil: 'networkidle2',
            timeout: 60000
          });
          
          await page.waitForSelector('.fundocinza1, .mensagemRetorno', { timeout: 30000 });
          await new Promise(r => setTimeout(r, 2000));
          ` : ''}
          
          // Extrair o HTML da página
          const html = await page.evaluate(() => document.body.innerHTML);
          
          return { 
            success: true, 
            html: html,
            url: page.url()
          };
        } catch (error) {
          console.error('[TJSP] Erro:', error.message);
          // Tentar capturar HTML mesmo com erro para debug
          let debugHtml = '';
          try {
            debugHtml = await page.evaluate(() => document.body.innerHTML);
          } catch (e) {}
          
          return { 
            success: false, 
            error: error.message,
            html: debugHtml
          };
        }
      }
    `;

    // Chamar Browserless com Puppeteer script
    const browserlessResponse = await fetch(`https://chrome.browserless.io/function?token=${BROWSERLESS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/javascript',
      },
      body: puppeteerScript,
    });

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      console.error('[Browserless] Erro na API:', errorText);
      throw new Error(`Browserless API error: ${browserlessResponse.status} - ${errorText}`);
    }

    const result = await browserlessResponse.json();
    console.log(`[Browserless] Response success: ${result.success}, URL: ${result.url}`);
    
    if (!result.success) {
      console.error('[Browserless] Script error:', result.error);
      throw new Error(`Script error: ${result.error}`);
    }

    const html = result.html || '';
    console.log(`[Browserless] HTML length: ${html.length}`);

    if (!html || html.length < 100) {
      console.log('[Browserless] HTML muito curto, possível erro no carregamento');
      return new Response(
        JSON.stringify({
          success: true,
          resultados: [],
          total: 0,
          pagina,
          termo,
          fonte: 'e-SAJ via Browserless'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse do HTML para extrair resultados
    const resultados = parseHtmlResults(html);
    const total = extractTotal(html);

    console.log(`[Browserless] Encontrados ${resultados.length} resultados, total: ${total}`);

    return new Response(
      JSON.stringify({
        success: true,
        resultados,
        total,
        pagina,
        termo,
        fonte: 'e-SAJ via Browserless'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Browserless] Erro:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao buscar jurisprudência',
        detalhes: 'Falha na automação do navegador'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseHtmlResults(html: string): JurisprudenciaResult[] {
  const resultados: JurisprudenciaResult[] = [];
  
  // Regex para encontrar blocos de resultado
  const rowPattern = /<tr[^>]*class="[^"]*fundocinza[12][^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  
  while ((match = rowPattern.exec(html)) !== null) {
    try {
      const rowHtml = match[1];
      
      // Extrair número do processo
      const processoMatch = rowHtml.match(/<a[^>]*href="([^"]*(?:search\.do|cposg)[^"]*)"[^>]*>([^<]+)<\/a>/i);
      if (!processoMatch) continue;
      
      const linkHref = processoMatch[1];
      const numeroProcesso = processoMatch[2].trim();
      
      // Limpar HTML para texto
      const rowText = rowHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      
      // Extrair campos
      let classe = '';
      const classeMatch = rowText.match(/Classe\/Assunto:\s*([^;]+?)(?:Relator|Comarca|Órgão|Data|$)/i);
      if (classeMatch) classe = classeMatch[1].trim();
      
      let relator = '';
      const relatorMatch = rowText.match(/Relator\s*\(a\):\s*([^;]+?)(?:Comarca|Órgão|Data|$)/i);
      if (relatorMatch) relator = relatorMatch[1].trim();
      
      let orgaoJulgador = '';
      const orgaoMatch = rowText.match(/Órgão\s*Julgador:\s*([^;]+?)(?:Data|$)/i);
      if (orgaoMatch) orgaoJulgador = orgaoMatch[1].trim();
      
      let dataJulgamento: string | null = null;
      const dataJulgMatch = rowText.match(/Data\s*do\s*Julgamento:\s*(\d{2}\/\d{2}\/\d{4})/i);
      if (dataJulgMatch) dataJulgamento = dataJulgMatch[1];
      
      let dataRegistro: string | null = null;
      const dataRegMatch = rowText.match(/Data\s*de\s*Registro:\s*(\d{2}\/\d{2}\/\d{4})/i);
      if (dataRegMatch) dataRegistro = dataRegMatch[1];
      
      // Extrair ementa
      let ementa = '';
      const ementaMatch = rowHtml.match(/class="[^"]*ementa[^"]*"[^>]*>([\s\S]*?)<\/(?:div|td|span)/i);
      if (ementaMatch) {
        ementa = ementaMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      } else {
        const ementaTextMatch = rowText.match(/Ementa:\s*([\s\S]+?)(?:Data|Relator|$)/i);
        if (ementaTextMatch) ementa = ementaTextMatch[1].trim();
      }
      
      const fullLink = linkHref.startsWith('http') 
        ? linkHref 
        : 'https://esaj.tjsp.jus.br' + (linkHref.startsWith('/') ? '' : '/') + linkHref;
      
      resultados.push({
        id: 'TJSP_' + numeroProcesso.replace(/[^0-9]/g, ''),
        numeroProcesso,
        classe,
        relator,
        orgaoJulgador,
        dataJulgamento,
        dataRegistro,
        ementa: ementa.substring(0, 2000),
        linkInteiroTeor: fullLink,
        tribunal: 'TJSP',
        fonte: 'e-SAJ (Browserless)'
      });
    } catch (e) {
      console.error('[Browserless] Erro ao processar linha:', e);
    }
  }
  
  return resultados;
}

function extractTotal(html: string): number {
  // Tentar extrair total de resultados
  const totalMatch = html.match(/(\d+(?:\.\d+)?)\s*(?:resultado|registro|Acórdão)/i);
  if (totalMatch) {
    return parseInt(totalMatch[1].replace('.', ''), 10);
  }
  return 0;
}
