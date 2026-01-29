import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REQUEST_TIMEOUT = 20000;

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout: O TJRJ não respondeu em ${timeout/1000} segundos. Tente novamente.`);
    }
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { termo, pagina = 1, limite = 100 } = await req.json();

    if (!termo || termo.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'Termo de busca deve ter pelo menos 3 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Buscando no TJRJ (e-JURIS): "${termo}" - limite ${limite}`);

    const BASE_URL = 'https://www3.tjrj.jus.br';
    const SEARCH_PAGE = `${BASE_URL}/ejuris/ConsultarJurisprudencia.aspx`;

    // Primeiro, fazer GET para obter ViewState e cookies
    console.log(`📤 GET inicial para ${SEARCH_PAGE}...`);
    
    const initialResponse = await fetchWithTimeout(SEARCH_PAGE, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    }, REQUEST_TIMEOUT);

    const initialHtml = await initialResponse.text();
    
    // Extrair ViewState e EventValidation
    const viewStateMatch = initialHtml.match(/id="__VIEWSTATE"\s+value="([^"]+)"/);
    const eventValidationMatch = initialHtml.match(/id="__EVENTVALIDATION"\s+value="([^"]+)"/);
    const viewStateGeneratorMatch = initialHtml.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/);
    
    const viewState = viewStateMatch ? viewStateMatch[1] : '';
    const eventValidation = eventValidationMatch ? eventValidationMatch[1] : '';
    const viewStateGenerator = viewStateGeneratorMatch ? viewStateGeneratorMatch[1] : '';
    
    console.log(`🔐 ViewState: ${viewState ? 'OK' : 'NÃO ENCONTRADO'}`);
    
    // Extrair cookies
    const setCookieHeaders = initialResponse.headers.getSetCookie?.() || [];
    const cookieHeader = initialResponse.headers.get('set-cookie') || '';
    let cookies = '';
    if (setCookieHeaders.length > 0) {
      cookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');
    } else if (cookieHeader) {
      cookies = cookieHeader.split(',').map(c => c.split(';')[0].trim()).filter(c => c.includes('=')).join('; ');
    }

    // Preparar POST com ViewState
    const formData = new URLSearchParams({
      '__VIEWSTATE': viewState,
      '__VIEWSTATEGENERATOR': viewStateGenerator,
      '__EVENTVALIDATION': eventValidation,
      'ctl00$ContentPlaceHolder1$txtPesquisaLivre': termo,
      'ctl00$ContentPlaceHolder1$ddlOrigem': '0',
      'ctl00$ContentPlaceHolder1$ddlCompetencia': '0',
      'ctl00$ContentPlaceHolder1$ddlRamoDireito': '0',
      'ctl00$ContentPlaceHolder1$ddlTipoDecisao': '0',
      'ctl00$ContentPlaceHolder1$btnPesquisar': 'Pesquisar',
    });

    console.log(`📤 POST de pesquisa...`);

    const searchResponse = await fetchWithTimeout(SEARCH_PAGE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': BASE_URL,
        'Referer': SEARCH_PAGE,
        'Cookie': cookies,
      },
      body: formData.toString(),
    }, REQUEST_TIMEOUT);

    const html = await searchResponse.text();
    console.log(`📥 Response length: ${html.length}`);

    // Verificar se não há resultados
    if (html.includes('Nenhum resultado') || html.includes('nenhum registro') || html.length < 1000) {
      console.log('❌ Nenhum resultado encontrado');
      return new Response(
        JSON.stringify({
          success: true,
          resultados: [],
          total: 0,
          termo,
          tribunal: 'TJRJ',
          fonte: 'e-JURIS TJRJ',
          urlOriginal: SEARCH_PAGE,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair total
    const totalMatch = html.match(/Encontrad[oa]s?\s*:?\s*(\d+(?:\.\d+)?)/i) ||
                      html.match(/(\d+(?:\.\d+)?)\s*resultado/i);
    const totalGeral = totalMatch ? parseInt(totalMatch[1].replace(/\./g, '')) : 0;
    console.log(`📊 Total de resultados: ${totalGeral}`);

    // Extrair jurisprudências
    const resultados = extrairJurisprudencias(html, BASE_URL);
    console.log(`✅ Extraídos ${resultados.length} resultados`);

    return new Response(
      JSON.stringify({
        success: true,
        resultados: resultados.slice(0, limite),
        total: totalGeral || resultados.length,
        termo,
        tribunal: 'TJRJ',
        fonte: 'e-JURIS TJRJ',
        urlOriginal: SEARCH_PAGE,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extrairJurisprudencias(html: string, baseUrl: string): any[] {
  const resultados: any[] = [];
  
  // Encontrar números de processo CNJ
  const processosPattern = /(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/g;
  const processosMatches = html.match(processosPattern) || [];
  const processosUnicos = [...new Set(processosMatches)];
  
  console.log(`🔎 Processos CNJ encontrados: ${processosUnicos.length}`);
  
  // Também tentar encontrar processos no formato TJRJ antigo
  const processosAntigos = html.match(/\d{4}\.\d{3}\.\d{5,}/g) || [];
  const todosProcessos = [...processosUnicos, ...new Set(processosAntigos)];
  
  for (let i = 0; i < todosProcessos.length && i < 100; i++) {
    const numeroProcesso = todosProcessos[i];
    
    const indexProcesso = html.indexOf(numeroProcesso);
    if (indexProcesso === -1) continue;
    
    const contexto = html.substring(
      Math.max(0, indexProcesso - 2000),
      Math.min(html.length, indexProcesso + 5000)
    );
    
    // Extrair classe
    const classeMatch = contexto.match(/(?:Classe|Tipo)\s*[:\-]?\s*([^<\n\r]{3,80})/i) ||
                        contexto.match(/(Apelação[^<\n\r]{0,50})/i) ||
                        contexto.match(/(Agravo[^<\n\r]{0,50})/i);
    const classe = classeMatch ? limparTexto(classeMatch[1]).substring(0, 80) : 'Acórdão';
    
    // Extrair relator (TJRJ usa "Des." para desembargador)
    const relatorMatch = contexto.match(/(?:Des\.?|Relator(?:\(a\))?)\s*[:\-]?\s*([^<\n\r]{3,100})/i);
    const relator = relatorMatch ? limparTexto(relatorMatch[1]).substring(0, 100) : 'N/A';
    
    // Extrair órgão julgador
    const orgaoMatch = contexto.match(/(?:Órgão|Orgao|Câmara)\s*(?:Julgador)?(?:\s*:)?\s*([^<\n\r]{3,100})/i) ||
                       contexto.match(/(\d+ª?\s*Câmara[^<\n\r]*)/i);
    const orgaoJulgador = orgaoMatch ? limparTexto(orgaoMatch[1]).substring(0, 100) : 'N/A';
    
    // Extrair datas
    const dataJulgMatch = contexto.match(/(?:Data\s*(?:do\s*)?[Jj]ulgamento|Julgado\s*(?:em)?)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i);
    const dataJulgamento = dataJulgMatch ? dataJulgMatch[1] : null;
    
    const dataPubMatch = contexto.match(/(?:Publicação|Publicad[oa])\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i);
    const dataRegistro = dataPubMatch ? dataPubMatch[1] : null;
    
    // Extrair ementa
    let ementa = '';
    const ementaMatch = contexto.match(/Ementa\s*[:\-]?\s*([\s\S]{50,3000}?)(?=<\/td>|<\/div>|Relator|Des\.|Classe|Data\s*d|$)/i);
    if (ementaMatch) {
      ementa = limparTexto(ementaMatch[1]);
    } else {
      const textoBlocks = contexto.match(/>([^<]{100,2000})</g) || [];
      for (const block of textoBlocks) {
        const texto = limparTexto(block.replace(/^>|<$/g, ''));
        if (texto.length > ementa.length && 
            !texto.toLowerCase().includes('classe') && 
            !texto.toLowerCase().includes('relator') &&
            !texto.toLowerCase().includes('menu')) {
          ementa = texto;
        }
      }
    }
    
    if (ementa.length < 30 && !dataJulgamento && classe === 'Acórdão') continue;
    
    const linkInteiroTeor = `${baseUrl}/ejuris/ConsultarJurisprudencia.aspx`;
    
    resultados.push({
      id: `TJRJ_${numeroProcesso.replace(/[^\d]/g, '')}`,
      numeroProcesso,
      classe,
      relator,
      orgaoJulgador,
      dataJulgamento,
      dataRegistro,
      ementa: ementa.substring(0, 5000),
      linkInteiroTeor,
      tribunal: 'TJRJ',
      fonte: 'e-JURIS TJRJ',
    });
  }
  
  return resultados;
}

function limparTexto(texto: string): string {
  if (!texto) return '';
  return texto
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&aacute;/gi, 'á')
    .replace(/&agrave;/gi, 'à')
    .replace(/&atilde;/gi, 'ã')
    .replace(/&acirc;/gi, 'â')
    .replace(/&eacute;/gi, 'é')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&otilde;/gi, 'õ')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
