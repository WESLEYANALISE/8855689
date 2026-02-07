import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AtoExtraido {
  numero_lei: string;
  tipo_ato: string;
  ementa: string;
  data_dou: string | null;
  data_ato: string | null;
  url_planalto: string;
  ordem_dou: number;
}

// Meses em português
const MESES_PT: Record<string, string> = {
  'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
  'abril': '04', 'maio': '05', 'junho': '06', 'julho': '07',
  'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
};

const MESES_NOMES = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 
                    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// Detectar tipo de ato pelo texto/URL
function detectarTipoAto(texto: string, url: string): { tipo: string; numero: string; ano: string } | null {
  // Lei Complementar - Lcp223
  if (url.toLowerCase().includes('/lcp/') || url.match(/Lcp\d+/i) || texto.match(/Lei\s+Complementar/i)) {
    const numMatch = url.match(/Lcp(\d+)/i);
    if (numMatch) {
      const anoMatch = texto.match(/(\d{4})/);
      return { tipo: 'Lei Complementar', numero: numMatch[1], ano: anoMatch?.[1] || new Date().getFullYear().toString() };
    }
  }
  
  // Emenda Constitucional - emc137
  if (url.toLowerCase().includes('/emc/') || url.match(/emc\d+/i) || texto.match(/Emenda\s+Constitucional/i)) {
    const numMatch = url.match(/emc(\d+)/i);
    if (numMatch) {
      const anoMatch = texto.match(/(\d{4})/);
      return { tipo: 'Emenda Constitucional', numero: numMatch[1], ano: anoMatch?.[1] || new Date().getFullYear().toString() };
    }
  }
  
  // Medida Provisória - mpv1330
  if (url.toLowerCase().includes('/mpv/') || url.match(/mpv\d+/i) || texto.match(/Medida\s+Provis[oó]ria/i)) {
    const numMatch = url.match(/mpv(\d+)/i);
    if (numMatch) {
      const anoMatch = texto.match(/(\d{4})/);
      return { tipo: 'Medida Provisória', numero: numMatch[1], ano: anoMatch?.[1] || new Date().getFullYear().toString() };
    }
  }
  
  // Decreto - D12782
  if ((url.toLowerCase().includes('/decreto/') && !url.toLowerCase().includes('decreto-lei')) || url.match(/\/D\d+\.htm/i)) {
    const numMatch = url.match(/D(\d+)\.htm/i);
    if (numMatch) {
      const anoMatch = texto.match(/(\d{4})/);
      return { tipo: 'Decreto', numero: numMatch[1], ano: anoMatch?.[1] || new Date().getFullYear().toString() };
    }
  }
  
  // Lei Ordinária - L15290
  if ((url.toLowerCase().includes('/lei/') && !url.toLowerCase().includes('/lcp/')) || url.match(/\/L\d+\.htm/i)) {
    const numMatch = url.match(/L(\d+)\.htm/i);
    if (numMatch) {
      const anoMatch = texto.match(/(\d{4})/);
      return { tipo: 'Lei Ordinária', numero: numMatch[1], ano: anoMatch?.[1] || new Date().getFullYear().toString() };
    }
  }
  
  return null;
}

// Formatar número com pontos
function formatarNumero(numero: string): string {
  const num = parseInt(numero);
  if (num >= 10000) {
    return `${Math.floor(num / 1000)}.${String(num % 1000).padStart(3, '0')}`;
  }
  return numero;
}

// Extrair data de texto no formato "dd de mês de yyyy" ou "dd.mm.yyyy"
function extrairData(texto: string): string | null {
  // Formato: "19 dezembro de 2025" ou "19 de dezembro de 2025"
  const match1 = texto.match(/(\d{1,2})\s+(?:de\s+)?(\w+)\s+(?:de\s+)?(\d{4})/i);
  if (match1) {
    const dia = match1[1].padStart(2, '0');
    const mesNome = match1[2].toLowerCase();
    const ano = match1[3];
    const mes = MESES_PT[mesNome];
    if (mes) {
      return `${ano}-${mes}-${dia}`;
    }
  }
  
  // Formato: "dd.mm.yyyy" ou "dd/mm/yyyy"
  const match2 = texto.match(/(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})/);
  if (match2) {
    const dia = match2[1].padStart(2, '0');
    const mes = match2[2].padStart(2, '0');
    const ano = match2[3];
    return `${ano}-${mes}-${dia}`;
  }
  
  return null;
}

