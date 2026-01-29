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

    console.log(`[STF Browserless] Iniciando busca por: "${termo}", página: ${pagina}`);

    // Script para o Browserless - usando formato correto para /function endpoint
    const code = `
      export default async function ({ page }) {
        const termo = ${JSON.stringify(termo)};
        const pagina = ${pagina};
        
        // Configurar navegador
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });
        
        console.log('Navegando para portal de jurisprudência do STF...');
        await page.goto('https://jurisprudencia.stf.jus.br/pages/search', {
          waitUntil: 'networkidle0',
          timeout: 90000
        });
        
        // Aguardar Angular carregar (app-root tem conteúdo)
        console.log('Aguardando Angular carregar...');
        await page.waitForFunction(() => {
          const appRoot = document.querySelector('app-root');
          return appRoot && appRoot.children.length > 0;
        }, { timeout: 30000 });
        
        // Aguardar um pouco mais para garantir que todos os componentes carregaram
        await new Promise(r => setTimeout(r, 5000));
        
        // Tirar screenshot para debug
        console.log('Buscando campo de pesquisa...');
        
        // Tentar múltiplos seletores para o campo de busca do STF
        const searchSelectors = [
          'input[formcontrolname="searchTerms"]',
          'input[name="searchTerms"]',
          'input[id="searchTerms"]',
          'input.form-control',
          'input[type="text"]',
          'input[type="search"]',
          'mat-form-field input',
          '.search-input input',
          'input'
        ];
        
        let searchInput = null;
        for (const selector of searchSelectors) {
          searchInput = await page.$(selector);
          if (searchInput) {
            console.log('Encontrado campo com seletor: ' + selector);
            break;
          }
        }
        
        if (!searchInput) {
          // Tentar encontrar qualquer input visível
          searchInput = await page.evaluateHandle(() => {
            const inputs = document.querySelectorAll('input');
            for (const input of inputs) {
              const rect = input.getBoundingClientRect();
              if (rect.width > 50 && rect.height > 10) {
                return input;
              }
            }
            return null;
          });
          
          if (!searchInput || !(await searchInput.asElement())) {
            throw new Error('Campo de busca não encontrado após tentativas');
          }
        }
        
        console.log('Preenchendo termo de busca: ' + termo);
        await searchInput.click();
        await new Promise(r => setTimeout(r, 500));
        await searchInput.type(termo, { delay: 50 });
        
        // Aguardar um pouco após digitar
        await new Promise(r => setTimeout(r, 1000));
        
        // Clicar no botão de pesquisa ou pressionar Enter
        console.log('Iniciando pesquisa...');
        const buttonSelectors = [
          'button[type="submit"]',
          'button.btn-primary',
          'button.search-button',
          'button[mat-raised-button]',
          '.btn-search',
          'button'
        ];
        
        let searchButton = null;
        for (const selector of buttonSelectors) {
          const buttons = await page.$$(selector);
          for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent?.toLowerCase() || '', btn);
            if (text.includes('pesquis') || text.includes('buscar') || text.includes('search')) {
              searchButton = btn;
              break;
            }
          }
          if (searchButton) break;
        }
        
        if (searchButton) {
          await searchButton.click();
        } else {
          await page.keyboard.press('Enter');
        }
        
        console.log('Aguardando resultados...');
        // Aguardar mudança na URL ou aparecimento de resultados
        await Promise.race([
          page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 45000 }),
          page.waitForFunction(() => {
            const body = document.body.textContent || '';
            return body.includes('resultado') || body.includes('acórdão') || body.includes('Ementa');
          }, { timeout: 45000 })
        ]).catch(() => console.log('Timeout esperando resultados, tentando extrair mesmo assim'));
        
        // Aguardar mais para garantir que os resultados renderizaram
        await new Promise(r => setTimeout(r, 5000));
        
        // Paginação se necessário
        if (pagina > 1) {
          console.log('Navegando para página ' + pagina);
          try {
            const pageLinks = await page.$$('a.page-link, button.page-link, [class*="pagination"] a, [class*="pagination"] button');
            for (const link of pageLinks) {
              const text = await page.evaluate(el => el.textContent?.trim(), link);
              if (text === String(pagina)) {
                await link.click();
                await new Promise(r => setTimeout(r, 3000));
                break;
              }
            }
          } catch (e) {
            console.log('Erro na paginação:', e);
          }
        }
        
        console.log('Extraindo dados da página...');
        
        // Extrair resultados
        const resultados = await page.evaluate(() => {
          const items = [];
          
          // Seletores mais abrangentes para resultados
          const resultSelectors = [
            '.search-result',
            '.result-item',
            '.julgado',
            '[class*="resultado"]',
            '.card',
            'article',
            '.list-group-item',
            'mat-card',
            '.mat-card'
          ];
          
          let rows = [];
          for (const selector of resultSelectors) {
            rows = document.querySelectorAll(selector);
            if (rows.length > 0) break;
          }
          
          // Se ainda não encontrou, tentar pelo texto
          if (rows.length === 0) {
            const allDivs = document.querySelectorAll('div');
            rows = Array.from(allDivs).filter(div => {
              const text = div.textContent || '';
              return (text.includes('Relator') || text.includes('EMENTA') || text.includes('Ementa')) && 
                     text.length > 100 && text.length < 10000;
            });
          }
          
          console.log('Encontradas ' + rows.length + ' linhas de resultado');
          
          rows.forEach((row, index) => {
            try {
              if (index >= 20) return; // Limitar a 20 resultados
              
              const rowText = row.textContent || '';
              if (rowText.length < 50) return; // Ignorar elementos muito pequenos
              
              // Extrair número do processo
              let numeroProcesso = '';
              const processoLink = row.querySelector('a[href*="processo"], a[href*="jurisprudencia"], a[href*="acordao"]');
              if (processoLink) {
                numeroProcesso = processoLink.textContent?.trim() || '';
              }
              if (!numeroProcesso) {
                const processoMatch = rowText.match(/(?:RE|ARE|ADI|ADC|ADPF|HC|MS|RHC|MI|Rcl|ACO|AI|AP|Ext|IF|PET|RCL|RMS|SL|SS|STA|STP|AO|AgR|ED)\\s*\\d+/i);
                if (processoMatch) numeroProcesso = processoMatch[0];
              }
              
              // Extrair classe
              let classe = '';
              const classeMatch = rowText.match(/(?:Recurso Extraordinário|Ação Direta|Habeas Corpus|Mandado de Segurança|Arguição|Reclamação|Recurso Ordinário|Agravo|Embargos|Ação Cível)/i);
              if (classeMatch) classe = classeMatch[0];
              
              // Extrair relator
              let relator = '';
              const relatorMatch = rowText.match(/(?:Relator|Relatora|Min\\.)\\s*:?\\s*(?:Min\\.?\\s*)?([A-ZÁÉÍÓÚÂÊÎÔÛÃÕ][a-záéíóúâêîôûãõ]+(?:\\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕ][a-záéíóúâêîôûãõ]+)*)/i);
              if (relatorMatch) relator = relatorMatch[1].trim();
              
              // Extrair órgão julgador
              let orgaoJulgador = '';
              if (rowText.includes('Plenário')) orgaoJulgador = 'Plenário';
              else if (rowText.includes('Primeira Turma') || rowText.includes('1ª Turma')) orgaoJulgador = 'Primeira Turma';
              else if (rowText.includes('Segunda Turma') || rowText.includes('2ª Turma')) orgaoJulgador = 'Segunda Turma';
              
              // Extrair datas
              let dataJulgamento = null;
              const dataMatch = rowText.match(/(\\d{1,2}[\\/\\.-]\\d{1,2}[\\/\\.-]\\d{2,4})/);
              if (dataMatch) dataJulgamento = dataMatch[1];
              
              // Extrair ementa
              let ementa = '';
              const ementaMatch = rowText.match(/(?:EMENTA|Ementa)\\s*:?\\s*([\\s\\S]+?)(?=(?:Decisão|Relator|Órgão|Acórdão|$))/i);
              if (ementaMatch) {
                ementa = ementaMatch[1].trim().substring(0, 2000);
              } else {
                // Pegar texto principal
                ementa = rowText.substring(0, 2000).trim();
              }
              
              // Extrair link
              let link = '';
              const linkEl = row.querySelector('a[href*="jurisprudencia"], a[href*="processo"], a[href*="acordao"]');
              if (linkEl) {
                link = linkEl.getAttribute('href') || '';
                if (link && !link.startsWith('http')) {
                  link = 'https://jurisprudencia.stf.jus.br' + link;
                }
              }
              
              // Extrair tema
              let tema = '';
              const temaMatch = rowText.match(/Tema\\s*(\\d+)/i);
              if (temaMatch) tema = 'Tema ' + temaMatch[1];
              
              if (numeroProcesso || (ementa && ementa.length > 50)) {
                items.push({
                  id: 'STF_' + (numeroProcesso || 'R' + index).replace(/[^0-9A-Za-z]/g, ''),
                  numeroProcesso: numeroProcesso || 'N/A',
                  classe: classe || 'N/A',
                  relator: relator || 'N/A',
                  orgaoJulgador: orgaoJulgador || 'N/A',
                  dataJulgamento,
                  dataRegistro: null,
                  ementa: ementa,
                  linkInteiroTeor: link || 'https://jurisprudencia.stf.jus.br',
                  tribunal: 'STF',
                  fonte: 'STF (Browserless)',
                  tema: tema || undefined
                });
              }
            } catch (e) {
              console.error('Erro processando linha:', e);
            }
          });
          
          return items;
        });
        
        // Extrair total de resultados
        const total = await page.evaluate(() => {
          const bodyText = document.body.textContent || '';
          const totalMatches = [
            bodyText.match(/(\\d+(?:\\.\\d+)?)\\s*resultado/i),
            bodyText.match(/(\\d+(?:\\.\\d+)?)\\s*acórdão/i),
            bodyText.match(/encontrado[s]?\\s*:?\\s*(\\d+)/i)
          ];
          for (const match of totalMatches) {
            if (match) {
              return parseInt(match[1].replace(/\\./g, ''), 10);
            }
          }
          return 0;
        });
        
        console.log('Extraídos ' + resultados.length + ' resultados, total estimado: ' + total);
        
        return { resultados, total: total || resultados.length };
      }
    `;

    // Chamar API do Browserless /function com formato ESM
    const browserlessResponse = await fetch('https://production-sfo.browserless.io/function?token=' + BROWSERLESS_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/javascript',
      },
      body: code,
    });

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      console.error('[STF Browserless] Erro na API:', errorText);
      throw new Error(`Browserless API error: ${browserlessResponse.status} - ${errorText}`);
    }

    const result = await browserlessResponse.json();
    console.log(`[STF Browserless] Resultado:`, JSON.stringify(result).substring(0, 500));

    const resultados: JurisprudenciaResult[] = result.resultados || [];
    const total = result.total || 0;

    return new Response(
      JSON.stringify({
        success: true,
        resultados,
        total,
        pagina,
        termo,
        fonte: 'STF via Browserless'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[STF Browserless] Erro:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao buscar jurisprudência',
        detalhes: 'Falha na automação do navegador para o STF'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
