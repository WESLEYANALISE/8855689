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
  tema?: string;
  tese?: string;
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

    console.log(`[STJ Browserless] Iniciando busca por: "${termo}", página: ${pagina}`);

    // Script Puppeteer com navegação natural pelo portal STJ
    // Fluxo: Portal STJ → Menu Jurisprudência → Aguardar Cloudflare → Pesquisar
    const puppeteerScript = `
      export default async function({ page }) {
        const termo = ${JSON.stringify(termo)};
        const paginaAtual = ${pagina};
        
        // Configurar navegador para parecer real (anti-detecção)
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Configurar headers extras para parecer navegador real
        await page.setExtraHTTPHeaders({
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"'
        });
        
        // ===========================================
        // ETAPA 1: Acessar portal principal do STJ
        // ===========================================
        console.log('[STJ] ETAPA 1: Acessando portal principal www.stj.jus.br...');
        await page.goto('https://www.stj.jus.br', {
          waitUntil: 'networkidle2',
          timeout: 90000
        });
        
        // Aguardar página carregar e possível verificação Cloudflare
        console.log('[STJ] Aguardando carregamento inicial e possível Cloudflare...');
        await new Promise(r => setTimeout(r, 8000));
        
        // Verificar se está em página de desafio Cloudflare
        let pageContent = await page.evaluate(() => document.body.innerText || '');
        if (pageContent.includes('Checking your browser') || 
            pageContent.includes('Verificação') ||
            pageContent.includes('Ray ID') ||
            pageContent.includes('cloudflare')) {
          console.log('[STJ] Detectado desafio Cloudflare, aguardando resolução...');
          await new Promise(r => setTimeout(r, 15000));
        }
        
        console.log('[STJ] Portal principal carregado. URL:', page.url());
        
        // ===========================================
        // ETAPA 2: Localizar e clicar em "Jurisprudência no STJ"
        // ===========================================
        console.log('[STJ] ETAPA 2: Buscando link para Jurisprudência...');
        
        // Mover mouse de forma natural (simular usuário)
        await page.mouse.move(500, 300);
        await new Promise(r => setTimeout(r, 500));
        
        // Procurar o link de Jurisprudência
        const jurisprudenciaClicado = await page.evaluate(() => {
          // Procurar por diferentes padrões de link
          const links = Array.from(document.querySelectorAll('a'));
          
          for (const link of links) {
            const texto = (link.textContent || '').toLowerCase();
            const href = (link.getAttribute('href') || '').toLowerCase();
            
            // Priorizar link direto para SCON
            if (href.includes('scon.stj.jus.br')) {
              link.click();
              return { encontrado: true, tipo: 'link direto SCON' };
            }
          }
          
          // Tentar encontrar menu de Jurisprudência
          for (const link of links) {
            const texto = (link.textContent || '').toLowerCase();
            if (texto.includes('jurisprudência') || texto.includes('jurisprudencia')) {
              link.click();
              return { encontrado: true, tipo: 'menu jurisprudência' };
            }
          }
          
          return { encontrado: false };
        });
        
        if (jurisprudenciaClicado.encontrado) {
          console.log('[STJ] Clicado em:', jurisprudenciaClicado.tipo);
          await new Promise(r => setTimeout(r, 3000));
          
          // Se foi menu, procurar submenu "Jurisprudência no STJ"
          const submenuClicado = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            for (const link of links) {
              const texto = (link.textContent || '').toLowerCase();
              const href = (link.getAttribute('href') || '').toLowerCase();
              if (href.includes('scon.stj.jus.br') || texto.includes('jurisprudência no stj')) {
                link.click();
                return true;
              }
            }
            return false;
          });
          
          if (submenuClicado) {
            console.log('[STJ] Submenu clicado, navegando para SCON...');
          }
        } else {
          // Fallback: ir direto para SCON
          console.log('[STJ] Link não encontrado, navegando direto para SCON...');
        }
        
        // Navegar direto para SCON (mais confiável)
        console.log('[STJ] Navegando para SCON (pesquisa de jurisprudência)...');
        await page.goto('https://scon.stj.jus.br/SCON/', {
          waitUntil: 'networkidle2',
          timeout: 90000
        });
        
        // ===========================================
        // ETAPA 3: Aguardar verificação Cloudflare na página SCON
        // ===========================================
        console.log('[STJ] ETAPA 3: Aguardando verificação Cloudflare no SCON...');
        await new Promise(r => setTimeout(r, 10000));
        
        // Verificar se passou do Cloudflare
        pageContent = await page.evaluate(() => document.body.innerText || '');
        let tentativas = 0;
        while ((pageContent.includes('Checking your browser') || 
                pageContent.includes('Verificação') ||
                pageContent.includes('Ray ID') ||
                pageContent.includes('Just a moment')) && tentativas < 5) {
          console.log('[STJ] Cloudflare ainda ativo, aguardando mais... (tentativa ' + (tentativas + 1) + ')');
          await new Promise(r => setTimeout(r, 5000));
          pageContent = await page.evaluate(() => document.body.innerText || '');
          tentativas++;
        }
        
        console.log('[STJ] Página SCON carregada. URL:', page.url());
        
        // ===========================================
        // ETAPA 4: Realizar a pesquisa
        // ===========================================
        console.log('[STJ] ETAPA 4: Realizando pesquisa...');
        
        // Aguardar DOM estabilizar
        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));
        
        // Seletores do campo de busca
        const inputSelectors = [
          '#pesquisaLivre',
          'input[name="pesquisaLivre"]',
          'input.form-control.form-control-lg',
          'input[placeholder*="critério"]',
          '.input-group input.form-control',
          'input[type="text"]'
        ];
        
        let inputFound = null;
        for (const sel of inputSelectors) {
          try {
            const exists = await page.$(sel);
            if (exists) {
              const isVisible = await page.evaluate(el => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
              }, exists);
              if (isVisible) {
                inputFound = sel;
                console.log('[STJ] Campo de busca encontrado:', sel);
                break;
              }
            }
          } catch (e) {}
        }
        
        if (!inputFound) {
          // Segunda tentativa com espera
          console.log('[STJ] Campo não encontrado, aguardando mais...');
          await new Promise(r => setTimeout(r, 5000));
          
          for (const sel of inputSelectors) {
            try {
              await page.waitForSelector(sel, { visible: true, timeout: 8000 });
              inputFound = sel;
              console.log('[STJ] Campo encontrado após espera:', sel);
              break;
            } catch (e) {}
          }
        }
        
        if (!inputFound) {
          // Capturar informações para debug
          const debugInfo = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input'));
            return {
              url: window.location.href,
              title: document.title,
              inputsCount: inputs.length,
              inputs: inputs.slice(0, 5).map(i => ({
                id: i.id,
                name: i.name,
                type: i.type,
                placeholder: i.placeholder,
                className: i.className
              })),
              bodyText: document.body.innerText.substring(0, 1000)
            };
          });
          console.log('[STJ] Debug info:', JSON.stringify(debugInfo));
          throw new Error('Campo de busca nao encontrado. Possível bloqueio Cloudflare ou mudança no site.');
        }
        
        // Clicar e preencher o campo
        await page.click(inputFound);
        await new Promise(r => setTimeout(r, 500));
        
        // Limpar campo
        await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el) el.value = '';
        }, inputFound);
        
        // Digitar termo com delay natural
        await page.type(inputFound, termo, { delay: 80 });
        console.log('[STJ] Termo digitado: ' + termo);
        
        await new Promise(r => setTimeout(r, 1000));
        
        // Clicar no botão de pesquisa
        const buttonSelectors = [
          'button.icofont-ui-search',
          'button.input-group-text',
          '.input-group-append button',
          'button[type="submit"]',
          '.input-group-text.icofont-ui-search',
          'button.btn-lg'
        ];
        
        let buttonClicado = false;
        for (const selector of buttonSelectors) {
          try {
            const btn = await page.$(selector);
            if (btn) {
              const isVisible = await page.evaluate(el => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
              }, btn);
              if (isVisible) {
                await btn.click();
                buttonClicado = true;
                console.log('[STJ] Botão clicado:', selector);
                break;
              }
            }
          } catch (e) {}
        }
        
        if (!buttonClicado) {
          console.log('[STJ] Usando Enter como fallback');
          await page.keyboard.press('Enter');
        }
        
        // ===========================================
        // ETAPA 5: Aguardar e extrair resultados
        // ===========================================
        console.log('[STJ] ETAPA 5: Aguardando resultados...');
        
        try {
          await page.waitForSelector('.clsDocTitulo, .documento, .docTexto, #idDivDocumentos, .clsTextoDoc, .numResultados', { 
            timeout: 60000 
          });
          console.log('[STJ] Resultados carregados');
        } catch (e) {
          console.log('[STJ] Timeout aguardando resultados, tentando extrair mesmo assim...');
        }
        
        await new Promise(r => setTimeout(r, 4000));
        
        console.log('[STJ] URL final:', page.url());
        
        // Paginação se necessário
        if (paginaAtual > 1) {
          console.log('[STJ] Navegando para página ' + paginaAtual);
          const pageLinks = await page.$$('a[href*="pagina"], .paginacao a, [class*="page"] a, .pagination a');
          for (const link of pageLinks) {
            const text = await page.evaluate(el => el.textContent, link);
            if (text && text.trim() === String(paginaAtual)) {
              await link.click();
              await new Promise(r => setTimeout(r, 5000));
              break;
            }
          }
        }
        
        console.log('[STJ] Extraindo dados...');
        
        // Extrair resultados
        const resultados = await page.evaluate(() => {
          const items = [];
          
          // Seletores para os resultados do STJ
          const rows = document.querySelectorAll('.documento, .docTitulo, .clsDocTitulo, [class*="resultado"]:not(.numResultados), .julgado, #divDocumento > div, article, .listadocumentos > div, .docTexto');
          
          console.log('[STJ] Encontradas ' + rows.length + ' linhas de resultado');
          
          if (rows.length > 0) {
            rows.forEach((row, index) => {
              try {
                const rowText = row.textContent || '';
                
                if (rowText.length < 50) return;
                
                // Extrair número do processo
                let numeroProcesso = '';
                const processoLink = row.querySelector('a[href*="processo"], a[href*="doc"], a[id*="processo"]');
                if (processoLink) {
                  numeroProcesso = processoLink.textContent?.trim() || '';
                }
                if (!numeroProcesso) {
                  const processoMatch = rowText.match(/(?:REsp|AgRg|HC|MS|RHC|CC|AgInt|EDcl|RMS|MC|Pet|QO|SE|AREsp|Rcl|EREsp|EAREsp)\\s*[\\d.\\/\\-]+/i);
                  if (processoMatch) numeroProcesso = processoMatch[0];
                }
                
                // Extrair classe
                let classe = '';
                const classeMatch = rowText.match(/(?:Recurso Especial|Habeas Corpus|Mandado de Segurança|Agravo|Embargos|Conflito de Competência|Reclamação)/i);
                if (classeMatch) classe = classeMatch[0];
                else if (numeroProcesso) {
                  classe = numeroProcesso.split(/\\s/)[0];
                }
                
                // Extrair relator
                let relator = '';
                const relatorMatch = rowText.match(/(?:Relator|Rel\\.|Min\\.|Ministr[oa])\\s*:?\\s*([^\\n,;()]+)/i);
                if (relatorMatch) {
                  relator = relatorMatch[1].trim()
                    .replace(/^(?:Min\\.?|Ministr[oa])\\s*/i, '')
                    .replace(/\\s+$/, '');
                }
                
                // Extrair órgão julgador
                let orgaoJulgador = '';
                const orgaoMatch = rowText.match(/(?:Órgão\\s*Julgador|Turma|Seção|Corte\\s*Especial)\\s*:?\\s*([^\\n,;]+)/i);
                if (orgaoMatch) orgaoJulgador = orgaoMatch[1].trim();
                if (!orgaoJulgador) {
                  const turmaMatch = rowText.match(/((?:PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA|QUINTA|SEXTA)\\s*TURMA|CORTE ESPECIAL|(?:PRIMEIRA|SEGUNDA|TERCEIRA)\\s*SE[ÇC][ÃA]O)/i);
                  if (turmaMatch) orgaoJulgador = turmaMatch[1];
                }
                
                // Extrair datas
                let dataJulgamento = null;
                const dataJulgMatch = rowText.match(/(?:Julg(?:amento|\\.|:)?|Data\\s*(?:do)?\\s*Julg(?:amento)?)\\s*:?\\s*(\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{2,4})/i);
                if (dataJulgMatch) dataJulgamento = dataJulgMatch[1];
                
                let dataRegistro = null;
                const dataRegMatch = rowText.match(/(?:Publica[çc][ãa]o|DJe|DJU|Registro)\\s*:?\\s*(\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{2,4})/i);
                if (dataRegMatch) dataRegistro = dataRegMatch[1];
                
                // Extrair ementa
                let ementa = '';
                const ementaEl = row.querySelector('.ementa, [class*="ementa"], .docTexto, .clsDocTexto');
                if (ementaEl) {
                  ementa = ementaEl.textContent?.trim() || '';
                }
                if (!ementa) {
                  const ementaMatch = rowText.match(/(?:EMENTA|Ementa)[:\\s]*([\\s\\S]+?)(?:ACÓRDÃO|Relator|Órgão|Decisão|Vistos|$)/i);
                  if (ementaMatch) ementa = ementaMatch[1].trim();
                }
                if (!ementa && rowText.length > 100) {
                  ementa = rowText.substring(0, 3000);
                }
                
                // Extrair link
                let link = '';
                const linkEl = row.querySelector('a[href*="jurisprudencia"], a[href*="processo"], a[href*="documento"], a[id*="processo"]');
                if (linkEl) {
                  link = linkEl.getAttribute('href') || '';
                  if (link && !link.startsWith('http')) {
                    link = 'https://scon.stj.jus.br' + link;
                  }
                }
                
                // Extrair tema repetitivo
                let tema = '';
                const temaMatch = rowText.match(/Tema\\s*(\\d+)|Repetitivo\\s*(?:Tema)?\\s*(\\d+)/i);
                if (temaMatch) tema = 'Tema ' + (temaMatch[1] || temaMatch[2]);
                
                // Extrair tese
                let tese = '';
                const teseMatch = rowText.match(/(?:Tese|TESE)[:\\s]*([\\s\\S]+?)(?:Ementa|Acórdão|$)/i);
                if (teseMatch) tese = teseMatch[1].trim();
                
                if (numeroProcesso || ementa) {
                  items.push({
                    id: 'STJ_' + (numeroProcesso || index).toString().replace(/[^0-9A-Z]/gi, '') + '_' + index,
                    numeroProcesso: numeroProcesso || 'N/A',
                    classe: classe || 'N/A',
                    relator: relator || 'N/A',
                    orgaoJulgador: orgaoJulgador || 'N/A',
                    dataJulgamento,
                    dataRegistro,
                    ementa: ementa.substring(0, 5000),
                    linkInteiroTeor: link || 'https://scon.stj.jus.br/SCON/',
                    tribunal: 'STJ',
                    fonte: 'STJ (Browserless)',
                    tema: tema || undefined,
                    tese: tese ? tese.substring(0, 1500) : undefined
                  });
                }
              } catch (e) {
                console.error('[STJ] Erro processando linha:', e);
              }
            });
          }
          
          // Fallback: extrair do HTML bruto
          if (items.length === 0) {
            const mainContent = document.querySelector('#divDocumento, .documentos, .resultados, body');
            if (mainContent) {
              const text = mainContent.textContent || '';
              const acordaoMatches = text.split(/(?=(?:REsp|AgRg|HC|MS|RHC|CC|AgInt|EDcl|RMS|MC|Pet|QO|SE|AREsp|Rcl)\\s+\\d)/);
              
              acordaoMatches.forEach((match, index) => {
                if (match.trim() && match.length > 100) {
                  const numeroMatch = match.match(/^((?:REsp|AgRg|HC|MS|RHC|CC|AgInt|EDcl|RMS|MC|Pet|QO|SE|AREsp|Rcl)\\s*[\\d.\\/\\-]+)/i);
                  if (numeroMatch) {
                    items.push({
                      id: 'STJ_' + numeroMatch[1].replace(/[^0-9]/g, '') + '_' + index,
                      numeroProcesso: numeroMatch[1],
                      classe: numeroMatch[1].split(/\\s/)[0],
                      relator: 'N/A',
                      orgaoJulgador: 'N/A',
                      dataJulgamento: null,
                      dataRegistro: null,
                      ementa: match.substring(0, 3000),
                      linkInteiroTeor: 'https://scon.stj.jus.br/SCON/',
                      tribunal: 'STJ',
                      fonte: 'STJ (Browserless)'
                    });
                  }
                }
              });
            }
          }
          
          return items;
        });
        
        // Extrair total de resultados
        const total = await page.evaluate(() => {
          const totalSelectors = [
            '.numResultados',
            '[class*="total"]',
            '.resultado-info',
            '#spanTotalDocumentos',
            '.info-resultados'
          ];
          
          for (const sel of totalSelectors) {
            const el = document.querySelector(sel);
            if (el) {
              const match = el.textContent?.match(/(\\d+(?:\\.\\d+)?)/);
              if (match) return parseInt(match[1].replace(/\\./g, ''), 10);
            }
          }
          
          const bodyText = document.body.textContent || '';
          const totalMatch = bodyText.match(/(\\d+(?:\\.\\d+)?)\\s*(?:documento|resultado|registro|acórdão|julgado)/i);
          if (totalMatch) return parseInt(totalMatch[1].replace(/\\./g, ''), 10);
          return 0;
        });
        
        console.log('[STJ] Encontrados ' + resultados.length + ' resultados, total estimado: ' + total);
        
        if (resultados.length === 0) {
          const html = await page.evaluate(() => document.body.innerHTML.substring(0, 5000));
          console.log('[STJ] HTML parcial para debug:', html);
        }
        
        return { resultados, total: total || resultados.length };
      }
    `;

    // Usar endpoint /function do Browserless com stealth mode
    const browserlessResponse = await fetch(`https://chrome.browserless.io/function?token=${BROWSERLESS_API_KEY}&stealth=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/javascript',
      },
      body: puppeteerScript,
    });

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      console.error('[STJ Browserless] Erro na API:', errorText);
      throw new Error(`Browserless API error: ${browserlessResponse.status} - ${errorText}`);
    }

    const result = await browserlessResponse.json();
    console.log(`[STJ Browserless] Resultado:`, JSON.stringify(result).substring(0, 500));

    const resultados: JurisprudenciaResult[] = result.resultados || [];
    const total = result.total || 0;

    return new Response(
      JSON.stringify({
        success: true,
        resultados,
        total,
        pagina,
        termo,
        fonte: 'STJ via Browserless (Stealth)'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[STJ Browserless] Erro:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao buscar jurisprudência',
        detalhes: 'Falha na automação do navegador para o STJ. Possível bloqueio Cloudflare.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
