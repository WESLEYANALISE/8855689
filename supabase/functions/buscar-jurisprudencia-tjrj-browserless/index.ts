import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface JurisprudenciaResult {
  id: string;
  numeroProcesso: string;
  classe: string;
  relator: string;
  orgaoJulgador: string;
  dataJulgamento: string;
  dataRegistro?: string;
  ementa: string;
  ementaOriginal?: string;
  tribunal: string;
  linkInteiroTeor?: string;
  fonte: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { termo, pagina = 1 } = await req.json();

    if (!termo || termo.trim().length < 3) {
      return new Response(
        JSON.stringify({ success: false, error: "Termo de busca deve ter pelo menos 3 caracteres" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const BROWSERLESS_API_KEY = Deno.env.get('BROWSERLESS_API_KEY');
    if (!BROWSERLESS_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "BROWSERLESS_API_KEY não configurada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`🔍 Buscando no TJRJ via Browserless: "${termo}" (página ${pagina})`);

    // Script Puppeteer para o TJRJ e-JURIS (ES Modules)
    const puppeteerScript = `
      export default async function({ page }) {
        const searchUrl = 'http://www4.tjrj.jus.br/ejuris/ConsultarJurisprudencia.aspx';
        
        console.log('Navegando para TJRJ:', searchUrl);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await page.setViewport({ width: 1280, height: 800 });
        
        await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 60000 });
        await new Promise(r => setTimeout(r, 2000));
        
        // Preencher campo de busca
        const searchTerm = ${JSON.stringify(termo)};
        const inputSelectors = [
          'input[name*="txtPalavras"]',
          'input[name*="palavras"]',
          'input#txtPalavras',
          'input[type="text"]',
          'textarea'
        ];
        
        let inputFound = false;
        for (const selector of inputSelectors) {
          try {
            const input = await page.$(selector);
            if (input) {
              await input.click({ clickCount: 3 });
              await input.type(searchTerm, { delay: 50 });
              inputFound = true;
              console.log('Campo preenchido:', selector);
              break;
            }
          } catch (e) {}
        }
        
        if (!inputFound) {
          console.log('Campo de busca não encontrado');
          return { success: false, error: 'Campo de busca não encontrado' };
        }

        await new Promise(r => setTimeout(r, 500));
        
        // Clicar no botão de pesquisar
        const buttonSelectors = [
          'input[type="submit"][value*="Pesquisar"]',
          'input[name*="btnPesquisar"]',
          'button[type="submit"]',
          'input[type="submit"]',
          'a[href*="pesquisar"]'
        ];
        
        let buttonClicked = false;
        for (const selector of buttonSelectors) {
          try {
            const button = await page.$(selector);
            if (button) {
              await button.click();
              buttonClicked = true;
              console.log('Botão clicado:', selector);
              break;
            }
          } catch (e) {}
        }
        
        if (!buttonClicked) {
          await page.keyboard.press('Enter');
          console.log('Enter pressionado');
        }
        
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 3000));
        
        // Extrair resultados
        const bodyText = await page.evaluate(() => document.body.innerText);
        
        const results = [];
        
        // Padrões para processos TJRJ
        const processPatterns = [
          /(\\d{7}-\\d{2}\\.\\d{4}\\.\\d{1}\\.\\d{2}\\.\\d{4})/g,
          /(?:Processo|Número)[:\\s]*([\\d\\.\\-\\/]+)/gi,
          /(?:Apelação|Agravo|Recurso)[^\\d]*(\\d+[\\d\\.\\-\\/]+)/gi
        ];
        
        const processosEncontrados = new Set();
        for (const pattern of processPatterns) {
          const matches = bodyText.matchAll(pattern);
          for (const match of matches) {
            if (match[1] && match[1].length > 10) {
              processosEncontrados.add(match[1].trim());
            }
          }
        }
        
        console.log('Processos encontrados:', processosEncontrados.size);
        
        // Extrair informações de cada resultado
        const blocos = bodyText.split(/(?=(?:Processo|Apelação|Agravo|Recurso)[:\\s]*\\d)/i);
        
        for (const bloco of blocos) {
          if (bloco.length < 100) continue;
          
          // Número do processo
          let numeroProcesso = '';
          const numMatch = bloco.match(/(\\d{7}-\\d{2}\\.\\d{4}\\.\\d{1}\\.\\d{2}\\.\\d{4})/) ||
                           bloco.match(/(?:Processo|Número)[:\\s]*([\\d\\.\\-\\/]+)/i);
          if (numMatch) numeroProcesso = numMatch[1].trim();
          else continue;
          
          // Classe
          let classe = '';
          const classeMatch = bloco.match(/(?:Classe|Tipo de Ação)[:\\s]*([^\\n]+)/i);
          if (classeMatch) classe = classeMatch[1].trim().substring(0, 100);
          
          // Relator
          let relator = '';
          const relatorMatch = bloco.match(/(?:Relator|Des\\.|Desembargador)[:\\s]*([^\\n]+)/i);
          if (relatorMatch) relator = relatorMatch[1].trim().substring(0, 100);
          
          // Órgão Julgador
          let orgaoJulgador = '';
          const orgaoMatch = bloco.match(/(?:Órgão|Câmara|Turma)[:\\s]*([^\\n]+)/i);
          if (orgaoMatch) orgaoJulgador = orgaoMatch[1].trim().substring(0, 100);
          
          // Data de Julgamento
          let dataJulgamento = '';
          const dataMatch = bloco.match(/(?:Data do julgamento|Julgado em|Julgamento)[:\\s]*(\\d{2}\\/\\d{2}\\/\\d{4})/i);
          if (dataMatch) dataJulgamento = dataMatch[1];
          
          // Ementa
          let ementa = '';
          const ementaMatch = bloco.match(/(?:Ementa|EMENTA)[:\\s]*([\\s\\S]{50,2000}?)(?=(?:Inteiro teor|Acórdão|Relator|$))/i);
          if (ementaMatch) ementa = ementaMatch[1].replace(/\\s+/g, ' ').trim();
          else {
            const idx = bloco.indexOf(numeroProcesso);
            if (idx !== -1) {
              ementa = bloco.substring(idx + numeroProcesso.length, idx + 500).replace(/\\s+/g, ' ').trim();
            }
          }
          
          if (numeroProcesso && (ementa || classe)) {
            results.push({
              id: 'tjrj_' + numeroProcesso.replace(/[^\\w]/g, '_'),
              numeroProcesso,
              classe: classe || 'Não informada',
              relator: relator || 'Não informado',
              orgaoJulgador: orgaoJulgador || 'Não informado',
              dataJulgamento: dataJulgamento || '',
              ementa: ementa.substring(0, 500) + (ementa.length > 500 ? '...' : ''),
              ementaOriginal: ementa,
              tribunal: 'TJRJ',
              fonte: 'TJRJ Browserless',
              linkInteiroTeor: 'http://www4.tjrj.jus.br/ejuris/'
            });
          }
        }
        
        // Deduplicate
        const uniqueResults = [];
        const seen = new Set();
        for (const r of results) {
          if (!seen.has(r.numeroProcesso)) {
            seen.add(r.numeroProcesso);
            uniqueResults.push(r);
          }
        }
        
        console.log('Total resultados únicos:', uniqueResults.length);
        
        return {
          success: true,
          resultados: uniqueResults.slice(0, 50),
          total: uniqueResults.length,
          termo: searchTerm,
          pagina: ${pagina}
        };
      }
    `;

    const browserlessUrl = `https://chrome.browserless.io/function?token=${BROWSERLESS_API_KEY}`;
    const response = await fetch(browserlessUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/javascript' },
      body: puppeteerScript
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Browserless error:', errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Browserless API error: ${response.status} - ${errorText.substring(0, 200)}`,
          detalhes: "Falha na automação do navegador para TJRJ"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const result = await response.json();
    console.log(`✅ TJRJ: ${result.resultados?.length || 0} resultados`);

    return new Response(
      JSON.stringify({
        success: true,
        resultados: result.resultados || [],
        total: result.total || result.resultados?.length || 0,
        pagina: pagina,
        fonte: 'TJRJ Browserless',
        tribunal: 'TJRJ',
        termo: termo
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Erro na busca TJRJ:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        detalhes: "Erro ao buscar jurisprudência no TJRJ"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
