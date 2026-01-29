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

    console.log(`🔍 Buscando no TJMG via BrowserQL: "${termo}" (página ${pagina})`);

    // Escapar termo para uso no BQL
    const termoEscapado = termo.replace(/"/g, '\\"').replace(/\\/g, '\\\\');

    // Query BrowserQL com resolução automática de CAPTCHA
    const bqlQuery = `
      mutation BuscaTJMG {
        goto(
          url: "https://www5.tjmg.jus.br/jurisprudencia/formEspelhoAcordao.do"
          waitUntil: networkIdle
        ) {
          status
          url
        }
        
        wait1: waitForTimeout(timeout: 2000) {
          time
        }
        
        type(
          selector: "input[name='palavras']"
          text: "${termoEscapado}"
        ) {
          time
        }
        
        wait2: waitForTimeout(timeout: 500) {
          time
        }
        
        click(
          selector: "input[name='pesquisaPalavras']"
        ) {
          time
        }
        
        waitNav: waitForNavigation(waitUntil: networkIdle, timeout: 30000) {
          status
          url
        }
        
        wait3: waitForTimeout(timeout: 3000) {
          time
        }
        
        solveImageCaptcha(
          captchaSelector: "img[src*='captcha']"
          inputSelector: "input[name='captcha']"
        ) {
          found
          solved
          time
          token
        }
        
        submitAfterCaptcha: click(
          selector: "input[type='submit']"
        ) {
          time
        }
        
        wait4: waitForTimeout(timeout: 5000) {
          time
        }
        
        currentUrl: url {
          href
        }
        
        pageText: text(selector: "body") {
          text
        }
      }
    `;

    // Endpoint correto: chrome.browserless.io/bql (conforme documentação oficial)
    const browserlessUrl = `https://chrome.browserless.io/bql?token=${BROWSERLESS_API_KEY}`;
    
    console.log('📡 Chamando Browserless BQL...');
    
    const response = await fetch(browserlessUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        query: bqlQuery,
        variables: {},
        operationName: "BuscaTJMG"
      })
    });

    console.log('📊 BQL Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Browserless BQL error:', response.status, errorText);
      
      // Se BQL falhar, tentar com Puppeteer via /function
      console.log('🔄 Tentando método Puppeteer...');
      return await tentarMetodoPuppeteer(BROWSERLESS_API_KEY, termo, pagina, corsHeaders);
    }

    const bqlResult = await response.json();
    console.log('📊 BQL Result:', JSON.stringify(bqlResult).substring(0, 500));
    
    // Verificar se houve erros no GraphQL
    if (bqlResult.errors && bqlResult.errors.length > 0) {
      console.error('❌ BQL GraphQL errors:', JSON.stringify(bqlResult.errors));
      return await tentarMetodoPuppeteer(BROWSERLESS_API_KEY, termo, pagina, corsHeaders);
    }
    
    // Verificar se CAPTCHA foi resolvido
    const captchaInfo = bqlResult.data?.solveImageCaptcha;
    if (captchaInfo) {
      console.log('🔐 CAPTCHA info:', JSON.stringify(captchaInfo));
    }
    
    // Extrair texto da página
    const pageText = bqlResult.data?.pageText?.text || '';
    const currentUrl = bqlResult.data?.currentUrl?.href || '';
    
    console.log('📍 URL após busca:', currentUrl);
    console.log('📄 Tamanho do texto:', pageText.length);
    
    // Verificar se ainda está na página de CAPTCHA
    if (pageText.toLowerCase().includes('digite os números') || 
        pageText.toLowerCase().includes('captcha') ||
        currentUrl.toLowerCase().includes('captcha')) {
      console.log('⚠️ CAPTCHA detectado');
      
      return new Response(
        JSON.stringify({
          success: true,
          resultados: [],
          total: 0,
          pagina: pagina,
          fonte: 'TJMG BrowserQL',
          tribunal: 'TJMG',
          termo: termo,
          captchaDetectado: true,
          mensagem: 'O TJMG exige verificação CAPTCHA.',
          linkDireto: 'https://www5.tjmg.jus.br/jurisprudencia/formEspelhoAcordao.do'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verificar sem resultados
    if (pageText.includes('Nenhum registro encontrado') || 
        pageText.includes('Não foram encontrados')) {
      return new Response(
        JSON.stringify({
          success: true,
          resultados: [],
          total: 0,
          pagina: pagina,
          fonte: 'TJMG BrowserQL',
          tribunal: 'TJMG',
          termo: termo
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Parsear resultados
    const resultados = parsearResultadosTJMG(pageText);
    
    console.log(`✅ TJMG BrowserQL: ${resultados.length} resultados`);

    return new Response(
      JSON.stringify({
        success: true,
        resultados: resultados,
        total: resultados.length,
        pagina: pagina,
        fonte: 'TJMG BrowserQL',
        tribunal: 'TJMG',
        termo: termo,
        captchaResolvido: captchaInfo?.solved || false
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("❌ Erro na busca TJMG:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        detalhes: "Erro ao buscar jurisprudência no TJMG"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function parsearResultadosTJMG(bodyText: string): JurisprudenciaResult[] {
  const results: JurisprudenciaResult[] = [];
  
  const blocos = bodyText.split(/(?=\d+\.\d+\.\d+\.\d+-\d+|Processo\s*:|Número\s*:)/gi);
  
  for (const bloco of blocos) {
    if (bloco.length < 30) continue;
    
    let numeroProcesso = '';
    const numMatch = bloco.match(/(\d+\.\d+\.\d+\.\d+-\d+\/\d+)/) ||
                     bloco.match(/(\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4})/) ||
                     bloco.match(/(?:Processo|Número)\s*:\s*([\d\.\-\/]+)/i);
    if (numMatch) {
      numeroProcesso = (numMatch[1] || numMatch[0]).trim();
    } else {
      continue;
    }
    
    let classe = '';
    const classeMatch = bloco.match(/(?:Natureza|Classe|Tipo)\s*:\s*([^\n]+)/i) ||
                        bloco.match(/(?:APELAÇÃO|AGRAVO|RECURSO|MANDADO|HABEAS)\s+[^\n]*/i);
    if (classeMatch) classe = (classeMatch[1] || classeMatch[0]).trim().substring(0, 100);
    
    let relator = '';
    const relatorMatch = bloco.match(/Relator[a-z]*\s*[:\(]?\s*(?:Des\.?|Dr\.?)?\s*([^\n\)]+)/i);
    if (relatorMatch) relator = relatorMatch[1].trim().substring(0, 100);
    
    let orgaoJulgador = '';
    const orgaoMatch = bloco.match(/(?:Órgão|Câmara|Turma|Seção)\s*[^:]*:\s*([^\n]+)/i);
    if (orgaoMatch) orgaoJulgador = orgaoMatch[1].trim().substring(0, 100);
    
    let dataJulgamento = '';
    const dataMatch = bloco.match(/(?:Data[^:]*Julg|Julgamento|Data)\s*:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dataMatch) dataJulgamento = dataMatch[1];
    
    let ementa = '';
    const ementaMatch = bloco.match(/(?:Ementa|EMENTA)[:\s-]*([\s\S]{30,2000}?)(?=(?:Inteiro|Acórdão|Relator|Data|Órgão|$))/i);
    if (ementaMatch) {
      ementa = ementaMatch[1].replace(/\s+/g, ' ').trim();
    } else {
      const idx = bloco.indexOf(numeroProcesso);
      if (idx !== -1 && bloco.length > idx + 50) {
        ementa = bloco.substring(idx + numeroProcesso.length).replace(/\s+/g, ' ').trim().substring(0, 500);
      }
    }
    
    if (numeroProcesso && ementa.length > 20) {
      results.push({
        id: 'tjmg_' + numeroProcesso.replace(/[^\w]/g, '_'),
        numeroProcesso,
        classe: classe || 'Acórdão',
        relator: relator || 'Não informado',
        orgaoJulgador: orgaoJulgador || 'TJMG',
        dataJulgamento: dataJulgamento || '',
        ementa: ementa.substring(0, 500) + (ementa.length > 500 ? '...' : ''),
        ementaOriginal: ementa,
        tribunal: 'TJMG',
        fonte: 'TJMG BrowserQL',
        linkInteiroTeor: 'https://www5.tjmg.jus.br/jurisprudencia/'
      });
    }
  }
  
  // Deduplicate
  const seen = new Set<string>();
  return results.filter(r => {
    if (seen.has(r.numeroProcesso)) return false;
    seen.add(r.numeroProcesso);
    return true;
  }).slice(0, 50);
}

async function tentarMetodoPuppeteer(
  apiKey: string, 
  termo: string, 
  pagina: number,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const puppeteerScript = `
      export default async function({ page }) {
        const searchUrl = 'https://www5.tjmg.jus.br/jurisprudencia/formEspelhoAcordao.do';
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });
        await new Promise(r => setTimeout(r, 2000));
        
        const searchTerm = ${JSON.stringify(termo)};
        
        const inputFound = await page.$('input[name="palavras"]');
        if (!inputFound) {
          return { success: false, error: 'Campo de busca não encontrado', resultados: [] };
        }
        
        await inputFound.click({ clickCount: 3 });
        await new Promise(r => setTimeout(r, 200));
        await inputFound.type(searchTerm, { delay: 30 });
        await new Promise(r => setTimeout(r, 500));
        
        const pesquisarBtn = await page.$('input[name="pesquisaPalavras"]');
        if (pesquisarBtn) {
          await pesquisarBtn.click();
        } else {
          const allBtns = await page.$$('input[value="Pesquisar"]');
          if (allBtns.length >= 2) await allBtns[1].click();
          else if (allBtns.length === 1) await allBtns[0].click();
        }
        
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
        } catch (e) {}
        
        await new Promise(r => setTimeout(r, 3000));
        
        const bodyText = await page.evaluate(() => document.body.innerText);
        
        if (bodyText.toLowerCase().includes('digite os números') || 
            bodyText.toLowerCase().includes('captcha')) {
          return { 
            success: true, 
            captchaDetectado: true,
            resultados: [],
            total: 0
          };
        }
        
        return {
          success: true,
          bodyText: bodyText,
          pagina: ${pagina}
        };
      }
    `;

    const browserlessUrl = `https://chrome.browserless.io/function?token=${apiKey}&stealth`;
    
    console.log('📡 Chamando Puppeteer Stealth...');
    
    const response = await fetch(browserlessUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/javascript' },
      body: puppeteerScript
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Puppeteer error:', response.status, errorText);
      throw new Error(`Puppeteer failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('📊 Puppeteer result:', result.captchaDetectado ? 'CAPTCHA' : `${result.bodyText?.length || 0} chars`);
    
    if (result.captchaDetectado) {
      return new Response(
        JSON.stringify({
          success: true,
          resultados: [],
          total: 0,
          pagina: pagina,
          fonte: 'TJMG Puppeteer',
          tribunal: 'TJMG',
          termo: termo,
          captchaDetectado: true,
          mensagem: 'O TJMG exige verificação CAPTCHA.',
          linkDireto: 'https://www5.tjmg.jus.br/jurisprudencia/formEspelhoAcordao.do'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const resultados = parsearResultadosTJMG(result.bodyText || '');
    
    console.log(`✅ TJMG Puppeteer: ${resultados.length} resultados`);
    
    return new Response(
      JSON.stringify({
        success: true,
        resultados: resultados,
        total: resultados.length,
        pagina: pagina,
        fonte: 'TJMG Puppeteer',
        tribunal: 'TJMG',
        termo: termo
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error('❌ Erro Puppeteer:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Não foi possível buscar no TJMG',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
        linkDireto: 'https://www5.tjmg.jus.br/jurisprudencia/formEspelhoAcordao.do'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}
