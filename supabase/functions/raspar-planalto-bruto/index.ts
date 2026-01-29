import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * ETAPA 1: Raspagem do Texto Bruto do Planalto
 * - Usa apenas Firecrawl para raspar a página
 * - Retorna HTML/Markdown bruto sem nenhum processamento
 * - Extrai data de atualização da página
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { urlPlanalto, tableName } = await req.json();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🌐 ETAPA 1: RASPAGEM BRUTA DO PLANALTO');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📋 Tabela: ${tableName}`);
  console.log(`🔗 URL: ${urlPlanalto}`);

  try {
    if (!urlPlanalto) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL do Planalto é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API Key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📡 Iniciando raspagem com Firecrawl...');

    // Raspar página COMPLETA do Planalto
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: urlPlanalto,
        formats: ['markdown', 'html'],
        onlyMainContent: false,
        waitFor: 3000,
        timeout: 60000,
      }),
    });

    const firecrawlData = await firecrawlResponse.json();

    if (!firecrawlResponse.ok) {
      console.error('❌ Erro Firecrawl:', firecrawlData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: firecrawlData.error || 'Erro ao raspar página' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = firecrawlData.data?.markdown || firecrawlData.markdown || '';
    const html = firecrawlData.data?.html || firecrawlData.html || '';

    // IMPORTANTE: Para leis com tabelas grandes, usar HTML é mais confiável
    // pois o markdown do Firecrawl pode truncar tabelas
    const temTabelas = html.includes('<table') || html.includes('<TABLE');
    
    // Escolher melhor fonte: se tiver tabelas grandes, preferir HTML
    let textoBruto = markdown;
    if (temTabelas && html.length > markdown.length) {
      console.log(`📊 Detectadas tabelas - usando HTML (${html.length} chars) em vez de markdown (${markdown.length} chars)`);
      textoBruto = html;
    }

    if (!textoBruto || textoBruto.length < 100) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Conteúdo insuficiente raspado da página' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Raspagem concluída: ${textoBruto.length} caracteres (markdown: ${markdown.length}, html: ${html.length})`);

    // Extrair data de atualização da lei (usar markdown para regex de data)
    const dataAtualizacao = extrairDataAtualizacao(textoBruto);
    console.log(`📅 Data de atualização: ${dataAtualizacao.data || 'não encontrada'}`);

    // Contar referências a artigos no texto bruto
    const artigosDetectados = (textoBruto.match(/Art\.?\s*\d+/gi) || []).length;
    console.log(`📊 Artigos detectados no texto bruto: ${artigosDetectados}`);

    // Verificar menções a revogado/vetado
    const revogados = (textoBruto.match(/revogad[oa]/gi) || []).length;
    const vetados = (textoBruto.match(/vetad[oa]/gi) || []).length;

    return new Response(
      JSON.stringify({
        success: true,
        textoBruto: textoBruto, // Retorna HTML ou markdown, o que for mais completo
        htmlBruto: html,
        markdownBruto: markdown,
        usouHtml: temTabelas && html.length > markdown.length,
        caracteres: textoBruto.length,
        artigosDetectados,
        revogados,
        vetados,
        dataAtualizacao: dataAtualizacao.data,
        anoAtualizacao: dataAtualizacao.ano,
        diasAtras: dataAtualizacao.diasAtras,
        urlOriginal: urlPlanalto,
        tableName,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na raspagem:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Função para extrair a data da ÚLTIMA alteração legislativa (redação dada, incluído, revogado, etc.)
function extrairDataAtualizacao(texto: string): { data?: string; ano?: number; diasAtras?: number; totalAlteracoes?: number } {
  const meses: Record<string, string> = {
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
    'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
    'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12',
    'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
    'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
    'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
  };

  const todasDatas: Date[] = [];
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();

  // IMPORTANTE: Remover URLs do texto para evitar pegar anos de paths como "_Ato2023-2026"
  const textoSemUrls = texto
    .replace(/https?:\/\/[^\s\)]+/gi, '') // Remove URLs completas
    .replace(/\/ccivil_03\/[^\s\)]+/gi, '') // Remove paths do planalto
    .replace(/_Ato\d{4}-\d{4}/gi, '') // Remove padrões como _Ato2023-2026
    .replace(/\[\s*Incluído[^\]]*\]/gi, '') // Mantém apenas texto limpo
    .replace(/\[\s*Redação[^\]]*\]/gi, '');

  // Função para validar e adicionar data (rejeita datas futuras)
  const adicionarData = (dia: number, mes: number, ano: number) => {
    if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && ano >= 1900 && ano <= anoAtual) {
      const data = new Date(ano, mes - 1, dia);
      if (!isNaN(data.getTime()) && data <= hoje) {
        todasDatas.push(data);
        return true;
      }
    }
    return false;
  };

  let match;

  // Padrão 1: Datas no formato dd.mm.yyyy ou dd/mm/yyyy após palavras-chave
  // Ex: "Redação dada pela Lei nº 7.209, de 11.7.1984"
  const padraoDDMMYYYY = /(?:Reda[çc][ãa]o\s+dada|Inclu[ií]d[oa]|Revogad[oa]|Vetad[oa]|Alterad[oa]|Acrescid[oa]|Acrescentad[oa]|Modificad[oa]|Vigência)[^)]*?(\d{1,2})[./](\d{1,2})[./](\d{4})/gi;
  while ((match = padraoDDMMYYYY.exec(texto)) !== null) {
    const dia = parseInt(match[1]);
    const mes = parseInt(match[2]);
    const ano = parseInt(match[3]);
    if (ano <= anoAtual) { // Validação extra
      adicionarData(dia, mes, ano);
    }
  }

  // Padrão 2: Datas por extenso "de XX de MMMM de YYYY" após palavras-chave
  // Ex: "Lei nº 14.230, de 25 de outubro de 2021"
  const padraoPorExtenso = /(?:Reda[çc][ãa]o\s+dada|Inclu[ií]d[oa]|Revogad[oa]|Vetad[oa]|Alterad[oa]|Acrescid[oa]|Acrescentad[oa]|Modificad[oa]|Vigência)[^)]*?de\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/gi;
  while ((match = padraoPorExtenso.exec(texto)) !== null) {
    const dia = parseInt(match[1]);
    const mesNome = match[2].toLowerCase();
    const mes = meses[mesNome];
    const ano = parseInt(match[3]);
    if (mes && ano <= anoAtual) {
      adicionarData(dia, parseInt(mes), ano);
    }
  }

  // Padrão 3: Lei/Decreto/MP com data no formato "Lei nº X.XXX, de DD de MMMM de YYYY"
  // Mas APENAS dentro de parênteses após Incluído/Redação (para pegar apenas alterações)
  const padraoLeiAlteracao = /\((?:Incluído|Redação dada)[^)]*Lei\s+(?:Complementar\s+)?n[ºo°]?\s*[\d.]+[,\s]+de\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})\)/gi;
  while ((match = padraoLeiAlteracao.exec(texto)) !== null) {
    const dia = parseInt(match[1]);
    const mesNome = match[2].toLowerCase();
    const mes = meses[mesNome];
    const ano = parseInt(match[3]);
    if (mes && ano <= anoAtual) {
      adicionarData(dia, parseInt(mes), ano);
    }
  }

  // Padrão 4: Lei com data no formato "Lei nº X.XXX, de DD.MM.YYYY" dentro de alterações
  const padraoLeiData = /\((?:Incluído|Redação dada)[^)]*Lei\s+(?:Complementar\s+)?n[ºo°]?\s*[\d.]+[,\s]+de\s+(\d{1,2})[./](\d{1,2})[./](\d{4})\)/gi;
  while ((match = padraoLeiData.exec(texto)) !== null) {
    const dia = parseInt(match[1]);
    const mes = parseInt(match[2]);
    const ano = parseInt(match[3]);
    if (ano <= anoAtual) {
      adicionarData(dia, mes, ano);
    }
  }

  // Padrão 5: Emendas Constitucionais
  const padraoEC = /Emenda\s+Constitucional\s+n[ºo°]?\s*\d+[^)]*?de\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/gi;
  while ((match = padraoEC.exec(texto)) !== null) {
    const dia = parseInt(match[1]);
    const mesNome = match[2].toLowerCase();
    const mes = meses[mesNome];
    const ano = parseInt(match[3]);
    if (mes && ano <= anoAtual) {
      adicionarData(dia, parseInt(mes), ano);
    }
  }

  // Padrão 6: Decreto com data em parênteses de alteração
  const padraoDecreto = /\((?:Incluído|Redação dada|Regulamento)[^)]*Decreto\s+n[ºo°]?\s*[\d.]+[,\s]+de\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})\)/gi;
  while ((match = padraoDecreto.exec(texto)) !== null) {
    const dia = parseInt(match[1]);
    const mesNome = match[2].toLowerCase();
    const mes = meses[mesNome];
    const ano = parseInt(match[3]);
    if (mes && ano <= anoAtual) {
      adicionarData(dia, parseInt(mes), ano);
    }
  }

  console.log(`[DATA] Total de datas de alteração encontradas: ${todasDatas.length}`);

  if (todasDatas.length === 0) {
    // Fallback: procurar anos recentes no texto LIMPO (sem URLs)
    // Usar texto limpo para evitar pegar anos de URLs
    const anosEncontrados = textoSemUrls.match(/\b(19\d{2}|20[0-2]\d)\b/g);
    if (anosEncontrados && anosEncontrados.length > 0) {
      // Filtrar anos que não sejam futuros
      const anosValidos = anosEncontrados
        .map(a => parseInt(a))
        .filter(a => a <= anoAtual && a >= 1988); // Mínimo 1988 (CF)
      
      if (anosValidos.length > 0) {
        const anoMaisRecente = Math.max(...anosValidos);
        console.log(`[DATA] Fallback - ano mais recente encontrado (não futuro): ${anoMaisRecente}`);
        return {
          data: `31/12/${anoMaisRecente}`,
          ano: anoMaisRecente,
          diasAtras: Math.floor((hoje.getTime() - new Date(anoMaisRecente, 11, 31).getTime()) / (1000 * 60 * 60 * 24)),
          totalAlteracoes: 0
        };
      }
    }
    console.log('[DATA] Nenhuma data válida encontrada');
    return {};
  }

  // Encontrar a data mais RECENTE entre todas (que não seja futura)
  const datasValidas = todasDatas.filter(d => d <= hoje);
  
  if (datasValidas.length === 0) {
    console.log('[DATA] Todas as datas encontradas são futuras');
    return {};
  }

  const dataMaisRecente = datasValidas.reduce((a, b) => a > b ? a : b);
  
  const diasAtras = Math.floor((hoje.getTime() - dataMaisRecente.getTime()) / (1000 * 60 * 60 * 24));
  
  const dataFormatada = dataMaisRecente.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  console.log(`[DATA] Data mais recente encontrada: ${dataFormatada} (${datasValidas.length} alterações válidas)`);

  return {
    data: dataFormatada,
    ano: dataMaisRecente.getFullYear(),
    diasAtras: Math.max(0, diasAtras),
    totalAlteracoes: datasValidas.length
  };
}
