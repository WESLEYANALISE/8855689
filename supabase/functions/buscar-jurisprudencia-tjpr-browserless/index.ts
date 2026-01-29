import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface JurisprudenciaResult {
  id: string;
  numeroProcesso: string;
  classe: string;
  tipoDecisao: string; // Decisão Monocrática, Acórdão, etc.
  assuntoPrincipal?: string;
  relator: string;
  orgaoJulgador: string;
  dataJulgamento: string;
  dataRegistro?: string;
  ementa: string;
  ementaOriginal?: string;
  resultado?: string;
  tribunal: string;
  linkInteiroTeor?: string;
  integraAcordao?: string;
  citacaoFormatada?: string;
  comarca?: string;
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

    console.log(`🔍 Buscando no TJPR via Browserless: "${termo}" (página ${pagina})`);

    // Script Puppeteer para o TJPR com checkbox "MOSTRAR ITENS COMPLETOS"
    const puppeteerScript = `
      export default async function({ page }) {
        const searchUrl = 'https://portal.tjpr.jus.br/jurisprudencia/';
        
        console.log('Navegando para TJPR:', searchUrl);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await page.setViewport({ width: 1280, height: 2000 });
        
        await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 60000 });
        await new Promise(r => setTimeout(r, 2000));
        
        // IMPORTANTE: Marcar checkbox "MOSTRAR ITENS COMPLETOS" antes de pesquisar
        console.log('Procurando checkbox "Mostrar Itens Completos"...');
        const checkboxMarked = await page.evaluate(() => {
          // Tentar diferentes seletores para o checkbox
          const selectors = [
            '#mostrarCompleto',
            'input[name="mostrarCompleto"]',
            'input[type="checkbox"][id*="completo"]',
            'input[type="checkbox"][name*="completo"]',
            'input[type="checkbox"][id*="mostrar"]'
          ];
          
          for (const sel of selectors) {
            const checkbox = document.querySelector(sel);
            if (checkbox && !checkbox.checked) {
              checkbox.click();
              console.log('Checkbox marcado:', sel);
              return true;
            } else if (checkbox && checkbox.checked) {
              console.log('Checkbox já estava marcado:', sel);
              return true;
            }
          }
          
          // Tentar encontrar por label
          const labels = document.querySelectorAll('label');
          for (const label of labels) {
            if (label.textContent && label.textContent.toLowerCase().includes('mostrar') && 
                label.textContent.toLowerCase().includes('completo')) {
              const checkbox = label.querySelector('input[type="checkbox"]') || 
                               document.getElementById(label.getAttribute('for') || '');
              if (checkbox && !checkbox.checked) {
                checkbox.click();
                console.log('Checkbox marcado via label');
                return true;
              }
            }
          }
          
          return false;
        });
        
        console.log('Checkbox marcado:', checkboxMarked);
        await new Promise(r => setTimeout(r, 500));
        
        // Preencher campo de busca
        const searchTerm = ${JSON.stringify(termo)};
        const inputSelectors = [
          'input[name*="pesquisa"]',
          'input[name*="termo"]',
          'input#txtPesquisa',
          'input[type="text"]',
          'input[placeholder*="pesquisa"]',
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
          'button[type="submit"]',
          'input[type="submit"]',
          'input[value*="Pesquisar"]',
          'a.btn-pesquisar',
          '.btn-search'
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
        
        // Extrair resultados isolando cada bloco de jurisprudência
        console.log('Extraindo resultados com isolamento de blocos...');
        
        const resultados = await page.evaluate(() => {
          const results = [];
          const bodyHtml = document.body.innerHTML;
          
          // Estratégia 1: Encontrar blocos de resultados estruturados
          // No TJPR, cada resultado geralmente está em uma table, tr, ou div específica
          const blocosResultado = [];
          
          // Tentar encontrar containers de resultado
          const containerSelectors = [
            '.resultado-jurisprudencia',
            '.item-resultado',
            'table.resultTable tr',
            'div[id*="resultado"]',
            '.jurisprudencia-item',
            'li[class*="resultado"]'
          ];
          
          let containers = [];
          for (const sel of containerSelectors) {
            containers = document.querySelectorAll(sel);
            if (containers.length > 0) {
              console.log('Containers encontrados com:', sel, containers.length);
              break;
            }
          }
          
          // Se encontrou containers estruturados, usar eles
          if (containers.length > 0) {
            containers.forEach(container => {
              blocosResultado.push(container.innerText);
            });
          } else {
            // Estratégia 2: Dividir por número de processo CNJ
            const bodyText = document.body.innerText;
            const processoPattern = /(\\d{7}-\\d{2}\\.\\d{4}\\.\\d{1}\\.\\d{2}\\.\\d{4})/g;
            let match;
            const posicoes = [];
            
            while ((match = processoPattern.exec(bodyText)) !== null) {
              posicoes.push({ processo: match[1], index: match.index });
            }
            
            // Criar blocos entre cada processo
            for (let i = 0; i < posicoes.length; i++) {
              const inicio = posicoes[i].index;
              const fim = i + 1 < posicoes.length ? posicoes[i + 1].index : bodyText.length;
              const bloco = bodyText.substring(inicio, Math.min(fim, inicio + 10000));
              blocosResultado.push(bloco);
            }
          }
          
          console.log('Total de blocos encontrados:', blocosResultado.length);
          
          // Processar cada bloco isoladamente
          for (const bloco of blocosResultado) {
            // Extrair número do processo deste bloco
            const processoMatch = bloco.match(/(\\d{7}-\\d{2}\\.\\d{4}\\.\\d{1}\\.\\d{2}\\.\\d{4})/);
            if (!processoMatch) continue;
            
            const processo = processoMatch[1];
            
            // Classe Processual - apenas deste bloco
            let classe = '';
            const classeMatch = bloco.match(/Classe\\s*(?:Processual)?[:\\s]*([^\\n]+)/i);
            if (classeMatch) classe = classeMatch[1].trim().substring(0, 150);
            
            // Tipo de Decisão (Decisão Monocrática, Acórdão, Despacho, etc.)
            let tipoDecisao = '';
            const tipoPatterns = [
              /\\(([^)]*monocr[áa]tic[oa][^)]*)\\)/i,
              /\\(([^)]*ac[óo]rd[ãa]o[^)]*)\\)/i,
              /\\(([^)]*despacho[^)]*)\\)/i,
              /\\(([^)]*senten[çc]a[^)]*)\\)/i,
              /Tipo\\s*(?:de)?\\s*Decisão[:\\s]*([^\\n]+)/i,
              /(Decisão\\s+Monocrática)/i,
              /(Acórdão)/i,
              /(Despacho)/i,
              /(Sentença)/i
            ];
            for (const pattern of tipoPatterns) {
              const match = bloco.match(pattern);
              if (match) {
                tipoDecisao = match[1].trim();
                // Normalizar
                if (/monocr/i.test(tipoDecisao)) tipoDecisao = 'Decisão Monocrática';
                else if (/ac[óo]rd/i.test(tipoDecisao)) tipoDecisao = 'Acórdão';
                else if (/despacho/i.test(tipoDecisao)) tipoDecisao = 'Despacho';
                else if (/senten/i.test(tipoDecisao)) tipoDecisao = 'Sentença';
                break;
              }
            }
            // Fallback: inferir do texto da classe
            if (!tipoDecisao && classe) {
              if (/monocr/i.test(classe)) tipoDecisao = 'Decisão Monocrática';
              else if (/ac[óo]rd/i.test(classe)) tipoDecisao = 'Acórdão';
            }
            
            // Assunto Principal
            let assuntoPrincipal = '';
            const assuntoMatch = bloco.match(/Assunto\\s*(?:Principal)?[:\\s]*([^\\n]+)/i);
            if (assuntoMatch) assuntoPrincipal = assuntoMatch[1].trim().substring(0, 200);
            
            // Relator
            let relator = '';
            const relatorMatch = bloco.match(/Relator[:\\s]*(?:a)?[:\\s]*([^\\n]+)/i);
            if (relatorMatch) relator = relatorMatch[1].trim().substring(0, 150);
            
            // Órgão Julgador
            let orgaoJulgador = '';
            const orgaoMatch = bloco.match(/Órgão\\s*Julgador[:\\s]*([^\\n]+)/i);
            if (orgaoMatch) orgaoJulgador = orgaoMatch[1].trim().substring(0, 150);
            
            // Comarca
            let comarca = '';
            const comarcaMatch = bloco.match(/Comarca[:\\s]*([^\\n]+)/i);
            if (comarcaMatch) comarca = comarcaMatch[1].trim().substring(0, 100);
            
            // Data de Julgamento
            let dataJulgamento = '';
            const dataMatch = bloco.match(/(?:Data\\s*(?:do)?\\s*Julgamento|Julgado\\s*em|Data\\s*da\\s*Publicação|Publicação)[:\\s]*(\\d{2}[\\/\\-]\\d{2}[\\/\\-]\\d{4})/i);
            if (dataMatch) dataJulgamento = dataMatch[1];
            
            // EMENTA COMPLETA - usar múltiplas estratégias para capturar texto completo
            let ementa = '';
            
            // Estratégia 1: Procurar seção EMENTA no bloco
            const ementaStartIndex = bloco.search(/(?:EMENTA|Ementa)[:\\s]*/i);
            if (ementaStartIndex !== -1) {
              // Pegar tudo após EMENTA até o fim do bloco ou próximo marcador
              const textoAposEmenta = bloco.substring(ementaStartIndex).replace(/^(?:EMENTA|Ementa)[:\\s]*/i, '');
              
              // Encontrar onde a ementa termina (antes de "Inteiro Teor", links, ou próximo processo)
              const fimEmentaMatch = textoAposEmenta.search(/(?:Inteiro\\s*[Tt]eor|Ementa\\s*pr[ée]-formatada|Carregar\\s*documento|^\\s*\\d{7}-\\d{2}\\.\\d{4}|^\\s*Processo:|^\\s*Classe\\s*Processual:)/im);
              
              if (fimEmentaMatch !== -1 && fimEmentaMatch > 50) {
                ementa = textoAposEmenta.substring(0, fimEmentaMatch).trim();
              } else {
                ementa = textoAposEmenta.trim();
              }
            }
            
            // Estratégia 2: Se ementa parece incompleta, pegar mais contexto
            if (!ementa || ementa.length < 100) {
              // Procurar texto após metadados até próximo resultado
              const afterDataMatch = bloco.match(/Data\\s*(?:do)?\\s*(?:Julgamento|Publicação)[:\\s]*\\d{2}[\\/\\-]\\d{2}[\\/\\-]\\d{4}[\\s\\n]+([\\s\\S]+)/i);
              if (afterDataMatch && afterDataMatch[1] && afterDataMatch[1].length > ementa.length) {
                ementa = afterDataMatch[1].trim();
              }
            }
            
            // Limpar ementa preservando conteúdo completo
            ementa = ementa
              .replace(/Leia\\s*mais\\.?\\s*/gi, '')
              .replace(/Ver\\s*mais\\.?\\s*/gi, '')
              .replace(/\\[expandir\\]/gi, '')
              .replace(/Inteiro\\s*[Tt]eor[\\s\\S]*$/i, '') // Remover apenas "Inteiro Teor" e o que vem DEPOIS
              .replace(/Ementa\\s*pr[ée]-formatada[\\s\\S]*$/i, '')
              .replace(/Carregar\\s*documento[\\s\\S]*$/i, '')
              .replace(/Imprimir[\\s\\S]*$/i, '')
              .replace(/\\s+/g, ' ')
              .trim();
            
            // Remover início cortado (se começar com letra minúscula no meio de palavra)
            if (ementa.match(/^[a-záéíóúàèìòùâêîôûãõç]/)) {
              // Ementa começa no meio de uma palavra - procurar início real
              const primeiroEspaco = ementa.indexOf(' ');
              if (primeiroEspaco > 0 && primeiroEspaco < 30) {
                // Verificar se próxima palavra começa com maiúscula
                const restoEmenta = ementa.substring(primeiroEspaco + 1);
                if (restoEmenta.match(/^[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]/)) {
                  ementa = restoEmenta;
                }
              }
            }
            
            // RESULTADO DO JULGAMENTO
            let resultado = '';
            const resultadoMatch = bloco.match(/(?:recurso|apelação|agravo)[\\s\\S]{0,100}?((?:parcialmente\\s+)?(?:provid[oa]|improvid[oa]|desprovid[oa]|negad[oa]))/i);
            if (resultadoMatch) {
              resultado = resultadoMatch[1].trim();
              if (/parcial/i.test(resultado)) resultado = 'Parcialmente provido';
              else if (/improvid|desprovid|negad/i.test(resultado)) resultado = 'Desprovido';
              else if (/provid/i.test(resultado)) resultado = 'Provido';
            }
            
            // Links e citação - buscar no HTML próximo ao processo
            let linkInteiroTeor = '';
            let integraAcordao = '';
            let citacaoFormatada = '';
            
            const indexHtml = bodyHtml.indexOf(processo);
            if (indexHtml !== -1) {
              const blocoHtml = bodyHtml.substring(Math.max(0, indexHtml - 1000), Math.min(bodyHtml.length, indexHtml + 5000));
              
              // Link Inteiro Teor
              const linkMatch = blocoHtml.match(/href="([^"]*(?:inteiro|teor)[^"]*)"/i);
              if (linkMatch) {
                linkInteiroTeor = linkMatch[1];
                if (!linkInteiroTeor.startsWith('http')) {
                  linkInteiroTeor = 'https://portal.tjpr.jus.br' + (linkInteiroTeor.startsWith('/') ? '' : '/') + linkInteiroTeor;
                }
              }
              
              // Link Íntegra do Acórdão
              const integraMatch = blocoHtml.match(/href="([^"]*(?:integra|acordao|documento|pdf)[^"]*)"/i);
              if (integraMatch) {
                integraAcordao = integraMatch[1];
                if (!integraAcordao.startsWith('http')) {
                  integraAcordao = 'https://portal.tjpr.jus.br' + (integraAcordao.startsWith('/') ? '' : '/') + integraAcordao;
                }
              }
            }
            
            // Gerar citação pré-formatada no padrão TJPR
            // Formato: (TJPR - Órgão Julgador - Processo - Comarca - Rel.: RELATOR - J. DD.MM.AAAA)
            const dataFormatada = dataJulgamento ? dataJulgamento.replace(/\\//g, '.').replace(/-/g, '.') : '';
            citacaoFormatada = \`(TJPR - \${orgaoJulgador || 'Não informado'} - \${processo}\${comarca ? ' - ' + comarca : ''} - Rel.: \${relator ? relator.toUpperCase() : 'NÃO INFORMADO'} - J. \${dataFormatada})\`;
            
            // Validar que temos dados mínimos
            if (processo && ementa.length > 30) {
              results.push({
                id: 'tjpr_' + processo.replace(/[^\\w]/g, '_'),
                numeroProcesso: processo,
                classe: classe || 'Não informada',
                tipoDecisao: tipoDecisao || 'Não informado',
                assuntoPrincipal: assuntoPrincipal || '',
                relator: relator || 'Não informado',
                orgaoJulgador: orgaoJulgador || 'Não informado',
                comarca: comarca || '',
                dataJulgamento: dataJulgamento || '',
                ementa: ementa,
                ementaOriginal: ementa,
                resultado: resultado || '',
                tribunal: 'TJPR',
                fonte: 'TJPR Browserless',
                linkInteiroTeor: linkInteiroTeor || '',
                integraAcordao: integraAcordao || '',
                citacaoFormatada: citacaoFormatada
              });
            }
          }
          
          return results;
        });
        
        // Deduplicate por número de processo
        const uniqueResults = [];
        const seen = new Set();
        for (const r of resultados) {
          if (!seen.has(r.numeroProcesso)) {
            seen.add(r.numeroProcesso);
            uniqueResults.push(r);
          }
        }
        
        // Ordenar por data mais recente
        uniqueResults.sort((a, b) => {
          const parseData = (d) => {
            if (!d) return new Date(0);
            const parts = d.replace(/-/g, '/').split('/');
            if (parts.length === 3) {
              return new Date(parts[2], parts[1] - 1, parts[0]);
            }
            return new Date(0);
          };
          return parseData(b.dataJulgamento) - parseData(a.dataJulgamento);
        });
        
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
          detalhes: "Falha na automação do navegador para TJPR"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const result = await response.json();
    console.log(`✅ TJPR: ${result.resultados?.length || 0} resultados`);

    return new Response(
      JSON.stringify({
        success: true,
        resultados: result.resultados || [],
        total: result.total || result.resultados?.length || 0,
        pagina: pagina,
        fonte: 'TJPR Browserless',
        tribunal: 'TJPR',
        termo: termo
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Erro na busca TJPR:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        detalhes: "Erro ao buscar jurisprudência no TJPR"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
