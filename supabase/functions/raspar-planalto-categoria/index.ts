import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AtoExtraido {
  numero_lei: string;
  tipo_ato: string;
  ementa: string;
  data_dou: string | null;      // Data de publicação no DOU
  data_ato: string | null;      // Data oficial do ato jurídico
  url_planalto: string;
}

// Mapeamento de categorias para URLs e tipos - URLs oficiais do Planalto
const CATEGORIAS = {
  'pec': {
    label: 'Emenda Constitucional',
    tipo: 'Emenda Constitucional',
    urlBase: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/',
    urlLista: 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/emendas-constitucionais-1',
    pattern: /emc(\d+)/i
  },
  'leis-complementares': {
    label: 'Lei Complementar',
    tipo: 'Lei Complementar',
    urlBase: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/',
    urlLista: 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/leis-complementares-1/todas-as-leis-complementares-1',
    pattern: /Lcp(\d+)/i
  },
  'leis-ordinarias': {
    label: 'Lei Ordinária',
    tipo: 'Lei Ordinária',
    urlBase: (ano: number) => `https://www.planalto.gov.br/ccivil_03/_ato${getAtoRange(ano)}/${ano}/lei/`,
    urlLista: (ano: number) => `https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/leis-ordinarias/${ano}-leis-ordinarias`,
    pattern: /L(\d+)/i
  },
  // 'leis-delegadas' removido - não é mais necessário raspar
  'medidas-provisorias': {
    label: 'Medida Provisória',
    tipo: 'Medida Provisória',
    urlBase: (ano: number) => `https://www.planalto.gov.br/ccivil_03/_ato${getAtoRange(ano)}/${ano}/mpv/`,
    urlLista: (ano: number) => `https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/medidas-provisorias/${ano}-702`,
    pattern: /Mpv(\d+)/i
  },
  'decretos': {
    label: 'Decreto',
    tipo: 'Decreto',
    urlBase: (ano: number) => `https://www.planalto.gov.br/ccivil_03/_ato${getAtoRange(ano)}/${ano}/decreto/`,
    urlLista: (ano: number) => `https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/decretos1/${ano}-decretos`,
    pattern: /D(\d+)/i
  },
  'decretos-lei': {
    label: 'Decreto-Lei',
    tipo: 'Decreto-Lei',
    urlBase: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/',
    urlLista: 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/decretos-leis',
    pattern: /Del(\d+)/i
  },
  'projetos-lei': {
    label: 'Projeto de Lei',
    tipo: 'Projeto de Lei',
    urlBase: 'https://www.camara.leg.br/propostas-legislativas/',
    urlLista: 'https://www.camara.leg.br/busca-portal/proposicoes/pesquisa-simplificada?order=relevancia&tipoProposicao=PL',
    pattern: /PL\s*(\d+)/i
  },
  'plp': {
    label: 'Projeto de Lei Complementar',
    tipo: 'Projeto de Lei Complementar',
    urlBase: 'https://www.camara.leg.br/propostas-legislativas/',
    urlLista: 'https://www.camara.leg.br/busca-portal/proposicoes/pesquisa-simplificada?order=relevancia&tipoProposicao=PLP',
    pattern: /PLP\s*(\d+)/i
  }
};

