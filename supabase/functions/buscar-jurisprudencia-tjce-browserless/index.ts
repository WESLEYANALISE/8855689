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
  ementaOriginal: string;
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

    console.log(`[TJCE Browserless] Iniciando busca por: "${termo}", página: ${pagina}`);

    // Script Puppeteer para SJURIS do TJCE - ES Module format
    const puppeteerScript = `
export default async function ({ page }) {
  const termo = ${JSON.stringify(termo)};
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1400, height: 900 });
  
  console.log('[TJCE] Navegando para SJURIS...');
  await page.goto('https://sjuris.tjce.jus.br/tela-consulta', {
    waitUntil: 'networkidle0',
    timeout: 60000
  });
  
  console.log('[TJCE] Aguardando Angular carregar...');
  await new Promise(r => setTimeout(r, 6000));
  
  // Localizar e preencher o campo de busca
  const inputSelectors = ['input[type="text"]', 'input.mat-input-element', 'textarea', 'input'];
  let inputFound = false;
  
  for (const selector of inputSelectors) {
    try {
      const input = await page.$(selector);
      if (input) {
        await input.click();
        await new Promise(r => setTimeout(r, 300));
        await input.type(termo, { delay: 30 });
        inputFound = true;
        console.log('[TJCE] Campo preenchido: ' + selector);
        break;
      }
    } catch (e) {}
  }
  
  if (!inputFound) {
    return { resultados: [], total: 0, erro: 'Campo de busca não encontrado' };
  }
  
  await new Promise(r => setTimeout(r, 800));
  
  // Clicar no botão de busca
  const buttonSelectors = ['button.mat-button', 'button.mat-raised-button', 'button[type="submit"]', 'button'];
  let clicked = false;
  
  for (const selector of buttonSelectors) {
    try {
      const buttons = await page.$$(selector);
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent || '', btn);
        if (text.toLowerCase().includes('pesquis') || text.toLowerCase().includes('buscar')) {
          await btn.click();
          clicked = true;
          console.log('[TJCE] Botão clicado: ' + text.trim());
          break;
        }
      }
      if (clicked) break;
    } catch (e) {}
  }
  
  if (!clicked) {
    await page.keyboard.press('Enter');
    console.log('[TJCE] Enter pressionado');
  }
  
  // Aguardar resultados carregarem
  console.log('[TJCE] Aguardando resultados...');
  await new Promise(r => setTimeout(r, 8000));
  
  // Extrair HTML completo para parsing mais preciso
  const html = await page.content();
  console.log('[TJCE] HTML obtido, tamanho: ' + html.length);
  
  // Extrair resultados de forma mais precisa
  const resultados = await page.evaluate(() => {
    const items = [];
    
    // Procurar blocos de resultados - cada acórdão/decisão
    const blocosTexto = document.body.innerText;
    
    // Regex para encontrar cada resultado individual
    // Formato: Processo: XXXXX...Órgão julgador:...Relator(a)/Magistrado(a):...Ementa:...
    const blocoRegex = /Processo:\\s*([\\d\\.\\/-]+)[\\s\\S]*?(?:Órgão julgador|Orgão julgador):\\s*([^\\n]+)[\\s\\S]*?(?:Relator\\(a\\)\\/Magistrado\\(a\\)|Relator):\\s*([^\\n]+)[\\s\\S]*?(?:Julgamento|Data):\\s*(\\d{2}\\/\\d{2}\\/\\d{4})[\\s\\S]*?Ementa:\\s*([\\s\\S]+?)(?=Processo:|$)/gi;
    
    let match;
    let index = 0;
    
    while ((match = blocoRegex.exec(blocosTexto)) !== null && index < 20) {
      const numeroProcesso = match[1].trim();
      const orgaoJulgador = match[2].trim();
      const relator = match[3].trim();
      const dataJulgamento = match[4];
      const ementaCompleta = match[5].trim();
      
      // Extrair classe do início da ementa
      let classe = '';
      const classeMatch = ementaCompleta.match(/^(?:EMENTA:\\s*)?((?:[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]+\\s*)+)/i);
      if (classeMatch) {
        const primeirasPalavras = classeMatch[1].split(/[.!]/).filter(p => p.trim())[0];
        if (primeirasPalavras && primeirasPalavras.length < 100) {
          classe = primeirasPalavras.trim();
        }
      }
      
      if (numeroProcesso && ementaCompleta.length > 50) {
        items.push({
          id: 'TJCE_' + numeroProcesso.replace(/[^0-9]/g, '') + '_' + index,
          numeroProcesso,
          classe: classe || 'Acórdão',
          relator: relator.replace(/^[:\\s]+/, '').trim(),
          orgaoJulgador: orgaoJulgador.replace(/^[:\\s]+/, '').trim(),
          dataJulgamento,
          dataRegistro: null,
          ementa: ementaCompleta.substring(0, 500).replace(/\\s+/g, ' ').trim(),
          ementaOriginal: ementaCompleta.replace(/\\s+/g, ' ').trim(),
          linkInteiroTeor: 'https://sjuris.tjce.jus.br/tela-consulta',
          tribunal: 'TJCE',
          fonte: 'SJURIS (Browserless)'
        });
        index++;
      }
    }
    
    // Se não encontrou com o regex principal, tentar extração alternativa
    if (items.length === 0) {
      // Procurar padrões individuais
      const processos = blocosTexto.match(/Processo:\\s*[\\d\\.\\/-]+/gi) || [];
      const relatores = blocosTexto.match(/(?:Relator\\(a\\)\\/Magistrado\\(a\\)|Relator)[:\\s]*[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\\s]+(?=Origem|Julgamento|\\n)/gi) || [];
      const orgaos = blocosTexto.match(/(?:Órgão julgador|Orgão julgador)[:\\s]*[^\\n]+/gi) || [];
      const datas = blocosTexto.match(/Julgamento[:\\s]*\\d{2}\\/\\d{2}\\/\\d{4}/gi) || [];
      const ementas = blocosTexto.match(/Ementa[:\\s]*[^]+?(?=Processo:|$)/gi) || [];
      
      for (let i = 0; i < Math.min(processos.length, 10); i++) {
        const numProc = processos[i]?.replace(/Processo:\\s*/i, '').trim() || '';
        const rel = relatores[i]?.replace(/(?:Relator\\(a\\)\\/Magistrado\\(a\\)|Relator)[:\\s]*/i, '').trim() || 'N/A';
        const org = orgaos[i]?.replace(/(?:Órgão julgador|Orgão julgador)[:\\s]*/i, '').trim() || 'N/A';
        const dt = datas[i]?.replace(/Julgamento[:\\s]*/i, '').trim() || null;
        const em = ementas[i]?.replace(/Ementa[:\\s]*/i, '').trim() || '';
        
        if (numProc && em.length > 30) {
          items.push({
            id: 'TJCE_' + numProc.replace(/[^0-9]/g, '') + '_' + i,
            numeroProcesso: numProc,
            classe: 'Acórdão',
            relator: rel,
            orgaoJulgador: org,
            dataJulgamento: dt,
            dataRegistro: null,
            ementa: em.substring(0, 500).replace(/\\s+/g, ' ').trim(),
            ementaOriginal: em.replace(/\\s+/g, ' ').trim(),
            linkInteiroTeor: 'https://sjuris.tjce.jus.br/tela-consulta',
            tribunal: 'TJCE',
            fonte: 'SJURIS (Browserless)'
          });
        }
      }
    }
    
    // Remover duplicados
    const seen = new Set();
    return items.filter(item => {
      if (seen.has(item.numeroProcesso)) return false;
      seen.add(item.numeroProcesso);
      return true;
    });
  });
  
  // Extrair total
  const total = await page.evaluate(() => {
    const text = document.body.innerText;
    const totalMatch = text.match(/(\\d+(?:\\.\\d+)?)\\s*resultado/i);
    return totalMatch ? parseInt(totalMatch[1].replace('.', ''), 10) : 0;
  });
  
  console.log('[TJCE] Encontrados ' + resultados.length + ' resultados, total estimado: ' + total);
  
  return { resultados, total: total || resultados.length };
}
`;

    const browserlessResponse = await fetch('https://production-sfo.browserless.io/function?token=' + BROWSERLESS_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/javascript' },
      body: puppeteerScript,
    });

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      console.error('[TJCE Browserless] Erro na API:', errorText);
      throw new Error(`Browserless API error: ${browserlessResponse.status} - ${errorText}`);
    }

    const result = await browserlessResponse.json();
    console.log(`[TJCE Browserless] Resultado:`, JSON.stringify(result).substring(0, 500));

    const resultados: JurisprudenciaResult[] = result.resultados || [];
    const total = result.total || 0;

    return new Response(
      JSON.stringify({
        success: true,
        resultados,
        total,
        pagina,
        termo,
        fonte: 'SJURIS via Browserless'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[TJCE Browserless] Erro:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao buscar jurisprudência',
        detalhes: 'Falha na automação do navegador para TJCE'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
