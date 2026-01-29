const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InteiroTeorResponse {
  success: boolean;
  data?: {
    titulo: string;
    conteudo: string;
    secoes: {
      dados?: string;
      relatorio?: string;
      ementa?: string;
      voto?: string;
      acordao?: string;
    };
  };
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { linkInteiroTeor } = await req.json();

    if (!linkInteiroTeor) {
      return new Response(
        JSON.stringify({ success: false, error: 'Link do inteiro teor é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[INTEIRO-TEOR] Buscando: ${linkInteiroTeor}`);

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlApiKey) {
      console.error('[INTEIRO-TEOR] FIRECRAWL_API_KEY não configurada');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar Firecrawl para buscar a página
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: linkInteiroTeor,
        formats: ['html', 'markdown'],
        onlyMainContent: false,
        waitFor: 5000,
        timeout: 45000,
      }),
    });

    const firecrawlData = await firecrawlResponse.json();

    if (!firecrawlResponse.ok || firecrawlData.success === false) {
      console.error('[INTEIRO-TEOR] Firecrawl erro:', firecrawlData);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao buscar conteúdo' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = firecrawlData.data?.html || '';
    const markdown = firecrawlData.data?.markdown || '';
    
    console.log(`[INTEIRO-TEOR] HTML recebido: ${html.length} caracteres`);
    console.log(`[INTEIRO-TEOR] Markdown recebido: ${markdown.length} caracteres`);

    // Extrair título
    const tituloMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                        html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const titulo = tituloMatch ? limparHtml(tituloMatch[1]).trim() : 'Inteiro Teor';

    // Tentar extrair do div conteudoInteiroTeor - usando regex mais abrangente
    let conteudoPrincipal = '';
    
    // Método 1: Buscar div por id e extrair TODO o conteúdo até encontrar div de fechamento do container pai
    const inteiroTeorMatch = html.match(/<div[^>]*id="conteudoInteiroTeor"[^>]*>([\s\S]+)/i);
    
    if (inteiroTeorMatch) {
      // Extrair o conteúdo completo, removendo apenas o fechamento final
      let conteudo = inteiroTeorMatch[1];
      
      // Contar divs para encontrar o fechamento correto
      let depth = 1;
      let endIndex = 0;
      let i = 0;
      while (i < conteudo.length && depth > 0) {
        if (conteudo.substring(i, i + 4) === '<div') {
          depth++;
        } else if (conteudo.substring(i, i + 6) === '</div>') {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
        i++;
      }
      
      if (endIndex > 0) {
        conteudoPrincipal = conteudo.substring(0, endIndex);
      } else {
        conteudoPrincipal = conteudo;
      }
      
      console.log(`[INTEIRO-TEOR] Conteúdo encontrado em conteudoInteiroTeor: ${conteudoPrincipal.length} caracteres`);
    } else {
      // Fallback: usar o markdown completo
      conteudoPrincipal = markdown;
      console.log('[INTEIRO-TEOR] Usando markdown como fallback');
    }

    // Extrair seções do conteúdo
    const secoes = extrairSecoes(conteudoPrincipal, html);
    
    // Formatar o conteúdo completo
    const conteudoFormatado = formatarConteudo(conteudoPrincipal, markdown);

    console.log(`[INTEIRO-TEOR] Seções encontradas: ${Object.keys(secoes).filter(k => secoes[k as keyof typeof secoes]).length}`);

    const response: InteiroTeorResponse = {
      success: true,
      data: {
        titulo,
        conteudo: conteudoFormatado,
        secoes,
      },
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[INTEIRO-TEOR] Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extrairSecoes(conteudo: string, html: string): {
  dados?: string;
  relatorio?: string;
  ementa?: string;
  voto?: string;
  acordao?: string;
} {
  const secoes: {
    dados?: string;
    relatorio?: string;
    ementa?: string;
    voto?: string;
    acordao?: string;
  } = {};

  // Extrair dados do processo (RELATOR, AGRAVANTE, etc.)
  const dadosMatch = conteudo.match(/(RELATOR[\s\S]*?)(?=RELAT[ÓO]RIO|EMENTA|VOTO|$)/i);
  if (dadosMatch) {
    const dados = limparHtml(dadosMatch[1]).trim();
    if (dados.length > 20 && dados.length < 2000) {
      secoes.dados = dados;
    }
  }

  // Extrair RELATÓRIO
  const relatorioMatch = conteudo.match(/RELAT[ÓO]RIO([\s\S]*?)(?=EMENTA|VOTO|AC[ÓO]RD[ÃA]O|$)/i);
  if (relatorioMatch) {
    const relatorio = limparHtml(relatorioMatch[1]).trim();
    if (relatorio.length > 50) {
      secoes.relatorio = relatorio;
    }
  }

  // Extrair EMENTA
  const ementaMatch = conteudo.match(/EMENTA:?([\s\S]*?)(?=RELAT[ÓO]RIO|VOTO|AC[ÓO]RD[ÃA]O|$)/i);
  if (ementaMatch) {
    const ementa = limparHtml(ementaMatch[1]).trim();
    if (ementa.length > 50) {
      secoes.ementa = ementa;
    }
  }

  // Extrair VOTO
  const votoMatch = conteudo.match(/VOTO([\s\S]*?)(?=AC[ÓO]RD[ÃA]O|$)/i);
  if (votoMatch) {
    const voto = limparHtml(votoMatch[1]).trim();
    if (voto.length > 50) {
      secoes.voto = voto;
    }
  }

  // Extrair ACÓRDÃO
  const acordaoMatch = conteudo.match(/AC[ÓO]RD[ÃA]O:?([\s\S]*?)$/i);
  if (acordaoMatch) {
    const acordao = limparHtml(acordaoMatch[1]).trim();
    if (acordao.length > 20) {
      secoes.acordao = acordao;
    }
  }

  return secoes;
}

function formatarConteudo(html: string, markdown: string): string {
  // Preferir markdown se existir e for substancial
  if (markdown && markdown.length > 500) {
    return markdown
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  // Converter HTML para texto formatado
  let texto = html
    // Preservar quebras de linha
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    // Formatar títulos
    .replace(/<h[1-6][^>]*>/gi, '\n\n## ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    // Limpar tags restantes
    .replace(/<[^>]+>/g, '')
    // Decodificar entidades HTML
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    // Limpar espaços excessivos
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  return texto;
}

function limparHtml(texto: string): string {
  if (!texto) return '';
  
  return texto
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