// Determinar range de atos do Planalto por ano
function getAtoRange(ano: number): string {
  if (ano >= 2023) return '2023-2026';
  if (ano >= 2019) return '2019-2022';
  if (ano >= 2015) return '2015-2018';
  if (ano >= 2011) return '2011-2014';
  if (ano >= 2007) return '2007-2010';
  return '2004-2006';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const categoria = body.categoria || 'leis-ordinarias';
    const ano = body.ano || new Date().getFullYear();
    
    const categoriaConfig = CATEGORIAS[categoria as keyof typeof CATEGORIAS];
    if (!categoriaConfig) {
      return new Response(
        JSON.stringify({ success: false, error: `Categoria inválida: ${categoria}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determinar URL da lista baseado na categoria
    let url: string;
    if (typeof categoriaConfig.urlLista === 'function') {
      url = categoriaConfig.urlLista(ano);
    } else {
      url = categoriaConfig.urlLista;
    }
    
    console.log(`Raspando ${categoriaConfig.label} de ${ano}: ${url}`);

    // Scrape usando Firecrawl
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        waitFor: 5000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Firecrawl error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to scrape Planalto' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = scrapeData.data?.html || '';
    const markdown = scrapeData.data?.markdown || '';
    
    console.log('Conteúdo raspado, analisando atos...');

    // Extrair atos do conteúdo
    const atosExtraidos = extrairAtosCategoria(html, markdown, categoriaConfig, ano);
    
    console.log(`${atosExtraidos.length} atos encontrados na página`);

    if (atosExtraidos.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum ato encontrado na página',
          novos_atos: 0,
          total_pagina: 0,
          categoria: categoriaConfig.label
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar quais já existem
    const numerosAtos = atosExtraidos.map(a => a.numero_lei);
    const { data: existingAtos } = await supabase
      .from('leis_push_2025')
      .select('numero_lei')
      .in('numero_lei', numerosAtos);

    const existingNumeros = new Set((existingAtos || []).map(a => a.numero_lei));
    const novosAtos = atosExtraidos.filter(a => !existingNumeros.has(a.numero_lei));

    console.log(`${novosAtos.length} atos novos para inserir`);

    // Inserir novos atos
    if (novosAtos.length > 0) {
      const { error: insertError } = await supabase
        .from('leis_push_2025')
        .insert(novosAtos.map(ato => ({
          numero_lei: ato.numero_lei,
          tipo_ato: ato.tipo_ato,
          ementa: ato.ementa,
          data_dou: ato.data_dou,           // Data do DOU
          data_ato: ato.data_ato,           // Data do ato
          data_publicacao: ato.data_dou,    // Manter retrocompatibilidade
          url_planalto: ato.url_planalto,
          status: 'pendente'
        })));

      if (insertError) {
        console.error('Erro ao inserir atos:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${novosAtos.length} novos atos encontrados e salvos`,
        novos_atos: novosAtos.length,
        novasLeis: novosAtos.length,
        total_pagina: atosExtraidos.length,
        categoria: categoriaConfig.label,
        atos: novosAtos.map(a => a.numero_lei)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao raspar categoria:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extrairAtosCategoria(html: string, markdown: string, config: any, ano: number): AtoExtraido[] {
  const atos: AtoExtraido[] = [];
  
  const mesesPt: Record<string, string> = {
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
    'abril': '04', 'maio': '05', 'junho': '06', 'julho': '07',
    'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
  };
  
  // Parse HTML table rows - padrão do Planalto
  const rowRegex = /<tr\s+class="visaoQuadrosTr"[^>]*>([\s\S]*?)<\/tr>/gi;
  
  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowContent = rowMatch[1];
    
    // Extrair as células da linha
    const cellRegex = /<td\s+class="visaoQuadrosTd"[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      cells.push(cellMatch[1]);
    }
    
    if (cells.length < 2) continue;
    
    // PRIMEIRA CÉLULA: Contém o LINK do decreto + texto "Publicado no DOU de..."
    const primeiraCell = cells[0];
    
    // SEGUNDA CÉLULA: Contém a EMENTA
    const segundaCell = cells[1];
    
    // Extrair link e info do ato da PRIMEIRA célula
    const linkMatch = primeiraCell.match(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    
    const url = linkMatch[1];
    const linkText = linkMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    
    // Extrair número do ato
    const numMatch = url.match(config.pattern);
    if (!numMatch) continue;
    
    const numero = numMatch[1];
    
    // Extrair texto completo da primeira célula (para pegar data do DOU)
    const textoPrimeiraCell = primeiraCell.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    
    // ======= EXTRAIR DATA DO DOU (prioridade) =======
    // Formato: "Publicado no DOU de dd.mm.yyyy" ou "DOU de dd/mm/yyyy"
    let dataDou: string | null = null;
    
    const douMatch1 = textoPrimeiraCell.match(/DOU\s+de\s+(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})/i);
    if (douMatch1) {
      const dia = douMatch1[1].padStart(2, '0');
      const mes = douMatch1[2].padStart(2, '0');
      const anoData = douMatch1[3];
      dataDou = `${anoData}-${mes}-${dia}`;
    }
    
    // Fallback DOU: formato numérico simples na primeira célula (após o link)
    if (!dataDou) {
      const douMatch2 = textoPrimeiraCell.match(/(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})/);
      if (douMatch2) {
        const dia = douMatch2[1].padStart(2, '0');
        const mes = douMatch2[2].padStart(2, '0');
        const anoData = douMatch2[3];
        dataDou = `${anoData}-${mes}-${dia}`;
      }
    }
    
    // ======= EXTRAIR DATA DO ATO (da lei/decreto) =======
    // Formato: "Lei nº 15.290, de 18 de dezembro de 2025"
    let dataAto: string | null = null;
    
    const atoMatch1 = linkText.match(/(\d{1,2})\s+(?:de\s+)?(\w+)\s+(?:de\s+)?(\d{4})/i);
    if (atoMatch1) {
      const dia = atoMatch1[1].padStart(2, '0');
      const mesNome = atoMatch1[2].toLowerCase();
      const anoData = atoMatch1[3];
      const mes = mesesPt[mesNome];
      if (mes) {
        dataAto = `${anoData}-${mes}-${dia}`;
      }
    }
    
    // Fallback data ato: formato numérico "de dd.mm.yyyy"
    if (!dataAto) {
      const atoMatch2 = linkText.match(/de\s+(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})/);
      if (atoMatch2) {
        const dia = atoMatch2[1].padStart(2, '0');
        const mes = atoMatch2[2].padStart(2, '0');
        const anoData = atoMatch2[3];
        dataAto = `${anoData}-${mes}-${dia}`;
      }
    }
    
    // Extrair ementa da SEGUNDA célula
    const ementa = segundaCell
      .replace(/<[^>]+>/g, ' ') // Remove tags
      .replace(/\s+/g, ' ')
      .trim();
    
    // Formatar número do ato
    const numeroFormatado = formatarNumero(numero);
    const leiKey = `${config.tipo} ${numeroFormatado}/${ano}`;
    
    console.log(`Ato: ${leiKey}, Data DOU: ${dataDou}, Data Ato: ${dataAto}`);
    
    // Evitar duplicatas
    if (!atos.find(a => a.numero_lei === leiKey)) {
      atos.push({
        numero_lei: leiKey,
        tipo_ato: config.tipo,
        ementa: ementa,
        data_dou: dataDou,
        data_ato: dataAto,
        url_planalto: url.startsWith('http') ? url : `https://www.planalto.gov.br${url}`
      });
    }
  }
  
  return atos;
}

function formatarNumero(numero: string): string {
  const num = parseInt(numero);
  if (num >= 10000) {
    return `${Math.floor(num / 1000)}.${String(num % 1000).padStart(3, '0')}`;
  }
  return numero;
}