// Raspar um único mês
async function rasparMes(
  mes: string, 
  ano: number, 
  firecrawlApiKey: string
): Promise<{ success: boolean; html: string; markdown: string; paginaNaoExiste: boolean; error?: string }> {
  // Planalto mudou o padrão de URL em 2026 - não usa mais prefixo do ano
  let baseUrl: string;
  if (ano >= 2026) {
    baseUrl = `https://www4.planalto.gov.br/legislacao/portal-legis/resenha-diaria/${mes}-resenha-diaria`;
  } else {
    baseUrl = `https://www4.planalto.gov.br/legislacao/portal-legis/resenha-diaria/${ano}-resenha-diaria/${mes}-resenha-diaria`;
  }
  
  // Adicionar timestamp para forçar bypass de cache do CDN/servidor
  const cacheBypassUrl = `${baseUrl}?_nocache=${Date.now()}`;
  
  console.log(`[INFO] Raspando: ${mes}/${ano} - URL: ${cacheBypassUrl}`);

  let scrapeData: any = null;
  let lastError = '';
  
  // Configurações de retry com intervalos crescentes
  const retryConfigs = [
    { waitFor: 8000, timeout: 120000, delay: 0 },
    { waitFor: 10000, timeout: 120000, delay: 3000 },
    { waitFor: 15000, timeout: 120000, delay: 5000 },
  ];
  
  for (let tentativa = 0; tentativa < retryConfigs.length; tentativa++) {
    const config = retryConfigs[tentativa];
    
    if (config.delay > 0) {
      console.log(`Aguardando ${config.delay/1000}s antes da tentativa ${tentativa + 1}...`);
      await new Promise(resolve => setTimeout(resolve, config.delay));
    }
    
    console.log(`Tentativa ${tentativa + 1} de scrape (waitFor: ${config.waitFor}ms)...`);
    
    try {
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: cacheBypassUrl,
          formats: ['markdown', 'html'],
          waitFor: config.waitFor,
          timeout: config.timeout,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
      });

      scrapeData = await scrapeResponse.json();

      if (scrapeResponse.ok && scrapeData.success) {
        const htmlSize = scrapeData.data?.html?.length || 0;
        const htmlContent = scrapeData.data?.html || '';
        
        // Verificar se página não existe (ano/mês ainda não criado no Planalto)
        if (htmlContent.includes('esta página não existe') || 
            htmlContent.includes('página não encontrada') ||
            htmlContent.includes('404')) {
          console.log(`[WARN] Página ${mes}/${ano} não existe no Planalto`);
          return { success: false, html: '', markdown: '', paginaNaoExiste: true };
        }
        
        console.log(`Scrape OK na tentativa ${tentativa + 1}! HTML size: ${htmlSize}`);
        
        if (htmlSize > 20000) {
          return { 
            success: true, 
            html: htmlContent, 
            markdown: scrapeData.data?.markdown || '',
            paginaNaoExiste: false 
          };
        } else {
          console.warn(`HTML parece incompleto (${htmlSize} bytes)`);
          lastError = `HTML incompleto: ${htmlSize} bytes`;
        }
      } else {
        lastError = scrapeData.error || 'Unknown error';
        console.error(`Firecrawl error (tentativa ${tentativa + 1}):`, lastError);
      }
    } catch (fetchError) {
      lastError = fetchError instanceof Error ? fetchError.message : 'Fetch error';
      console.error(`Fetch error (tentativa ${tentativa + 1}):`, fetchError);
    }
  }
  
  // Fallback: fetch direto com bypass de cache
  if (!scrapeData?.success || (scrapeData?.data?.html?.length || 0) < 20000) {
    console.log('Tentando fetch direto com bypass de cache...');
    
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    ];
    
    for (let i = 0; i < userAgents.length; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        
        // URL com novo timestamp para cada tentativa
        const directUrl = `${baseUrl}?_nocache=${Date.now()}_${i}`;
        
        const directResponse = await fetch(directUrl, {
          headers: {
            'User-Agent': userAgents[i],
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'pt-BR,pt;q=0.9',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'If-None-Match': '',
            'If-Modified-Since': ''
          },
          signal: controller.signal,
          cache: 'no-store' as RequestCache,
        });
        
        clearTimeout(timeoutId);
        
        if (directResponse.ok) {
          const html = await directResponse.text();
          
          // Verificar se página não existe
          if (html.includes('esta página não existe') || html.includes('404')) {
            console.log(`[WARN] Página ${mes}/${ano} não existe (fetch direto)`);
            return { success: false, html: '', markdown: '', paginaNaoExiste: true };
          }
          
          const temLinks = html.includes('planalto.gov.br/ccivil') || 
                           html.includes('/L1') || html.includes('/D1');
          
          if (html.length > 10000 && temLinks) {
            console.log(`Fetch direto OK! HTML size: ${html.length}`);
            return { success: true, html, markdown: '', paginaNaoExiste: false };
          }
        }
      } catch (e) {
        console.error(`Fetch direto ${i + 1} erro:`, e);
      }
      
      if (i < userAgents.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  return { success: false, html: '', markdown: '', paginaNaoExiste: false, error: lastError };
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
    const anoParam = body.ano;
    const mesParam = body.mes;
    
    const hoje = new Date();
    const mesAtualIdx = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    console.log(`[INFO] Data atual: ${hoje.toISOString()}`);
    
    // Determinar meses para raspar
    // SEMPRE raspar mês atual + mês anterior para garantir cobertura completa
    let mesesParaRaspar: Array<{mes: string, ano: number}> = [];
    
    // Usar parâmetros ou mês atual
    const mesReferencia = mesParam || MESES_NOMES[mesAtualIdx];
    const anoReferencia = anoParam || anoAtual;
    
    // Adicionar o mês solicitado/atual
    mesesParaRaspar.push({ mes: mesReferencia, ano: anoReferencia });
    
    // SEMPRE adicionar o mês anterior também (para pegar leis de fim de mês e quando página do mês atual não existe)
    const idxMes = MESES_NOMES.indexOf(mesReferencia.toLowerCase().replace('ç', 'c').replace('março', 'marco'));
    if (idxMes === 0) {
      // Se janeiro, adicionar dezembro do ano anterior
      mesesParaRaspar.push({ mes: 'dezembro', ano: anoReferencia - 1 });
    } else if (idxMes > 0) {
      // Adicionar mês anterior
      mesesParaRaspar.push({ mes: MESES_NOMES[idxMes - 1], ano: anoReferencia });
    } else {
      // Fallback: se não encontrou o índice, usar mês anterior baseado na data atual
      if (mesAtualIdx === 0) {
        mesesParaRaspar.push({ mes: 'dezembro', ano: anoAtual - 1 });
      } else {
        mesesParaRaspar.push({ mes: MESES_NOMES[mesAtualIdx - 1], ano: anoAtual });
      }
    }
    
    console.log(`[INFO] Meses para raspar: ${mesesParaRaspar.map(m => `${m.mes}/${m.ano}`).join(', ')}`);
    
    // Acumular todos os atos de todos os meses
    let todosAtosExtraidos: AtoExtraido[] = [];
    const atosJaProcessados = new Set<string>();
    let algumMesFuncionou = false;
    
    for (const periodo of mesesParaRaspar) {
      const resultado = await rasparMes(periodo.mes, periodo.ano, firecrawlApiKey);
      
      if (resultado.paginaNaoExiste) {
        console.log(`[INFO] Página ${periodo.mes}/${periodo.ano} não existe, pulando...`);
        continue;
      }
      
      if (!resultado.success) {
        console.log(`[WARN] Falha ao raspar ${periodo.mes}/${periodo.ano}: ${resultado.error}`);
        continue;
      }
      
      algumMesFuncionou = true;
      
      // Extrair atos deste mês
      const atosDoMes = extrairAtosResenha(resultado.html, resultado.markdown, periodo.ano);
      console.log(`[INFO] ${atosDoMes.length} atos encontrados em ${periodo.mes}/${periodo.ano}`);
      
      // Adicionar apenas os não duplicados
      for (const ato of atosDoMes) {
        if (!atosJaProcessados.has(ato.numero_lei)) {
          atosJaProcessados.add(ato.numero_lei);
          todosAtosExtraidos.push(ato);
        }
      }
    }
    
    if (!algumMesFuncionou) {
      console.log('[WARN] Nenhum mês foi raspado com sucesso, retornando dados existentes...');
      
      const { data: existingData } = await supabase
        .from('leis_push_2025')
        .select('*')
        .order('data_dou', { ascending: false })
        .limit(50);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Scraping falhou, retornando dados existentes',
          novos_atos: 0,
          novasLeis: 0,
          total_pagina: existingData?.length || 0,
          scrape_failed: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[INFO] Total de atos únicos encontrados: ${todosAtosExtraidos.length}`);

    if (todosAtosExtraidos.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum ato encontrado na resenha',
          novos_atos: 0,
          total_pagina: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar quais já existem no banco
    const numerosAtos = todosAtosExtraidos.map(a => a.numero_lei);
    const { data: existingAtos } = await supabase
      .from('leis_push_2025')
      .select('numero_lei')
      .in('numero_lei', numerosAtos);

    const existingNumeros = new Set((existingAtos || []).map(a => a.numero_lei));
    const novosAtos = todosAtosExtraidos.filter(a => !existingNumeros.has(a.numero_lei));

    console.log(`[INFO] ${novosAtos.length} atos novos para inserir`);

    // Inserir novos atos
    if (novosAtos.length > 0) {
      const { error: insertError } = await supabase
        .from('leis_push_2025')
        .insert(novosAtos.map(ato => ({
          numero_lei: ato.numero_lei,
          tipo_ato: ato.tipo_ato,
          ementa: ato.ementa,
          data_dou: ato.data_dou,
          data_ato: ato.data_ato,
          data_publicacao: ato.data_dou,
          url_planalto: ato.url_planalto,
          ordem_dou: ato.ordem_dou,
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

    // Agrupar por tipo para retorno
    const porTipo: Record<string, number> = {};
    novosAtos.forEach(ato => {
      porTipo[ato.tipo_ato] = (porTipo[ato.tipo_ato] || 0) + 1;
    });

    // Disparar formatação automática se houver novos atos
    if (novosAtos.length > 0) {
      console.log(`Iniciando formatação automática de ${novosAtos.length} novos atos...`);
      try {
        const formatacaoResponse = await fetch(
          `${supabaseUrl}/functions/v1/automacao-formatacao-leis`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ limite: novosAtos.length + 5 })
          }
        );
        
        if (formatacaoResponse.ok) {
          console.log('Formatação automática iniciada com sucesso');
        } else {
          console.error('Erro ao iniciar formatação:', await formatacaoResponse.text());
        }
      } catch (formatError) {
        console.error('Erro na formatação automática:', formatError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${novosAtos.length} novos atos encontrados e salvos`,
        novos_atos: novosAtos.length,
        novasLeis: novosAtos.length,
        total_pagina: todosAtosExtraidos.length,
        por_tipo: porTipo,
        meses_raspados: mesesParaRaspar.map(m => `${m.mes}/${m.ano}`),
        atos: novosAtos.map(a => ({ numero: a.numero_lei, tipo: a.tipo_ato }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao raspar resenha diária:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extrairAtosResenha(html: string, markdown: string, ano: number): AtoExtraido[] {
  const atos: AtoExtraido[] = [];
  const atosProcessados = new Set<string>();
  let ordem = 0;
  
  console.log('Iniciando extração de atos da resenha...');
  
  // Parse HTML table rows
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let currentDataDou: string | null = null;
  
  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowContent = rowMatch[1];
    
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      cells.push(cellMatch[1]);
    }
    
    if (cells.length < 2) continue;
    
    const primeiraCell = cells[0].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const dataExtraida = extrairData(primeiraCell);
    if (dataExtraida) {
      currentDataDou = dataExtraida;
    }
    
    const segundaCell = cells[1];
    
    const linkRegex = /<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let linkMatch;
    
    while ((linkMatch = linkRegex.exec(segundaCell)) !== null) {
      const urlAto = linkMatch[1];
      const linkText = linkMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      
      const tipoInfo = detectarTipoAto(linkText, urlAto);
      if (!tipoInfo) continue;
      
      const numeroFormatado = formatarNumero(tipoInfo.numero);
      const leiKey = `${tipoInfo.tipo} ${numeroFormatado}/${tipoInfo.ano}`;
      
      if (atosProcessados.has(leiKey)) continue;
      atosProcessados.add(leiKey);
      
      const dataAto = extrairData(linkText);
      
      let ementa = '';
      const posLink = segundaCell.indexOf(linkMatch[0]) + linkMatch[0].length;
      const restoTexto = segundaCell.substring(posLink);
      
      const ementaMatch = restoTexto.match(/^\s*[-–]\s*([\s\S]*?)(?=<br|<a|$)/i);
      if (ementaMatch) {
        ementa = ementaMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      }
      
      if (!ementa) {
        ementa = linkText;
      }
      
      const urlCompleta = urlAto.startsWith('http') ? urlAto : `https://www.planalto.gov.br${urlAto}`;
      
      ordem++;
      console.log(`Ato encontrado: ${leiKey}, Data DOU: ${currentDataDou}`);
      
      atos.push({
        numero_lei: leiKey,
        tipo_ato: tipoInfo.tipo,
        ementa: ementa,
        data_dou: currentDataDou,
        data_ato: dataAto,
        url_planalto: urlCompleta,
        ordem_dou: ordem
      });
    }
  }
  
  // Fallback: Parse do Markdown
  if (atos.length === 0) {
    console.log('Tentando parse via Markdown...');
    
    const linhas = markdown.split('\n');
    let ultimaDataDou: string | null = null;
    
    for (const linha of linhas) {
      if (!linha.includes('|')) continue;
      
      const dataMatch = linha.match(/\|\s*(\d{1,2}\s+\w+\s+(?:de\s+)?\d{4})/i);
      if (dataMatch) {
        const dataExtraida = extrairData(dataMatch[1]);
        if (dataExtraida) {
          ultimaDataDou = dataExtraida;
        }
      }
      
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(linha)) !== null) {
        const linkText = match[1];
        const urlAto = match[2];
        
        const tipoInfo = detectarTipoAto(linkText, urlAto);
        if (!tipoInfo) continue;
        
        const numeroFormatado = formatarNumero(tipoInfo.numero);
        const leiKey = `${tipoInfo.tipo} ${numeroFormatado}/${tipoInfo.ano}`;
        
        if (atosProcessados.has(leiKey)) continue;
        atosProcessados.add(leiKey);
        
        const dataAto = extrairData(linkText);
        
        const posLink = linha.indexOf(match[0]) + match[0].length;
        const resto = linha.substring(posLink);
        const ementaMatch = resto.match(/^\s*[-–]\s*([^|]+)/);
        const ementa = ementaMatch ? ementaMatch[1].trim() : linkText;
        
        const urlCompleta = urlAto.startsWith('http') ? urlAto : `https://www.planalto.gov.br${urlAto}`;
        
        ordem++;
        console.log(`Ato (MD): ${leiKey}, Data DOU: ${ultimaDataDou}`);
        
        atos.push({
          numero_lei: leiKey,
          tipo_ato: tipoInfo.tipo,
          ementa: ementa,
          data_dou: ultimaDataDou,
          data_ato: dataAto,
          url_planalto: urlCompleta,
          ordem_dou: ordem
        });
      }
    }
  }
  
  console.log(`Total de atos extraídos: ${atos.length}`);
  return atos;
}
