import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Timeout de 15 segundos para requisições
const REQUEST_TIMEOUT = 15000;

// URLs do e-SAJ por tribunal - apenas tribunais com e-SAJ jurisprudência funcional
const TRIBUNAIS_ESAJ: Record<string, { base: string; nome: string; funcional: boolean }> = {
  'TJSP': { base: 'https://esaj.tjsp.jus.br', nome: 'TJSP - São Paulo', funcional: true },
  // Outros tribunais não usam e-SAJ para jurisprudência ou estão indisponíveis
  'TJCE': { base: 'https://esaj.tjce.jus.br', nome: 'TJCE - Ceará', funcional: false },
  'TJMS': { base: 'https://esaj.tjms.jus.br', nome: 'TJMS - Mato Grosso do Sul', funcional: false },
  'TJAM': { base: 'https://esaj.tjam.jus.br', nome: 'TJAM - Amazonas', funcional: false },
  'TJAC': { base: 'https://esaj.tjac.jus.br', nome: 'TJAC - Acre', funcional: false },
  'TJAL': { base: 'https://esaj.tjal.jus.br', nome: 'TJAL - Alagoas', funcional: false },
};

// Função auxiliar para fetch com timeout
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
      throw new Error(`Timeout: O tribunal ${url.match(/esaj\.(\w+)\.jus\.br/)?.[1]?.toUpperCase() || 'selecionado'} não respondeu em ${timeout/1000} segundos. Tente novamente ou selecione outro tribunal.`);
    }
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { termo, pagina = 1, limite = 100, tribunal = 'TJSP' } = await req.json();

    if (!termo || termo.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'Termo de busca deve ter pelo menos 3 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tribunalConfig = TRIBUNAIS_ESAJ[tribunal] || TRIBUNAIS_ESAJ['TJSP'];
    
    // Verificar se o tribunal está funcional
    if (!tribunalConfig.funcional) {
      console.log(`⚠️ Tribunal ${tribunal} não está funcional para busca e-SAJ`);
      return new Response(
        JSON.stringify({ 
          error: `O tribunal ${tribunal} não está disponível para busca via e-SAJ. Atualmente, apenas o TJSP está funcional. Outros tribunais estão em desenvolvimento.`,
          tribunalIndisponivel: true 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const ESAJ_BASE = tribunalConfig.base;
    const ESAJ_SEARCH_POST = `${ESAJ_BASE}/cjsg/resultadoCompleta.do`;
    const ESAJ_PAGINATION = `${ESAJ_BASE}/cjsg/trocaDePagina.do`;

    console.log(`🔍 Buscando no e-SAJ ${tribunal} (${ESAJ_BASE}): "${termo}" - limite ${limite}`);

    // Passo 1: Fazer POST para iniciar sessão de busca
    const formData = new URLSearchParams({
      'dados.buscaInteiroTeor': termo,
      'dados.pesquisarComSinonimos': 'S',
      'dados.buscaEmenta': '',
      'contadorag498': '0',
      'contadoragali498': '0',
      'dados.ordenarPor': 'dtPublicacao',
      'tipoDecisaoSelecionados': 'A', // Acórdãos
      'dados.nuRegistro': '',
      'dados.nuProcOrigem': '',
      'comarcaSelecionada': '',
    });

    console.log(`📤 POST para iniciar busca em ${ESAJ_SEARCH_POST}...`);
    
    const postResponse = await fetchWithTimeout(ESAJ_SEARCH_POST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': ESAJ_BASE,
        'Referer': `${ESAJ_BASE}/cjsg/consultaCompleta.do`,
      },
      body: formData.toString(),
      redirect: 'manual',
    }, REQUEST_TIMEOUT);

    console.log(`📥 POST response status: ${postResponse.status}`);
    
    // Extrair cookies da resposta
    const setCookieHeaders = postResponse.headers.getSetCookie?.() || [];
    const cookieHeader = postResponse.headers.get('set-cookie') || '';
    
    let cookies = '';
    if (setCookieHeaders.length > 0) {
      cookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');
    } else if (cookieHeader) {
      cookies = cookieHeader.split(',')
        .map(c => c.split(';')[0].trim())
        .filter(c => c.includes('='))
        .join('; ');
    }

    console.log(`🍪 Cookies extraídos: ${cookies ? 'SIM' : 'NÃO'}`);

    // Calcular quantas páginas buscar (20 resultados por página)
    const paginasPorBuscar = Math.ceil(limite / 20);
    let todosResultados: any[] = [];
    let totalGeral = 0;
    let sessionCookies = cookies;

    // Buscar múltiplas páginas
    for (let paginaAtual = 1; paginaAtual <= paginasPorBuscar; paginaAtual++) {
      console.log(`📤 Buscando página ${paginaAtual} de ${paginasPorBuscar} em ${tribunal}...`);
      
      let html = '';
      
      if (paginaAtual === 1 && postResponse.status === 200) {
        const postHtml = await postResponse.text();
        if (postHtml.includes('fundocinza1') || postHtml.includes('ementaClass') || postHtml.includes('linhaResultado') || postHtml.includes('textAreaDados_')) {
          html = postHtml;
          console.log('📄 Usando HTML do POST direto');
        }
      }
      
      if (!html) {
        // IMPORTANTE: Usar a URL base do tribunal selecionado, não TJSP
        const paginaUrl = `${ESAJ_PAGINATION}?tipoDeDecisao=A&pagina=${paginaAtual}`;
        console.log(`📤 GET para ${paginaUrl}`);
        
        const getResponse = await fetchWithTimeout(paginaUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Accept-Charset': 'utf-8, iso-8859-1;q=0.5',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': ESAJ_SEARCH_POST,
            'Cookie': sessionCookies,
          },
        }, REQUEST_TIMEOUT);
        
        // Atualizar cookies se a resposta trouxer novos
        const newCookies = getResponse.headers.getSetCookie?.() || [];
        if (newCookies.length > 0) {
          const newCookieStr = newCookies.map(c => c.split(';')[0]).join('; ');
          sessionCookies = sessionCookies ? `${sessionCookies}; ${newCookieStr}` : newCookieStr;
        }
        
        html = await getResponse.text();
        console.log(`📥 GET response length: ${html.length}`);
      }

      // Verificar se não há mais resultados
      if (html.includes('Nenhum resultado encontrado') || html.includes('nenhum registro')) {
        console.log(`❌ Nenhum resultado na página ${paginaAtual}`);
        break;
      }

      // Extrair total na primeira página
      if (paginaAtual === 1) {
        const totalMatch = html.match(/Encontrados?\s*:?\s*(\d+(?:\.\d+)?)/i) ||
                          html.match(/(\d+(?:\.\d+)?)\s*resultado/i) ||
                          html.match(/Total:\s*(\d+)/i);
        totalGeral = totalMatch ? parseInt(totalMatch[1].replace(/\./g, '')) : 0;
        console.log(`📊 Total de resultados disponíveis: ${totalGeral}`);
      }

      // Extrair jurisprudências desta página
      const jurisprudenciasPagina = extrairJurisprudencias(html, tribunal, ESAJ_BASE);
      console.log(`✅ Página ${paginaAtual}: ${jurisprudenciasPagina.length} resultados`);
      
      todosResultados = [...todosResultados, ...jurisprudenciasPagina];

      // Parar se já temos resultados suficientes ou se a página veio vazia
      if (todosResultados.length >= limite || jurisprudenciasPagina.length === 0) {
        break;
      }

      // Pequena pausa entre requisições para não sobrecarregar
      if (paginaAtual < paginasPorBuscar) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Limitar ao máximo solicitado
    const resultadosFinais = todosResultados.slice(0, limite);
    console.log(`✅ Retornando ${resultadosFinais.length} de ${totalGeral} resultados totais do ${tribunal}`);

    return new Response(
      JSON.stringify({
        success: true,
        resultados: resultadosFinais,
        total: totalGeral || resultadosFinais.length,
        paginasBuscadas: Math.min(paginasPorBuscar, Math.ceil(todosResultados.length / 20)),
        termo,
        tribunal,
        fonte: `e-SAJ ${tribunal}`,
        urlOriginal: ESAJ_SEARCH_POST,
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

function extrairJurisprudencias(html: string, tribunal: string, baseUrl: string): any[] {
  const resultados: any[] = [];
  
  // Método 1: Extrair usando os divs textAreaDados_ que contêm a ementa limpa
  const textAreaPattern = /<div\s+id="textAreaDados_(\d+)"[^>]*class="[^"]*mensagemSemFormatacao[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  const textAreaMatches = [...html.matchAll(textAreaPattern)];
  
  console.log(`🔎 textAreaDados encontrados: ${textAreaMatches.length}`);
  
  if (textAreaMatches.length > 0) {
    // Processar cada div de ementa encontrado
    for (const match of textAreaMatches) {
      const cdAcordao = match[1];
      const ementaRaw = match[2];
      const ementa = limparTexto(ementaRaw);
      
      if (!ementa || ementa.length < 30) continue;
      
      // Buscar o contexto ao redor deste acordão para extrair metadados
      const indexAcordao = html.indexOf(`textAreaDados_${cdAcordao}`);
      const inicioBloco = Math.max(0, indexAcordao - 3000);
      const fimBloco = Math.min(html.length, indexAcordao + ementa.length + 1000);
      const contexto = html.substring(inicioBloco, fimBloco);
      
      // Extrair número do processo CNJ
      const processoMatch = contexto.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
      const numeroProcesso = processoMatch ? processoMatch[0] : `${tribunal}_${cdAcordao}`;
      
      // Extrair classe/tipo
      const classeMatch = contexto.match(/(?:Classe|Tipo)\s*[:\-]?\s*([^<\n\r]{3,80})/i) ||
                          contexto.match(/(Apelação\s+(?:Cível|Criminal)?[^<\n\r]{0,50})/i) ||
                          contexto.match(/(Agravo\s+(?:de\s+Instrumento|Interno)?[^<\n\r]{0,50})/i) ||
                          contexto.match(/(Recurso[^<\n\r]{0,50})/i) ||
                          contexto.match(/(Habeas\s+Corpus[^<\n\r]{0,30})/i) ||
                          contexto.match(/(Mandado\s+de\s+Segurança[^<\n\r]{0,30})/i);
      const classe = classeMatch ? limparTexto(classeMatch[1]).substring(0, 80) : 'Acórdão';
      
      // Extrair relator
      const relatorMatch = contexto.match(/Relator(?:\(a\))?(?:\s*:)?\s*([^<\n\r]{3,100})/i);
      const relator = relatorMatch ? limparTexto(relatorMatch[1]).substring(0, 100) : 'N/A';
      
      // Extrair órgão julgador
      const orgaoMatch = contexto.match(/(?:Órgão|Orgao)\s*(?:Julgador)?(?:\s*:)?\s*([^<\n\r]{3,100})/i) ||
                         contexto.match(/(\d+ª?\s*Câmara[^<\n\r]*)/i) ||
                         contexto.match(/(Turma[^<\n\r]{0,50})/i) ||
                         contexto.match(/(Seção[^<\n\r]{0,50})/i);
      const orgaoJulgador = orgaoMatch ? limparTexto(orgaoMatch[1]).substring(0, 100) : 'N/A';
      
      // Extrair data de julgamento
      const dataJulgMatch = contexto.match(/(?:Data\s*(?:do\s*)?[Jj]ulgamento|Julgado\s*(?:em)?)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i) ||
                            contexto.match(/Julgamento\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i);
      const dataJulgamento = dataJulgMatch ? dataJulgMatch[1] : null;
      
      // Extrair data de registro/publicação
      const dataRegMatch = contexto.match(/(?:Data\s*(?:de\s*)?[Rr]egistro|Publicad[oa]\s*(?:em)?)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i) ||
                           contexto.match(/Registro\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i);
      const dataRegistro = dataRegMatch ? dataRegMatch[1] : null;
      
      // Extrair link para inteiro teor
      const linkMatch = contexto.match(/href="([^"]*(?:getArquivo|visualizar|inteiro|abrirDocumento)[^"]*)"/i) ||
                        contexto.match(/href="([^"]*cdAcordao[^"]*)"/i);
      let linkInteiroTeor = '';
      if (linkMatch) {
        const link = linkMatch[1];
        linkInteiroTeor = link.startsWith('http') ? link : `${baseUrl}${link.startsWith('/') ? '' : '/cjsg/'}${link}`;
      } else {
        linkInteiroTeor = `${baseUrl}/cposg/search.do?conversationId=&paginaConsulta=0&cbPesquisa=NUMPROC&numeroDigitoAnoUnificado=${numeroProcesso}&foroNumeroUnificado=0000&dePesquisaNuUnificado=${numeroProcesso}`;
      }
      
      resultados.push({
        id: `${tribunal}_${cdAcordao}`,
        numeroProcesso,
        classe,
        relator,
        orgaoJulgador,
        dataJulgamento,
        dataRegistro,
        ementa: ementa.substring(0, 5000),
        linkInteiroTeor,
        tribunal,
        fonte: `e-SAJ ${tribunal}`,
      });
    }
    
    return resultados;
  }
  
  // Método 2 (fallback): Buscar por números de processo no formato CNJ
  console.log('⚠️ Usando método fallback (processos CNJ)...');
  const processosCNJ = html.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g) || [];
  const processosUnicos = [...new Set(processosCNJ)];
  
  console.log(`🔎 Processos CNJ encontrados: ${processosUnicos.length}`);
  
  for (let i = 0; i < processosUnicos.length; i++) {
    const numeroProcesso = processosUnicos[i];
    
    // Encontrar contexto ao redor do número do processo
    const indexProcesso = html.indexOf(numeroProcesso);
    const contexto = html.substring(
      Math.max(0, indexProcesso - 1500), 
      Math.min(html.length, indexProcesso + 6000)
    );
    
    // Extrair classe/tipo
    const classeMatch = contexto.match(/(?:Classe|Tipo)\s*[:\-]?\s*([^<\n\r]{3,80})/i) ||
                        contexto.match(/(Apelação[^<\n\r]{0,50})/i) ||
                        contexto.match(/(Agravo[^<\n\r]{0,50})/i) ||
                        contexto.match(/(Recurso[^<\n\r]{0,50})/i);
    const classe = classeMatch ? limparTexto(classeMatch[1]).substring(0, 80) : 'Acórdão';
    
    // Extrair relator
    const relatorMatch = contexto.match(/Relator(?:\(a\))?(?:\s*:)?\s*([^<\n\r]{3,100})/i);
    const relator = relatorMatch ? limparTexto(relatorMatch[1]).substring(0, 100) : 'N/A';
    
    // Extrair órgão julgador
    const orgaoMatch = contexto.match(/(?:Órgão|Orgao)\s*(?:Julgador)?(?:\s*:)?\s*([^<\n\r]{3,100})/i) ||
                       contexto.match(/(\d+ª?\s*Câmara[^<\n\r]*)/i);
    const orgaoJulgador = orgaoMatch ? limparTexto(orgaoMatch[1]).substring(0, 100) : 'N/A';
    
    // Extrair data de julgamento
    const dataJulgMatch = contexto.match(/(?:Data\s*(?:do\s*)?[Jj]ulgamento|Julgado\s*(?:em)?)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i);
    const dataJulgamento = dataJulgMatch ? dataJulgMatch[1] : null;
    
    // Extrair data de registro
    const dataRegMatch = contexto.match(/(?:Data\s*(?:de\s*)?[Rr]egistro|Publicad[oa]\s*(?:em)?)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i);
    const dataRegistro = dataRegMatch ? dataRegMatch[1] : null;
    
    // Tentar extrair ementa do textAreaDados
    let ementa = '';
    const textAreaMatch = contexto.match(/<div\s+id="textAreaDados_\d+"[^>]*class="[^"]*mensagemSemFormatacao[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (textAreaMatch) {
      ementa = limparTexto(textAreaMatch[1]);
    } else {
      // Fallback: buscar após "Ementa:"
      const ementaMatch = contexto.match(/Ementa\s*[:\-]?\s*([\s\S]{50,4000}?)(?=<\/td>|<\/tr>|<br\s*\/?>.*?Relator|Classe\s*:|Data\s*d|Acesse|$)/i);
      if (ementaMatch) {
        ementa = limparTexto(ementaMatch[1]);
      } else {
        // Último fallback: maior bloco de texto
        const textoBlocks = contexto.match(/>([^<]{100,2000})</g) || [];
        for (const block of textoBlocks) {
          const texto = limparTexto(block.replace(/^>|<$/g, ''));
          if (texto.length > ementa.length && 
              !texto.toLowerCase().includes('classe') && 
              !texto.toLowerCase().includes('relator') &&
              !texto.toLowerCase().includes('menu') &&
              !texto.toLowerCase().includes('pesquisar') &&
              !texto.toLowerCase().includes('javascript')) {
            ementa = texto;
          }
        }
      }
    }
    
    // Extrair link
    const linkMatch = contexto.match(/href="([^"]*(?:getArquivo|visualizar|inteiro|abrirDocumento)[^"]*)"/i);
    let linkInteiroTeor = '';
    if (linkMatch) {
      const link = linkMatch[1];
      linkInteiroTeor = link.startsWith('http') ? link : `${baseUrl}${link.startsWith('/') ? '' : '/cjsg/'}${link}`;
    } else {
      linkInteiroTeor = `${baseUrl}/cposg/search.do?conversationId=&paginaConsulta=0&cbPesquisa=NUMPROC&numeroDigitoAnoUnificado=${numeroProcesso}`;
    }
    
    if (ementa.length > 50 || dataJulgamento || classe !== 'Acórdão') {
      resultados.push({
        id: `${tribunal}_${numeroProcesso.replace(/[^0-9]/g, '')}`,
        numeroProcesso,
        classe,
        relator,
        orgaoJulgador,
        dataJulgamento,
        dataRegistro,
        ementa: ementa.substring(0, 5000),
        linkInteiroTeor,
        tribunal,
        fonte: `e-SAJ ${tribunal}`,
      });
    }
  }
  
  return resultados;
}

function limparTexto(texto: string): string {
  return texto
    // Remover tags HTML
    .replace(/<[^>]+>/g, '')
    // Remover atributos residuais de imagens/elementos
    .replace(/cursorPointer"\s*src="[^"]*"/gi, '')
    .replace(/class="[^"]*"/gi, '')
    .replace(/id="[^"]*"/gi, '')
    .replace(/style="[^"]*"/gi, '')
    .replace(/onclick="[^"]*"/gi, '')
    .replace(/title="[^"]*"/gi, '')
    .replace(/src="[^"]*"/gi, '')
    .replace(/alt="[^"]*"/gi, '')
    // HTML Named Entities - Símbolos e pontuação
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&bull;/g, '•')
    .replace(/&hellip;/g, '…')
    .replace(/&trade;/g, '™')
    .replace(/&reg;/g, '®')
    .replace(/&copy;/g, '©')
    .replace(/&euro;/g, '€')
    .replace(/&pound;/g, '£')
    .replace(/&yen;/g, '¥')
    .replace(/&cent;/g, '¢')
    .replace(/&sect;/g, '§')
    .replace(/&deg;/g, '°')
    .replace(/&plusmn;/g, '±')
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
    .replace(/&frac12;/g, '½')
    .replace(/&frac14;/g, '¼')
    .replace(/&frac34;/g, '¾')
    .replace(/&sup1;/g, '¹')
    .replace(/&sup2;/g, '²')
    .replace(/&sup3;/g, '³')
    // Vogais minúsculas com acentos
    .replace(/&aacute;/gi, 'á')
    .replace(/&agrave;/gi, 'à')
    .replace(/&atilde;/gi, 'ã')
    .replace(/&acirc;/gi, 'â')
    .replace(/&auml;/gi, 'ä')
    .replace(/&aring;/gi, 'å')
    .replace(/&aelig;/gi, 'æ')
    .replace(/&eacute;/gi, 'é')
    .replace(/&egrave;/gi, 'è')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&euml;/gi, 'ë')
    .replace(/&iacute;/gi, 'í')
    .replace(/&igrave;/gi, 'ì')
    .replace(/&icirc;/gi, 'î')
    .replace(/&iuml;/gi, 'ï')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&ograve;/gi, 'ò')
    .replace(/&otilde;/gi, 'õ')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&oslash;/gi, 'ø')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ugrave;/gi, 'ù')
    .replace(/&ucirc;/gi, 'û')
    .replace(/&uuml;/gi, 'ü')
    .replace(/&yacute;/gi, 'ý')
    .replace(/&yuml;/gi, 'ÿ')
    // Consoantes especiais
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&szlig;/gi, 'ß')
    .replace(/&eth;/gi, 'ð')
    .replace(/&thorn;/gi, 'þ')
    // Vogais maiúsculas com acentos
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Agrave;/g, 'À')
    .replace(/&Atilde;/g, 'Ã')
    .replace(/&Acirc;/g, 'Â')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Aring;/g, 'Å')
    .replace(/&AElig;/g, 'Æ')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Egrave;/g, 'È')
    .replace(/&Ecirc;/g, 'Ê')
    .replace(/&Euml;/g, 'Ë')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Igrave;/g, 'Ì')
    .replace(/&Icirc;/g, 'Î')
    .replace(/&Iuml;/g, 'Ï')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Ograve;/g, 'Ò')
    .replace(/&Otilde;/g, 'Õ')
    .replace(/&Ocirc;/g, 'Ô')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&Oslash;/g, 'Ø')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ugrave;/g, 'Ù')
    .replace(/&Ucirc;/g, 'Û')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&Yacute;/g, 'Ý')
    // Consoantes maiúsculas especiais
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&ETH;/g, 'Ð')
    .replace(/&THORN;/g, 'Þ')
    // Ordinais
    .replace(/&ordf;/gi, 'ª')
    .replace(/&ordm;/gi, 'º')
    // Numeric HTML entities (decimal)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    // Numeric HTML entities (hexadecimal)
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    // Limpar espaços e caracteres extras
    .replace(/\s+/g, ' ')
    .replace(/^\s*[:\-]\s*/, '')
    .trim();
}
