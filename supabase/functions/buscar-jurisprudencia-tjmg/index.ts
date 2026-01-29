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
      throw new Error(`Timeout: O TJMG não respondeu em ${timeout/1000} segundos. Tente novamente.`);
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

    console.log(`🔍 Buscando no TJMG: "${termo}" - limite ${limite}`);

    const BASE_URL = 'https://www5.tjmg.jus.br';
    const SEARCH_URL = `${BASE_URL}/jurisprudencia/formEspelhoAcordao.do`;

    // Preparar form data para POST
    const formData = new URLSearchParams({
      'palavras': termo,
      'pesquisarEm': 'ementa',
      'pesquisarTodas': 'ementa',
      'ordenarPor': '1', // Data de julgamento
      'dataInicial': '',
      'dataFinal': '',
      'orgaoJulgador': '',
      'relator': '',
      'classe': '',
      'assunto': '',
      'comarca': '',
      'consultaPor': 'palavras',
      'linhasPorPagina': '50',
      'pagina': pagina.toString(),
    });

    console.log(`📤 POST para ${SEARCH_URL}...`);

    const response = await fetchWithTimeout(SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': BASE_URL,
        'Referer': `${BASE_URL}/jurisprudencia/`,
      },
      body: formData.toString(),
    }, REQUEST_TIMEOUT);

    const html = await response.text();
    console.log(`📥 Response length: ${html.length}`);

    // Verificar se não há resultados
    if (html.includes('Nenhum resultado encontrado') || html.includes('nenhum registro') || html.length < 1000) {
      console.log('❌ Nenhum resultado encontrado');
      return new Response(
        JSON.stringify({
          success: true,
          resultados: [],
          total: 0,
          termo,
          tribunal: 'TJMG',
          fonte: 'TJMG',
          urlOriginal: SEARCH_URL,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair total de resultados
    const totalMatch = html.match(/Encontrad[oa]s?\s*:?\s*(\d+(?:\.\d+)?)/i) ||
                      html.match(/(\d+(?:\.\d+)?)\s*resultado/i) ||
                      html.match(/Total:\s*(\d+)/i);
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
        tribunal: 'TJMG',
        fonte: 'TJMG',
        urlOriginal: SEARCH_URL,
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
  
  // Padrão para encontrar blocos de jurisprudência no TJMG
  // O TJMG geralmente usa tabelas ou divs com classes específicas
  
  // Tentar encontrar números de processo
  const processosPattern = /(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/g;
  const processosMatches = html.match(processosPattern) || [];
  const processosUnicos = [...new Set(processosMatches)];
  
  console.log(`🔎 Processos CNJ encontrados: ${processosUnicos.length}`);
  
  // Se não encontrar processos CNJ, tentar padrão antigo TJMG
  const processosAntigos = html.match(/\d+\.\d+\.\d+\.\d+\-\d+\/\d+/g) || [];
  const todosProcessos = [...processosUnicos, ...new Set(processosAntigos)];
  
  for (let i = 0; i < todosProcessos.length && i < 100; i++) {
    const numeroProcesso = todosProcessos[i];
    
    // Encontrar contexto ao redor do processo
    const indexProcesso = html.indexOf(numeroProcesso);
    if (indexProcesso === -1) continue;
    
    const contexto = html.substring(
      Math.max(0, indexProcesso - 2000),
      Math.min(html.length, indexProcesso + 5000)
    );
    
    // Extrair classe
    const classeMatch = contexto.match(/(?:Classe|Tipo)\s*[:\-]?\s*([^<\n\r]{3,80})/i) ||
                        contexto.match(/(Apelação\s+(?:Cível|Criminal)?)/i) ||
                        contexto.match(/(Agravo\s+(?:de\s+Instrumento|Interno)?)/i) ||
                        contexto.match(/(Recurso[^<\n\r]{0,30})/i);
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
    
    // Extrair data de publicação
    const dataPubMatch = contexto.match(/(?:Data\s*(?:de\s*)?[Pp]ublicação|Publicad[oa]\s*(?:em)?)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i);
    const dataRegistro = dataPubMatch ? dataPubMatch[1] : null;
    
    // Extrair ementa
    let ementa = '';
    const ementaMatch = contexto.match(/Ementa\s*[:\-]?\s*([\s\S]{50,3000}?)(?=<\/td>|<\/div>|Relator|Classe\s*:|Data\s*d|$)/i);
    if (ementaMatch) {
      ementa = limparTexto(ementaMatch[1]);
    } else {
      // Fallback: maior bloco de texto
      const textoBlocks = contexto.match(/>([^<]{100,2000})</g) || [];
      for (const block of textoBlocks) {
        const texto = limparTexto(block.replace(/^>|<$/g, ''));
        if (texto.length > ementa.length && 
            !texto.toLowerCase().includes('classe') && 
            !texto.toLowerCase().includes('relator') &&
            !texto.toLowerCase().includes('menu') &&
            !texto.toLowerCase().includes('javascript')) {
          ementa = texto;
        }
      }
    }
    
    if (ementa.length < 30 && !dataJulgamento && classe === 'Acórdão') continue;
    
    // Gerar link para inteiro teor
    const linkInteiroTeor = `${baseUrl}/jurisprudencia/pesquisaNumeroCNJ.do?numeroRegistro=1&numeroRegistro=${encodeURIComponent(numeroProcesso)}`;
    
    resultados.push({
      id: `TJMG_${numeroProcesso.replace(/[^\d]/g, '')}`,
      numeroProcesso,
      classe,
      relator,
      orgaoJulgador,
      dataJulgamento,
      dataRegistro,
      ementa: ementa.substring(0, 5000),
      linkInteiroTeor,
      tribunal: 'TJMG',
      fonte: 'TJMG',
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
