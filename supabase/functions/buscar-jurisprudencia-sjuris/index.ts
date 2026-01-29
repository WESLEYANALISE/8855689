const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { termo, pagina = 1, limite = 10 } = await req.json();

    if (!termo || termo.length < 3) {
      return new Response(
        JSON.stringify({ success: false, error: 'Termo de busca deve ter pelo menos 3 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('[SJURIS] FIRECRAWL_API_KEY não configurada');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl não configurado. Configure o conector nas configurações.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[SJURIS] Buscando: "${termo}" via Firecrawl com Actions`);

    // ESTRATÉGIA 1: Usar Firecrawl Actions para navegar na SPA Angular
    let resultados: any[] = [];
    let metodo = '';
    let erro = '';

    try {
      resultados = await tentarSJURISComActions(termo, apiKey);
      metodo = 'firecrawl-actions-sjuris';
    } catch (e) {
      console.log('[SJURIS] Método Actions falhou:', e);
      erro = e instanceof Error ? e.message : String(e);
    }

    // ESTRATÉGIA 2: Tentar PJe 2º Grau do TJCE como fallback
    if (resultados.length === 0) {
      console.log('[SJURIS] Tentando fallback via PJe TJCE...');
      try {
        resultados = await tentarPJeTJCE(termo, apiKey);
        metodo = 'firecrawl-pje-tjce';
      } catch (e) {
        console.log('[SJURIS] PJe TJCE também falhou:', e);
        erro += ' | PJe: ' + (e instanceof Error ? e.message : String(e));
      }
    }

    // ESTRATÉGIA 3: Tentar busca via Google para TJCE
    if (resultados.length === 0) {
      console.log('[SJURIS] Tentando fallback via Google...');
      try {
        resultados = await tentarBuscaGoogle(termo, apiKey);
        metodo = 'firecrawl-google-tjce';
      } catch (e) {
        console.log('[SJURIS] Google também falhou:', e);
      }
    }

    console.log(`[SJURIS] Resultados finais: ${resultados.length} via ${metodo}`);

    // Se nenhuma estratégia funcionou, retornar mensagem explicativa
    if (resultados.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          resultados: [],
          total: 0,
          pagina,
          termo,
          tribunal: 'TJCE',
          fonte: 'SJURIS',
          metodo: 'nenhum',
          avisoTribunal: 'O sistema SJURIS do TJCE está temporariamente inacessível. O sistema utiliza uma SPA Angular que dificulta a extração automatizada. Por favor, tente novamente mais tarde ou acesse diretamente: https://sjuris.tjce.jus.br/tela-consulta',
          linkDireto: 'https://sjuris.tjce.jus.br/tela-consulta'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        resultados: resultados.slice(0, limite),
        total: resultados.length,
        pagina,
        termo,
        tribunal: 'TJCE',
        fonte: 'SJURIS',
        metodo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SJURIS] Erro geral:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro ao buscar jurisprudência' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ESTRATÉGIA 1: Usar Firecrawl Actions para interagir com a SPA Angular
async function tentarSJURISComActions(termo: string, apiKey: string): Promise<any[]> {
  console.log('[SJURIS] Iniciando scrape com Actions...');
  
  // A SPA Angular do SJURIS carrega em https://sjuris.tjce.jus.br/tela-consulta
  // Seletores identificados:
  // - Campo de busca: input dentro do formulário
  // - Botão buscar: button com texto "Pesquisar" ou mat-button
  
  const firecrawlBody = {
    url: 'https://sjuris.tjce.jus.br/tela-consulta',
    formats: ['html', 'markdown', 'screenshot'],
    waitFor: 8000, // 8s para SPA Angular carregar completamente
    timeout: 120000, // 2 minutos total
    onlyMainContent: false,
    actions: [
      // Aguardar página carregar completamente
      { type: 'wait', milliseconds: 5000 },
      // Digitar no campo de busca (usando seletor genérico para Angular Material)
      { type: 'write', text: termo, selector: 'input.mat-input-element, input[matinput], input[type="text"], textarea' },
      // Pequena pausa antes de clicar
      { type: 'wait', milliseconds: 500 },
      // Clicar no botão de busca (Angular Material button)
      { type: 'click', selector: 'button.mat-raised-button, button.mat-button, button[type="submit"], button.btn-primary, .mat-flat-button' },
      // Aguardar resultados carregarem
      { type: 'wait', milliseconds: 10000 }
    ]
  };

  console.log('[SJURIS] Actions configurados:', JSON.stringify(firecrawlBody.actions));

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(firecrawlBody),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[SJURIS] Erro Firecrawl Actions:', data);
    throw new Error(data.error || `Status ${response.status}`);
  }

  const html = data.data?.html || data.html || '';
  const markdown = data.data?.markdown || data.markdown || '';

  console.log(`[SJURIS] Actions - HTML: ${html.length} chars, Markdown: ${markdown.length} chars`);
  
  if (markdown) {
    console.log('[SJURIS] Actions - Markdown preview:', markdown.substring(0, 2000));
  }

  return extrairResultadosSJURIS(html, markdown);
}

// ESTRATÉGIA 2: Tentar PJe 2º Grau do TJCE
async function tentarPJeTJCE(termo: string, apiKey: string): Promise<any[]> {
  console.log('[SJURIS] Tentando PJe TJCE...');
  
  // PJe TJCE - Consulta pública de jurisprudência
  // URL base: https://pje.tjce.jus.br
  
  const searchUrl = `https://pje.tjce.jus.br/pje2grau/Processo/ConsultaProcesso/listView.seam`;
  
  const firecrawlBody = {
    url: searchUrl,
    formats: ['html', 'markdown'],
    waitFor: 8000,
    timeout: 60000,
    onlyMainContent: false
  };

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(firecrawlBody),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Status ${response.status}`);
  }

  const html = data.data?.html || data.html || '';
  const markdown = data.data?.markdown || data.markdown || '';

  console.log(`[SJURIS] PJe - HTML: ${html.length} chars`);

  return extrairResultadosSJURIS(html, markdown);
}

// ESTRATÉGIA 3: Busca via Google site:sjuris.tjce.jus.br
async function tentarBuscaGoogle(termo: string, apiKey: string): Promise<any[]> {
  console.log('[SJURIS] Tentando via Firecrawl Search...');
  
  const response = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `site:sjuris.tjce.jus.br ${termo}`,
      limit: 10,
      lang: 'pt-BR',
      country: 'BR',
      scrapeOptions: {
        formats: ['markdown']
      }
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Busca falhou');
  }

  const resultados: any[] = [];
  
  if (data.data && Array.isArray(data.data)) {
    for (const item of data.data) {
      const markdown = item.markdown || item.description || '';
      const url = item.url || '';
      
      // Extrair número do processo da URL ou conteúdo
      const matchProcesso = url.match(/processo[=\/]([^&\/]+)/) || 
                           markdown.match(/(\d{7}-\d{2}\.\d{4}\.8\.06\.\d{4})/);
      
      if (matchProcesso || markdown.length > 100) {
        resultados.push({
          id: `TJCE-google-${resultados.length}`,
          numeroProcesso: matchProcesso ? matchProcesso[1] : '',
          classe: 'Acórdão',
          relator: '',
          orgaoJulgador: '',
          dataJulgamento: null,
          dataRegistro: null,
          ementa: markdown.substring(0, 500),
          linkInteiroTeor: url,
          tribunal: 'TJCE',
          fonte: 'SJURIS (via Google)'
        });
      }
    }
  }

  console.log(`[SJURIS] Google - ${resultados.length} resultados`);
  return resultados;
}

function extrairResultadosSJURIS(html: string, markdown: string): any[] {
  const resultados: any[] = [];
  const processosEncontrados = new Set<string>();
  
  try {
    // Padrão 1: Números de processo TJCE (CNJ) - formato 8.06 é CE
    const regexProcessoCNJ = /(\d{7}-\d{2}\.\d{4}\.8\.06\.\d{4})/g;
    
    let match;
    while ((match = regexProcessoCNJ.exec(html)) !== null) {
      processosEncontrados.add(match[1]);
    }
    while ((match = regexProcessoCNJ.exec(markdown)) !== null) {
      processosEncontrados.add(match[1]);
    }

    // Padrão 2: Formato genérico CNJ
    const regexCNJGenerico = /(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/g;
    while ((match = regexCNJGenerico.exec(html)) !== null) {
      processosEncontrados.add(match[1]);
    }
    while ((match = regexCNJGenerico.exec(markdown)) !== null) {
      processosEncontrados.add(match[1]);
    }

    console.log(`[SJURIS] Processos encontrados: ${processosEncontrados.size}`);

    // Para cada processo, extrair dados
    for (const numeroProcesso of processosEncontrados) {
      const resultado = extrairDadosProcesso(html, markdown, numeroProcesso);
      resultados.push(resultado);
    }

    // Se não encontrou por número, tentar extrair do markdown estruturado
    if (resultados.length === 0 && markdown) {
      const resultadosMarkdown = extrairDoMarkdown(markdown);
      resultados.push(...resultadosMarkdown);
    }

  } catch (e) {
    console.error('[SJURIS] Erro na extração:', e);
  }
  
  return resultados;
}

function extrairDadosProcesso(html: string, markdown: string, numeroProcesso: string): any {
  const resultado: any = {
    id: `TJCE-${numeroProcesso.replace(/\D/g, '')}`,
    numeroProcesso,
    classe: 'Acórdão',
    relator: '',
    orgaoJulgador: '',
    dataJulgamento: null,
    dataRegistro: null,
    ementa: '',
    linkInteiroTeor: `https://sjuris.tjce.jus.br/pesquisa?processo=${encodeURIComponent(numeroProcesso)}`,
    tribunal: 'TJCE',
    fonte: 'SJURIS'
  };

  try {
    const posHtml = html.indexOf(numeroProcesso);
    const posMarkdown = markdown.indexOf(numeroProcesso);
    
    const contextoHtml = posHtml > -1 ? html.substring(Math.max(0, posHtml - 500), posHtml + 1500) : '';
    const contextoMd = posMarkdown > -1 ? markdown.substring(Math.max(0, posMarkdown - 500), posMarkdown + 1500) : '';
    const contexto = contextoHtml + ' ' + contextoMd;

    // Extrair relator
    const matchRelator = contexto.match(/[Rr]elator[a]?[:\s]+([^<\n,]+)/);
    if (matchRelator) {
      resultado.relator = limparTexto(matchRelator[1]);
    }

    // Extrair órgão julgador
    const matchOrgao = contexto.match(/(\d+[ªº]?\s*(?:Câmara|Turma|Seção)[^<\n,]*)/i);
    if (matchOrgao) {
      resultado.orgaoJulgador = limparTexto(matchOrgao[1]);
    }

    // Extrair classe
    const matchClasse = contexto.match(/(?:Classe|Tipo)[:\s]+([^<\n,]+)/i);
    if (matchClasse) {
      resultado.classe = limparTexto(matchClasse[1]);
    } else if (contexto.includes('Apelação')) {
      resultado.classe = 'Apelação Cível';
    } else if (contexto.includes('Agravo')) {
      resultado.classe = 'Agravo de Instrumento';
    } else if (contexto.includes('Habeas')) {
      resultado.classe = 'Habeas Corpus';
    }

    // Extrair data
    const matchData = contexto.match(/(?:Julgamento|Julgado|Data)[:\s]*(\d{2}\/\d{2}\/\d{4})/i);
    if (matchData) {
      resultado.dataJulgamento = matchData[1];
    } else {
      const matchDataGenerico = contexto.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (matchDataGenerico) {
        resultado.dataJulgamento = matchDataGenerico[1];
      }
    }

    // Extrair ementa
    const matchEmenta = contexto.match(/[Ee]menta[:\s]*([^<]{50,800})/);
    if (matchEmenta) {
      resultado.ementa = limparTexto(matchEmenta[1]);
    } else {
      const blocos = contexto.split(/[<>\n]/).filter(b => b.length > 80);
      if (blocos.length > 0) {
        resultado.ementa = limparTexto(blocos[0].substring(0, 500));
      }
    }

  } catch (e) {
    console.error('[SJURIS] Erro ao extrair dados do processo:', e);
  }

  return resultado;
}

function extrairDoMarkdown(markdown: string): any[] {
  const resultados: any[] = [];
  const linhas = markdown.split('\n');
  let processoAtual: any = null;
  
  for (const linha of linhas) {
    if (linha.includes('Acórdão') || linha.includes('Processo') || linha.includes('Decisão')) {
      if (processoAtual && processoAtual.numeroProcesso) {
        resultados.push(processoAtual);
      }
      processoAtual = {
        id: `TJCE-${Date.now()}-${resultados.length}`,
        numeroProcesso: '',
        classe: 'Acórdão',
        relator: '',
        orgaoJulgador: '',
        dataJulgamento: null,
        dataRegistro: null,
        ementa: '',
        linkInteiroTeor: '',
        tribunal: 'TJCE',
        fonte: 'SJURIS'
      };
    }
    
    if (processoAtual) {
      const matchNum = linha.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
      if (matchNum) {
        processoAtual.numeroProcesso = matchNum[0];
        processoAtual.linkInteiroTeor = `https://sjuris.tjce.jus.br/pesquisa?processo=${encodeURIComponent(matchNum[0])}`;
      }
      
      if (linha.toLowerCase().includes('relator')) {
        const relator = linha.replace(/.*[Rr]elator[a]?[:.\s]*/i, '').trim();
        if (relator) processoAtual.relator = relator;
      }
      
      if (linha.toLowerCase().includes('câmara') || linha.toLowerCase().includes('turma')) {
        processoAtual.orgaoJulgador = linha.trim();
      }
      
      const matchData = linha.match(/\d{2}\/\d{2}\/\d{4}/);
      if (matchData) {
        processoAtual.dataJulgamento = matchData[0];
      }
      
      if (linha.length > 50 && !linha.includes(':')) {
        processoAtual.ementa += (processoAtual.ementa ? ' ' : '') + linha.trim();
      }
    }
  }
  
  if (processoAtual && processoAtual.numeroProcesso) {
    resultados.push(processoAtual);
  }
  
  return resultados;
}

function limparTexto(texto: string): string {
  return texto
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
