const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface JurisprudenciaItem {
  tipo: string;
  titulo: string;
  texto: string;
  enunciado?: string;      // Texto curto do enunciado (abaixo do Tema)
  ementa?: string;
  tese?: string;
  tribunal?: string;
  numero?: string;
  data?: string;
  relator?: string;
  link?: string;
  linkInteiroTeor?: string;
  linkTese?: string;       // Link "ver tese" (Repercussão Geral)
  linkEmenta?: string;     // Link "ver ementa" (Repercussão Geral)
  textoTese?: string;      // Texto completo da tese (extraído diretamente)
  textoEmenta?: string;    // Texto completo da ementa (extraído diretamente)
  posicionamentosSemelhantes?: number;
  destaques?: string; // Texto com **destaque** para highlights
  resumo?: string; // Resumo gerado pela IA
  pontosChave?: string[]; // Pontos-chave extraídos pela IA
  processadoPorIA?: boolean; // Indica se foi organizado pela IA
}

// ===== FORMATAÇÃO DE LINKS =====
function formatarLinkCompleto(href: string): string {
  if (!href) return '';
  // Se já é URL completa, retornar
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  // Se é relativo, adicionar base do Corpus 927
  if (href.startsWith('/')) {
    return `https://corpus927.enfam.jus.br${href}`;
  }
  return `https://corpus927.enfam.jus.br/${href}`;
}

// ===== GERAR LINK CORRETO DO STF =====
function gerarLinkSTF(titulo: string): string {
  // Extrair classe (ADI, ADC, ADPF, etc.) e número
  const match = titulo.match(/^(ADI|ADC|ADPF|ADO|RE|ARE|HC|MS|RHC|Rcl)\s*[\/\-]?\s*(\d+)/i);
  if (match) {
    const classe = match[1].toUpperCase();
    const numero = match[2];
    return `https://portal.stf.jus.br/processos/listarProcessos.asp?classe=${classe}&numeroProcesso=${numero}`;
  }
  // Fallback para busca geral
  return `https://portal.stf.jus.br/processos/?termo=${encodeURIComponent(titulo)}`;
}

// ===== FORMATAÇÃO LOCAL (SEM IA - INSTANTÂNEA) =====
function formatarJurisprudencia(texto: string): string {
  if (!texto) return '';
  
  let formatado = texto
    // Primeiro: normalizar espaços (mas preservar quebras de linha existentes)
    .replace(/[ \t]+/g, ' ')
    .trim()
    
    // Quebra de linha ANTES de "EMENTA:" ou "EMENTA :"
    .replace(/\s*(EMENTA\s*:?)/gi, '\n\n**$1**')
    
    // Quebra de linha ANTES de seções comuns em jurisprudências
    .replace(/\s*(ACÓRDÃO\s*:?)/gi, '\n\n**$1**')
    .replace(/\s*(RELATÓRIO\s*:?)/gi, '\n\n**$1**')
    .replace(/\s*(VOTO\s*:?)/gi, '\n\n**$1**')
    .replace(/\s*(DECISÃO\s*:?)/gi, '\n\n**$1**')
    .replace(/\s*(RECURSO\s+ESPECIAL\s*:?)/gi, '\n\n**$1**')
    .replace(/\s*(AGRAVO\s+(?:INTERNO|REGIMENTAL|EM\s+RECURSO)\s*:?)/gi, '\n\n**$1**')
    .replace(/\s*(TESE\s*:?)/gi, '\n\n**$1**')
    
    // ===== PARÁGRAFOS NUMERADOS (1., 2., 3., etc) =====
    // Padrão mais agressivo: qualquer número de 1-2 dígitos seguido de ponto
    // que aparece após pontuação final (. ! ?) ou no início
    .replace(/([.!?])\s*(\d{1,2})\.\s+/g, '$1\n\n$2. ')
    // Detecta número no início do texto
    .replace(/^(\d{1,2})\.\s+/m, '\n\n$1. ')
    // Detecta números após texto em caixa alta (fim de cabeçalho)
    .replace(/([A-Z]{3,}\.)\s+(\d{1,2})\.\s+/g, '$1\n\n$2. ')
    // Detecta padrão "etc. 3." ou similar
    .replace(/(etc\.)\s+(\d{1,2})\.\s+/gi, '$1\n\n$2. ')
    // Padrão para números seguidos de maiúscula (novo item)
    .replace(/\.\s+(\d{1,2})\.\s+([A-Z])/g, '.\n\n$1. $2')
    
    // Quebra de linha ANTES de números romanos seguidos de "-" ou "."
    .replace(/\s+([IVXLCDM]+)\s*[-–—\.]\s*/g, '\n\n$1 - ')
    
    // Quebra de linha ANTES de alíneas (a), b), c))
    .replace(/\s+([a-z])\)\s+/gi, '\n$1) ')
    
    // Destacar termos jurídicos importantes
    .replace(/\b(STF|STJ|TST|TSE|TRF|TJ|TJSP|TJRJ|TJMG)\b/g, '**$1**')
    
    // Limpar quebras excessivas
    .replace(/\n{3,}/g, '\n\n')
    // Limpar quebras no início
    .replace(/^\n+/, '')
    .trim();
  
  return formatado;
}

// ===== LIMPAR E FORMATAR TEXTO DO ARTIGO =====
function limparTextoArtigo(texto: string): string {
  if (!texto) return '';
  
  return texto
    // Remover "(Redação dada pela Lei n° ...)" e variantes
    .replace(/\(Redação\s+dada\s+pela\s+Lei\s+n[°º]?\s*[\d.]+[^)]*\)/gi, '')
    .replace(/\(Incluído\s+pela\s+Lei\s+n[°º]?\s*[\d.]+[^)]*\)/gi, '')
    .replace(/\(Alterado\s+pela\s+Lei\s+n[°º]?\s*[\d.]+[^)]*\)/gi, '')
    .replace(/\(Revogado\s+pela\s+Lei\s+n[°º]?\s*[\d.]+[^)]*\)/gi, '')
    .replace(/\(Vide\s+[^)]+\)/gi, '')
    
    // Remover seções de "Jurisprudência em teses" e todo conteúdo após
    .replace(/Jurisprudência\s+em\s+teses[^]*$/gi, '')
    .replace(/Posicionamentos?\s+isolados?[^]*$/gi, '')
    .replace(/Posicionamentos?\s+agrupados?[^]*$/gi, '')
    .replace(/EDIÇÃO\s+N\.\s*\d+[^]*$/gi, '')
    
    // Remover blocos de processos como "AREsp 1390199", "AgRg no AGRAVO", etc.
    .replace(/\b(AREsp|REsp|AgRg|AGRAVO|RECURSO|HC|RHC|MS|ARE|RE)\s+\d+[^]*$/gi, '')
    
    // Remover datas soltas no final (04/10/2022)
    .replace(/\s+\d{2}\/\d{2}\/\d{4}\s*$/g, '')
    
    // Formatar parágrafos e incisos com quebra de linha dupla
    .replace(/\s*(§\s*\d+[°ºª]?)/g, '\n\n$1')
    .replace(/\s*([IVXLCDM]+)\s*[-–—]\s*/g, '\n\n$1 - ')
    .replace(/\s+([a-z])\)\s+/gi, '\n\n$1) ')
    
    // Limpar espaços e quebras excessivas
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+/, '')
    .trim();
}

interface EtapaProcessamento {
  etapa: string;
  status: 'ok' | 'erro' | 'processando';
  quantidade?: number;
}

// Mapeamento de legislações para IDs INTERNOS do Corpus 927
// Descobertos via ng-init no HTML: init('20','cp-40')
const LEGISLACAO_IDS: Record<string, string> = {
  'cp-40': '20',      // Código Penal
  'cc-02': '2',       // Código Civil
  'cpc-15': '15',     // CPC
  'cf-88': '1',       // Constituição
  'clt': '5',         // CLT
  'cdc': '78',        // CDC
  'eca': '69',        // ECA
  'cpp': '41',        // CPP
  'lep': '210',       // LEP
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { legislacao, artigo, forcarAtualizacao } = await req.json();

    if (!legislacao || !artigo) {
      return new Response(
        JSON.stringify({ success: false, error: 'Legislação e artigo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CORPUS927] Buscando jurisprudência: ${legislacao} - Art. ${artigo}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Normalizar número do artigo
    const artigoNormalizado = artigo.toString()
      .toLowerCase()
      .replace(/^art\.?\s*/i, '')
      .replace(/[°ºª]/g, '')
      .trim();

    const etapas: EtapaProcessamento[] = [];

    // 1. Verificar cache no Supabase (se não forçar atualização)
    if (!forcarAtualizacao) {
      console.log('[CORPUS927] Verificando cache...');
      etapas.push({ etapa: 'Verificando cache', status: 'processando' });
      
      const { data: cacheData, error: cacheError } = await supabase
        .from('jurisprudencias_corpus927')
        .select('*')
        .eq('legislacao', legislacao)
        .eq('artigo', artigoNormalizado)
        .single();

      if (cacheData && !cacheError) {
        const cacheDate = new Date(cacheData.updated_at);
        const now = new Date();
        const diffDays = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60 * 24);

        // Cache válido por 7 dias, mas só se tiver jurisprudências
        if (diffDays < 7 && cacheData.jurisprudencias?.length > 0) {
          console.log('[CORPUS927] Retornando do cache');
          etapas.push({ etapa: 'Cache válido encontrado', status: 'ok', quantidade: cacheData.jurisprudencias?.length || 0 });
          
          return new Response(
            JSON.stringify({
              success: true,
              data: cacheData,
              fonte: 'cache',
              etapas,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // 2. Usar Firecrawl para buscar o conteúdo renderizado
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlApiKey) {
      console.error('[CORPUS927] FIRECRAWL_API_KEY não configurada');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const legislacaoId = LEGISLACAO_IDS[legislacao] || '20';
    const targetUrl = `https://corpus927.enfam.jus.br/legislacao/${legislacao}`;

    console.log(`[CORPUS927] URL alvo: ${targetUrl}`);
    console.log(`[CORPUS927] ID legislação: ${legislacaoId}`);
    console.log(`[CORPUS927] Artigo: ${artigoNormalizado}`);
    
    etapas.push({ etapa: 'Conectando ao Corpus 927', status: 'processando' });

    let jurisprudencias: JurisprudenciaItem[] = [];
    let textoArtigo = '';

    // Usar actions do Firecrawl para clicar no artigo e carregar o modal
    try {
      console.log('[CORPUS927] Iniciando scraping com Firecrawl (com click no artigo)...');
      etapas.push({ etapa: 'Clicando no artigo para carregar jurisprudências', status: 'processando' });
      
      const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: targetUrl,
          formats: ['html'],
          onlyMainContent: false,
          waitFor: 3000,
          actions: [
            // Scroll até o artigo
            { type: 'scroll', selector: `#art-${artigoNormalizado}` },
            { type: 'wait', milliseconds: 1000 },
            // Clicar no artigo para abrir modal com jurisprudências
            { type: 'click', selector: `#art-${artigoNormalizado}` },
            { type: 'wait', milliseconds: 6000 }, // Esperar o AngularJS carregar
          ],
          timeout: 45000,
        }),
      });

      const firecrawlData = await firecrawlResponse.json();

      if (!firecrawlResponse.ok || firecrawlData.success === false) {
        console.error('[CORPUS927] Firecrawl erro:', firecrawlData);
        throw new Error('Firecrawl falhou');
      }

      const html = firecrawlData.data?.html || '';
      console.log(`[CORPUS927] HTML recebido: ${html.length} caracteres`);
      
      etapas.push({ etapa: 'Conteúdo recebido, processando', status: 'ok' });

      // Extrair texto do artigo - apenas o caput, sem jurisprudências
      const artigoMatch = html.match(
        new RegExp(`id="art-${artigoNormalizado}"[^>]*>Art\\.?\\s*${artigoNormalizado}[°ºª]?<\\/a>([\\s\\S]*?)(?=<a[^>]*class="numero_artigo"|<div[^>]*class="[^"]*jurisprudencia|<div[^>]*id="divJurisprudencias"|$)`, 'i')
      );
      if (artigoMatch) {
        const textoExtraido = limparHtml(artigoMatch[1]);
        
        // Usar Gemini para formatar corretamente o artigo
        try {
          console.log('[CORPUS927] Formatando artigo com Gemini...');
          etapas.push({ etapa: 'Formatando artigo com IA', status: 'processando' });
          
          const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
          if (LOVABLE_API_KEY) {
            const geminiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  {
                    role: 'system',
                    content: `Você é um especialista em legislação brasileira. Sua tarefa é extrair APENAS o texto do artigo ${artigoNormalizado} do Código Penal, removendo qualquer conteúdo que não pertença a este artigo.

REGRAS IMPORTANTES:
1. Extraia APENAS o caput do artigo ${artigoNormalizado} e seus parágrafos/incisos próprios
2. REMOVA referências a outros artigos que aparecerem no final (como "§ 4º do art. 46")
3. REMOVA textos como "(Redação dada pela Lei...)", "(Incluído pela Lei...)", etc.
4. REMOVA seções de jurisprudência, teses, posicionamentos
5. Formate com quebras de linha:
   - Uma linha em branco antes de cada parágrafo (§)
   - Uma linha em branco antes de cada inciso romano (I, II, III...)
   - Uma linha em branco antes de cada alínea (a, b, c...)

Retorne APENAS o texto formatado do artigo, sem explicações.`
                  },
                  {
                    role: 'user',
                    content: `Formate este texto do Art. ${artigoNormalizado}:\n\n${textoExtraido.substring(0, 2000)}`
                  }
                ],
                max_tokens: 1000,
              }),
            });

            if (geminiResponse.ok) {
              const geminiData = await geminiResponse.json();
              const textoFormatado = geminiData.choices?.[0]?.message?.content?.trim();
              if (textoFormatado && textoFormatado.length > 20) {
                textoArtigo = textoFormatado;
                console.log('[CORPUS927] ✅ Artigo formatado com Gemini');
                etapas.push({ etapa: 'Artigo formatado com IA', status: 'ok' });
              } else {
                // Fallback para formatação local
                textoArtigo = `Art. ${artigoNormalizado}° - ${limparTextoArtigo(textoExtraido)}`.substring(0, 1500);
              }
            } else {
              console.log('[CORPUS927] Gemini não disponível, usando formatação local');
              textoArtigo = `Art. ${artigoNormalizado}° - ${limparTextoArtigo(textoExtraido)}`.substring(0, 1500);
            }
          } else {
            textoArtigo = `Art. ${artigoNormalizado}° - ${limparTextoArtigo(textoExtraido)}`.substring(0, 1500);
          }
        } catch (aiError) {
          console.error('[CORPUS927] Erro ao formatar com IA:', aiError);
          textoArtigo = `Art. ${artigoNormalizado}° - ${limparTextoArtigo(textoExtraido)}`.substring(0, 1500);
        }
      }

      // Processar jurisprudências do modal
      jurisprudencias = extrairJurisprudenciasDoHtml(html, artigoNormalizado);
      
      console.log(`[FASE 1] ✅ ${jurisprudencias.length} jurisprudências extraídas do HTML`);
      etapas.push({ 
        etapa: 'Jurisprudências extraídas (Fase 1)', 
        status: 'ok', 
        quantidade: jurisprudencias.length 
      });

      // ===== FORMATAÇÃO LOCAL (INSTANTÂNEA - SEM IA) =====
      if (jurisprudencias.length > 0) {
        console.log('[FORMATAÇÃO] ===== INICIANDO FORMATAÇÃO LOCAL =====');
        etapas.push({ etapa: 'Formatando textos localmente', status: 'processando' });
        
        jurisprudencias = jurisprudencias.map((item, index) => {
          console.log(`[FORMATAÇÃO] Processando ${index + 1}/${jurisprudencias.length}: ${item.titulo}`);
          return {
            ...item,
            ementa: formatarJurisprudencia(item.ementa || ''),
            texto: formatarJurisprudencia(item.texto || ''),
          };
        });
        
        console.log(`[FORMATAÇÃO] ✅ ${jurisprudencias.length} textos formatados`);
        etapas.push({ 
          etapa: 'Textos formatados com sucesso', 
          status: 'ok', 
          quantidade: jurisprudencias.length 
        });
      }

    } catch (scrapingError) {
      console.error('[CORPUS927] Erro no scraping:', scrapingError);
      etapas.push({ etapa: 'Erro no scraping', status: 'erro' });
    }

    console.log(`[CORPUS927] Total de jurisprudências finais: ${jurisprudencias.length}`);

    // Salvar no cache
    const dadosCache = {
      legislacao,
      artigo: artigoNormalizado,
      texto_artigo: textoArtigo || `Art. ${artigoNormalizado}`,
      jurisprudencias,
      url_fonte: `${targetUrl}#art-${artigoNormalizado}`,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('jurisprudencias_corpus927')
      .upsert(dadosCache, { onConflict: 'legislacao,artigo' });

    if (upsertError) {
      console.error('[CORPUS927] Erro ao salvar cache:', upsertError);
    } else {
      console.log('[CORPUS927] Cache atualizado');
      etapas.push({ etapa: 'Cache atualizado', status: 'ok' });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: dadosCache,
        fonte: 'corpus927',
        etapas,
        totalJurisprudencias: jurisprudencias.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CORPUS927] Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno',
        etapas: [{ etapa: 'Erro geral', status: 'erro' }],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Função para extrair conteúdo completo de um div, considerando divs aninhados
function extrairConteudoDiv(html: string, startIndex: number): string {
  let depth = 1;
  let i = startIndex;
  
  while (depth > 0 && i < html.length) {
    const remaining = html.substring(i);
    
    // Verificar abertura de div
    const openDiv = remaining.match(/^<div(?:\s|>)/i);
    if (openDiv) {
      depth++;
      i += openDiv[0].length;
      continue;
    }
    
    // Verificar fechamento de div
    const closeDiv = remaining.match(/^<\/div>/i);
    if (closeDiv) {
      depth--;
      if (depth === 0) {
        return html.substring(startIndex, i);
      }
      i += closeDiv[0].length;
      continue;
    }
    
    i++;
  }
  
  return html.substring(startIndex, i);
}

function extrairJurisprudenciasDoHtml(html: string, artigo: string): JurisprudenciaItem[] {
  const jurisprudencias: JurisprudenciaItem[] = [];
  
  console.log('[CORPUS927] Extraindo jurisprudências do HTML...');
  
  // Verificar se existe o container de jurisprudências
  const divJurisMatch = html.match(/id="divJurisprudencias"/i);
  if (divJurisMatch) {
    console.log('[CORPUS927] Container divJurisprudencias encontrado');
  } else {
    console.log('[CORPUS927] Container divJurisprudencias NÃO encontrado');
  }

  // ====== IDENTIFICAR SEÇÕES: Agrupados vs Isolados ======
  // Padrão para encontrar seções de tipo-jurisprudencia
  const secoesAgrupados: { inicio: number; fim: number }[] = [];
  const secoesIsolados: { inicio: number; fim: number }[] = [];
  
  // Encontrar todas as seções "tipo-jurisprudencia" e classificar
  const secaoPattern = /<div[^>]*class="[^"]*tipo-jurisprudencia[^"]*"[^>]*>/gi;
  let secaoMatch;
  let ultimaSecaoFim = 0;
  
  while ((secaoMatch = secaoPattern.exec(html)) !== null) {
    const secaoInicio = secaoMatch.index;
    // Buscar o título da seção
    const tituloSecaoMatch = html.substring(secaoInicio, secaoInicio + 500).match(/<div[^>]*class="[^"]*titulo-tipo[^"]*"[^>]*>([^<]+)/i);
    const tituloSecao = tituloSecaoMatch ? tituloSecaoMatch[1].toLowerCase() : '';
    
    // Determinar tipo da seção
    if (tituloSecao.includes('agrupado')) {
      secoesAgrupados.push({ inicio: secaoInicio, fim: 0 });
    } else if (tituloSecao.includes('isolado')) {
      secoesIsolados.push({ inicio: secaoInicio, fim: 0 });
    }
  }
  
  console.log(`[CORPUS927] Seções Agrupados: ${secoesAgrupados.length}, Isolados: ${secoesIsolados.length}`);

  // ====== ABORDAGEM: Capturar cards inteiros primeiro ======
  const cardPattern = /<div[^>]*class="jurisprudenciaPadrao"[^>]*>/gi;
  let cardMatch;
  let posAgrupadoCount = 0;
  let posIsoladoCount = 0;
  
  while ((cardMatch = cardPattern.exec(html)) !== null) {
    const cardPosition = cardMatch.index;
    const cardStartIndex = cardMatch.index + cardMatch[0].length;
    const cardContent = extrairConteudoDiv(html, cardStartIndex);
    
    // Determinar se é agrupado ou isolado baseado na posição
    let tipoCategoria = 'posicionamento_isolado';
    
    // Verificar se este card está em uma seção de agrupados
    for (const secao of secoesAgrupados) {
      if (cardPosition > secao.inicio) {
        // Verificar se não ultrapassou próxima seção
        const proximaSecaoIsolado = secoesIsolados.find(s => s.inicio > secao.inicio);
        if (!proximaSecaoIsolado || cardPosition < proximaSecaoIsolado.inicio) {
          tipoCategoria = 'posicionamento_agrupado';
          break;
        }
      }
    }
    
    // Extrair título
    const tituloMatch = cardContent.match(/<span[^>]*class="titulo"[^>]*>([^<]+)<\/span>/i);
    const titulo = tituloMatch ? tituloMatch[1].trim() : '';
    
    // Extrair enunciado (texto curto abaixo do tema/título) 
    // Padrão: Procura por div com classe que contenha descrição ou subtítulo do tema
    let enunciado = '';
    const enunciadoPatterns = [
      // Padrão 1: span ou div com classe "descricao", "subtitulo", "enunciado"
      /<(?:span|div)[^>]*class="[^"]*(?:descricao|subtitulo|enunciado|tema-desc)[^"]*"[^>]*>([^<]{10,200})<\/(?:span|div)>/i,
      // Padrão 2: Texto após o título dentro de um p ou span
      /<span[^>]*class="titulo"[^>]*>[^<]+<\/span>\s*<(?:p|span|div)[^>]*>([^<]{10,200})/i,
      // Padrão 3: Procura texto curto após "Tema N" antes de "ver tese"
      /Tema\s*(?:n[°º]?\s*)?\d+[^<]*<[^>]*>\s*([^<]{10,150})/i,
    ];
    
    for (const pattern of enunciadoPatterns) {
      const enunciadoMatch = cardContent.match(pattern);
      if (enunciadoMatch && enunciadoMatch[1]) {
        const textoCapturado = limparHtml(enunciadoMatch[1]).trim();
        // Validar que é um texto razoável para enunciado (não muito curto, não parece ser outro campo)
        if (textoCapturado.length >= 10 && 
            !textoCapturado.toLowerCase().includes('ver tese') &&
            !textoCapturado.toLowerCase().includes('ver ementa') &&
            !textoCapturado.toLowerCase().includes('inteiro teor')) {
          enunciado = textoCapturado;
          break;
        }
      }
    }
    
    // Extrair data
    const dataMatch = cardContent.match(/<span[^>]*class="[^"]*data_publicacao[^"]*"[^>]*>\s*([\d\/]+)\s*<\/span>/i);
    const data = dataMatch ? dataMatch[1].trim() : '';
    
    // Extrair link "ver inteiro teor"
    const inteiroTeorMatch = cardContent.match(/href="([^"]*inteiro-teor[^"]*)"/i);
    const linkInteiroTeor = inteiroTeorMatch 
      ? (inteiroTeorMatch[1].startsWith('http') 
          ? inteiroTeorMatch[1] 
          : `https://corpus927.enfam.jus.br${inteiroTeorMatch[1]}`)
      : undefined;
    
    // ===== EXTRAIR "VER TESE" E "VER EMENTA" DE TODOS OS CARDS =====
    // Buscar botões/links "ver tese" e "ver ementa" (podem ser <a> ou <span ng-click>)
    const verTeseExists = /<(?:a|span)[^>]*>[\s\S]*?ver\s+tese[\s\S]*?<\/(?:a|span)>/i.test(cardContent);
    const verEmentaExists = /<(?:a|span)[^>]*>[\s\S]*?ver\s+ementa[\s\S]*?<\/(?:a|span)>/i.test(cardContent);
    
    // Extrair texto da tese - múltiplos padrões
    let textoTeseCard = '';
    let textoEmentaCard = '';
    
    // Padrão 1: div com ng-show contendo "tese"
    const divTeseNgCard = cardContent.match(/<div[^>]*ng-show="[^"]*tese[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    // Padrão 2: div com classe contendo "tese" (texto, conteudo, etc)
    const divTeseClassCard = cardContent.match(/<div[^>]*class="[^"]*(?:tese-texto|texto-tese|conteudo-tese|tese-content|tese-full)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    // Padrão 3: div após span/link "ver tese"
    const teseAposLinkCard = cardContent.match(/ver\s+tese[\s\S]*?<\/(?:a|span)>[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i);
    // Padrão 4: div com classe "tese" simples
    const divTeseSimples = cardContent.match(/<div[^>]*class="[^"]*\btese\b[^"]*"[^>]*>/i);
    
    if (divTeseNgCard) {
      textoTeseCard = limparHtml(divTeseNgCard[1]);
    } else if (divTeseClassCard) {
      textoTeseCard = limparHtml(divTeseClassCard[1]);
    } else if (teseAposLinkCard) {
      textoTeseCard = limparHtml(teseAposLinkCard[1]);
    } else if (divTeseSimples) {
      const startIdx = divTeseSimples.index! + divTeseSimples[0].length;
      const teseConteudo = extrairConteudoDiv(cardContent, startIdx);
      textoTeseCard = limparHtml(teseConteudo);
    }
    
    // Extrair texto da ementa expandida (não a ementa principal do card)
    // Padrão 1: div com ng-show contendo "ementa"
    const divEmentaNgCard = cardContent.match(/<div[^>]*ng-show="[^"]*(?:mostrar|ver)?ementa[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    // Padrão 2: div com classe específica de ementa expandida
    const divEmentaExpandidaCard = cardContent.match(/<div[^>]*class="[^"]*(?:ementa-full|ementa-completa|ementa-expandida)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    // Padrão 3: div após span/link "ver ementa"  
    const ementaAposLinkCard = cardContent.match(/ver\s+ementa[\s\S]*?<\/(?:a|span)>[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i);
    
    // Variável para armazenar destaques do textoEmenta
    let destaquesTextoEmenta = '';
    
    if (divEmentaNgCard) {
      // IMPORTANTE: Preservar destaques ANTES de limpar HTML
      destaquesTextoEmenta = preservarDestaques(divEmentaNgCard[1]);
      textoEmentaCard = limparHtml(divEmentaNgCard[1]);
    } else if (divEmentaExpandidaCard) {
      destaquesTextoEmenta = preservarDestaques(divEmentaExpandidaCard[1]);
      textoEmentaCard = limparHtml(divEmentaExpandidaCard[1]);
    } else if (ementaAposLinkCard) {
      destaquesTextoEmenta = preservarDestaques(ementaAposLinkCard[1]);
      textoEmentaCard = limparHtml(ementaAposLinkCard[1]);
    }
    
    // DEBUG: Log para temas específicos
    if (titulo.toLowerCase().includes('tema') && (titulo.includes('187') || titulo.includes('169') || titulo.includes('446'))) {
      console.log(`[DEBUG CARD] ${titulo}:`);
      console.log(`  - verTeseExists: ${verTeseExists}, verEmentaExists: ${verEmentaExists}`);
      console.log(`  - textoTeseCard: ${textoTeseCard.length} chars`);
      console.log(`  - textoEmentaCard: ${textoEmentaCard.length} chars`);
      console.log(`  - cardContent (1500 chars): ${cardContent.substring(0, 1500)}`);
    }
    
    // Extrair quantidade de posicionamentos semelhantes
    const semelhantesMatch = cardContent.match(/(\d+)\s*posicionamento\(?s?\)?\s*semelhante/i);
    const posicionamentosSemelhantes = semelhantesMatch ? parseInt(semelhantesMatch[1]) : undefined;
    
    // Extrair ementa COMPLETA preservando destaques
    const ementaOpenMatch = cardContent.match(/<div[^>]*class="ementa"[^>]*>/i);
    let ementa = '';
    let destaques = '';
    
    if (ementaOpenMatch) {
      const ementaStartIndex = ementaOpenMatch.index! + ementaOpenMatch[0].length;
      const ementaConteudoRaw = extrairConteudoDiv(cardContent, ementaStartIndex);
      
      // Preservar destaques (marcações em amarelo) antes de limpar
      destaques = preservarDestaques(ementaConteudoRaw);
      ementa = limparEmenta(ementaConteudoRaw);
    }
    
    // NOVO: Combinar destaques da ementa principal + textoEmenta expandido
    // Se textoEmenta teve destaques, usar esses (são mais detalhados)
    if (destaquesTextoEmenta && destaquesTextoEmenta.includes('**')) {
      destaques = destaquesTextoEmenta;
      console.log(`[CORPUS927] Destaques encontrados em textoEmenta para ${titulo}: ${destaquesTextoEmenta.substring(0, 100)}...`);
    }
    
    // Extrair relator
    const relatorMatch = cardContent.match(/RELATOR\s*[:\t]+\s*MINISTR[OA]\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+?)(?=\s{2}|\t|AGRAV|RECOR|ADVOG|<|$)/i);
    const relator = relatorMatch ? relatorMatch[1].trim() : undefined;
    
    // ===== CLASSIFICAÇÃO MELHORADA DO TIPO =====
    if (titulo && ementa.length > 50) {
      const tituloUpper = titulo.toUpperCase();
      const cardLower = cardContent.toLowerCase();
      
      // Identificar se é um Tema (Repercussão Geral ou Recurso Repetitivo)
      const isTema = tituloUpper.match(/^TEMA\s*N?[°º]?\s*\d+/);
      const isRepercussaoGeral = cardLower.includes('repercussão geral') || 
                                  cardLower.includes('repercussao geral') ||
                                  (isTema && cardLower.includes('stf'));
      const isRecursoRepetitivo = cardLower.includes('recurso repetitivo') || 
                                   cardLower.includes('recursos repetitivos') ||
                                   (isTema && cardLower.includes('stj') && !isRepercussaoGeral);
      
      if (tituloUpper.match(/^(ADI|ADC|ADPF)/)) {
        jurisprudencias.push({
          tipo: 'controle_constitucionalidade',
          titulo,
          texto: enunciado || ementa,
          enunciado: enunciado || undefined,
          ementa,
          destaques: destaques || undefined,
          tribunal: 'STF',
          numero: titulo.replace(/\D/g, ''),
          data,
          relator,
          linkInteiroTeor,
          posicionamentosSemelhantes,
          // Incluir tese/ementa se extraídos
          textoTese: textoTeseCard.length > 10 ? textoTeseCard : undefined,
          textoEmenta: textoEmentaCard.length > 10 ? textoEmentaCard : undefined,
          link: gerarLinkSTF(titulo),
        });
      } else if (isTema && isRepercussaoGeral) {
        // É um Tema de Repercussão Geral
        jurisprudencias.push({
          tipo: 'repercussao_geral',
          titulo,
          texto: enunciado || textoTeseCard || ementa,
          enunciado: enunciado || undefined,
          ementa,
          tese: textoTeseCard || undefined,
          destaques: destaques || undefined,
          tribunal: 'STF',
          numero: titulo.replace(/\D/g, ''),
          data,
          relator,
          linkInteiroTeor,
          posicionamentosSemelhantes,
          textoTese: textoTeseCard.length > 10 ? textoTeseCard : undefined,
          textoEmenta: textoEmentaCard.length > 10 ? textoEmentaCard : undefined,
        });
        console.log(`[CORPUS927] Card classificado como REPERCUSSÃO GERAL: ${titulo} (enunciado: ${enunciado.length} chars, tese: ${textoTeseCard.length} chars)`);
      } else if (isTema && isRecursoRepetitivo) {
        // É um Tema de Recurso Repetitivo
        jurisprudencias.push({
          tipo: 'recurso_repetitivo',
          titulo,
          texto: enunciado || textoTeseCard || ementa,
          enunciado: enunciado || undefined,
          ementa,
          tese: textoTeseCard || undefined,
          destaques: destaques || undefined,
          tribunal: 'STJ',
          numero: titulo.replace(/\D/g, ''),
          data,
          relator,
          linkInteiroTeor,
          posicionamentosSemelhantes,
          textoTese: textoTeseCard.length > 10 ? textoTeseCard : undefined,
          textoEmenta: textoEmentaCard.length > 10 ? textoEmentaCard : undefined,
        });
        console.log(`[CORPUS927] Card classificado como RECURSO REPETITIVO: ${titulo} (enunciado: ${enunciado.length} chars, tese: ${textoTeseCard.length} chars)`);
      } else if (isTema) {
        // Tema genérico - assumir Repercussão Geral por padrão
        jurisprudencias.push({
          tipo: 'repercussao_geral',
          titulo,
          texto: enunciado || textoTeseCard || ementa,
          enunciado: enunciado || undefined,
          ementa,
          tese: textoTeseCard || undefined,
          destaques: destaques || undefined,
          tribunal: tituloUpper.includes('STF') ? 'STF' : 'STJ',
          numero: titulo.replace(/\D/g, ''),
          data,
          relator,
          linkInteiroTeor,
          posicionamentosSemelhantes,
          textoTese: textoTeseCard.length > 10 ? textoTeseCard : undefined,
          textoEmenta: textoEmentaCard.length > 10 ? textoEmentaCard : undefined,
        });
        console.log(`[CORPUS927] Card Tema genérico -> REPERCUSSÃO GERAL: ${titulo} (enunciado: ${enunciado.length} chars)`);
      } else {
        // Outros tipos (posicionamento agrupado/isolado)
        jurisprudencias.push({
          tipo: tipoCategoria,
          titulo,
          texto: enunciado || ementa,
          enunciado: enunciado || undefined,
          ementa,
          destaques: destaques || undefined,
          tribunal: tituloUpper.includes('STF') ? 'STF' : 'STJ',
          numero: titulo.replace(/\D/g, ''),
          data,
          relator,
          linkInteiroTeor,
          posicionamentosSemelhantes,
          // Incluir tese/ementa se extraídos mesmo em posicionamentos
          textoTese: textoTeseCard.length > 10 ? textoTeseCard : undefined,
          textoEmenta: textoEmentaCard.length > 10 ? textoEmentaCard : undefined,
        });
        
        if (tipoCategoria === 'posicionamento_agrupado') {
          posAgrupadoCount++;
        } else {
          posIsoladoCount++;
        }
      }
    }
  }
  console.log(`[CORPUS927] Posicionamentos Agrupados: ${posAgrupadoCount}, Isolados: ${posIsoladoCount}`);

  // ====== SÚMULAS VINCULANTES ======
  const svPattern = /Súmula\s+Vinculante\s*n?[°º]?\s*(\d+)/gi;
  let match;
  let svCount = 0;
  
  while ((match = svPattern.exec(html)) !== null) {
    const numero = match[1];
    const afterMatch = html.substring(match.index);
    
    // Buscar div de texto-sumula
    const textoSumulaMatch = afterMatch.match(/<div[^>]*class="[^"]*texto-sumula[^"]*"[^>]*>/i);
    if (textoSumulaMatch) {
      const startIdx = textoSumulaMatch.index! + textoSumulaMatch[0].length;
      const textoConteudo = extrairConteudoDiv(afterMatch, startIdx);
      const texto = limparHtml(textoConteudo);
      
      if (texto.length > 10) {
        jurisprudencias.push({
          tipo: 'sumula_vinculante',
          titulo: `Súmula Vinculante ${numero}`,
          texto,
          ementa: texto,
          tribunal: 'STF',
          numero,
        });
        svCount++;
      }
    }
  }
  console.log(`[CORPUS927] Súmulas vinculantes encontradas: ${svCount}`);

  // ====== REPERCUSSÃO GERAL ======
  const rgPattern = /Tema\s*n?[°º]?\s*(\d+)\s*(?:da\s+)?(?:Repercussão\s+Geral)?/gi;
  let rgCount = 0;
  
  while ((match = rgPattern.exec(html)) !== null) {
    const numero = match[1];
    const afterMatch = html.substring(match.index, match.index + 15000); // Aumentado para capturar mais conteúdo
    
    // Verificar se é realmente repercussão geral (não recurso repetitivo)
    if (afterMatch.toLowerCase().includes('recurso') && afterMatch.toLowerCase().includes('repetitivo')) {
      continue;
    }
    
    // DEBUG: Log do HTML para entender a estrutura (apenas para temas específicos)
    // DEBUG: Log do HTML para entender a estrutura (apenas para temas específicos)
    if (numero === '370' || numero === '339' || numero === '187') {
      console.log(`[DEBUG] HTML Tema ${numero} (primeiros 3000 chars):`);
      console.log(afterMatch.substring(0, 3000));
    }
    
    // Extrair título/descrição do tema - múltiplos padrões
    let tituloTema = '';
    // Padrão 1: div/span com classe titulo
    const tituloMatch = afterMatch.match(/<(?:h[1-6]|div|span)[^>]*class="[^"]*(?:titulo|title|header|card-title)[^"]*"[^>]*>([^<]+)</i);
    // Padrão 2: Texto logo após "Tema N"
    const tituloAposMatch = afterMatch.match(/Tema\s*n?[°º]?\s*\d+[^<]*<[^>]*>([^<]{10,200})</i);
    
    if (tituloMatch) {
      tituloTema = limparHtml(tituloMatch[1]);
    } else if (tituloAposMatch) {
      tituloTema = limparHtml(tituloAposMatch[1]);
    }
    
    // ===== BUSCAR TEXTOS DE TESE E EMENTA DIRETAMENTE =====
    let textoTese = '';
    let textoEmenta = '';
    
    // Buscar múltiplos padrões para o texto da tese
    // Padrão 1: div com ng-show="tese" ou similar
    const divTeseNgMatch = afterMatch.match(/<div[^>]*ng-(?:show|if)="[^"]*tese[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    // Padrão 2: div com classe contendo "tese" (excluindo "ver tese" que é botão)
    const divTeseClassMatch = afterMatch.match(/<div[^>]*class="[^"]*(?:tese-texto|texto-tese|conteudo-tese|tese-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    // Padrão 3: Conteúdo após "TESE:" ou similar
    const teseAposLabelMatch = afterMatch.match(/(?:TESE|Tese)\s*:?\s*<[^>]*>([\s\S]{20,2000}?)(?:<div|<\/section|<hr)/i);
    // Padrão 4: div com classe "tese" simples
    const teseMatch = afterMatch.match(/<div[^>]*class="[^"]*\btese\b[^"]*"[^>]*>/i);
    
    if (divTeseNgMatch) {
      textoTese = limparHtml(divTeseNgMatch[1]);
      console.log(`[CORPUS927] Tema ${numero}: Encontrou tese via ng-show (${textoTese.length} chars)`);
    } else if (divTeseClassMatch) {
      textoTese = limparHtml(divTeseClassMatch[1]);
      console.log(`[CORPUS927] Tema ${numero}: Encontrou tese via classe específica (${textoTese.length} chars)`);
    } else if (teseAposLabelMatch) {
      textoTese = limparHtml(teseAposLabelMatch[1]);
      console.log(`[CORPUS927] Tema ${numero}: Encontrou tese após label (${textoTese.length} chars)`);
    } else if (teseMatch) {
      const startIdx = teseMatch.index! + teseMatch[0].length;
      const teseConteudo = extrairConteudoDiv(afterMatch, startIdx);
      textoTese = limparHtml(teseConteudo);
      console.log(`[CORPUS927] Tema ${numero}: Encontrou tese via div.tese (${textoTese.length} chars)`);
    }
    
    // Buscar texto da ementa - múltiplos padrões
    // Padrão 1: div com ng-show="ementa"
    const divEmentaNgMatch = afterMatch.match(/<div[^>]*ng-(?:show|if)="[^"]*ementa[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    // Padrão 2: div com classe contendo "ementa"
    const divEmentaClassMatch = afterMatch.match(/<div[^>]*class="[^"]*(?:ementa-texto|texto-ementa|conteudo-ementa|ementa-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    // Padrão 3: Conteúdo após "EMENTA:" ou similar
    const ementaAposLabelMatch = afterMatch.match(/(?:EMENTA)\s*:?\s*<[^>]*>([\s\S]{20,5000}?)(?:<div|<\/section|<hr|TESE)/i);
    
    if (divEmentaNgMatch) {
      textoEmenta = limparHtml(divEmentaNgMatch[1]);
      console.log(`[CORPUS927] Tema ${numero}: Encontrou ementa via ng-show (${textoEmenta.length} chars)`);
    } else if (divEmentaClassMatch) {
      textoEmenta = limparHtml(divEmentaClassMatch[1]);
      console.log(`[CORPUS927] Tema ${numero}: Encontrou ementa via classe (${textoEmenta.length} chars)`);
    } else if (ementaAposLabelMatch) {
      textoEmenta = limparHtml(ementaAposLabelMatch[1]);
      console.log(`[CORPUS927] Tema ${numero}: Encontrou ementa após label (${textoEmenta.length} chars)`);
    }
    
    // Buscar links tradicionais (fallback)
    const linkTeseMatch = afterMatch.match(/<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?ver\s+tese[\s\S]*?<\/a>/i);
    const linkEmentaMatch = afterMatch.match(/<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?ver\s+ementa[\s\S]*?<\/a>/i);
    
    const linkTese = linkTeseMatch ? formatarLinkCompleto(linkTeseMatch[1]) : undefined;
    const linkEmenta = linkEmentaMatch ? formatarLinkCompleto(linkEmentaMatch[1]) : undefined;
    
    // Buscar botões Angular (ng-click) que podem conter links ou IDs
    const ngClickTeseMatch = afterMatch.match(/ng-click="[^"]*(?:mostrar|ver|show)Tese[^"]*\(([^)]*)\)"/i);
    const ngClickEmentaMatch = afterMatch.match(/ng-click="[^"]*(?:mostrar|ver|show)Ementa[^"]*\(([^)]*)\)"/i);
    
    if (ngClickTeseMatch && !linkTese) {
      console.log(`[CORPUS927] Tema ${numero}: Encontrou ng-click tese: ${ngClickTeseMatch[0].substring(0, 100)}`);
    }
    if (ngClickEmentaMatch && !linkEmenta) {
      console.log(`[CORPUS927] Tema ${numero}: Encontrou ng-click ementa: ${ngClickEmentaMatch[0].substring(0, 100)}`);
    }
    
    console.log(`[CORPUS927] Tema RG ${numero}: tese=${textoTese.length > 0 ? textoTese.length + ' chars' : 'NÃO'}, ementa=${textoEmenta.length > 0 ? textoEmenta.length + ' chars' : 'NÃO'}, linkTese=${!!linkTese}, linkEmenta=${!!linkEmenta}`);
    
    // Adicionar item se tiver algum conteúdo relevante
    if (textoTese.length > 10 || textoEmenta.length > 10) {
      jurisprudencias.push({
        tipo: 'repercussao_geral',
        titulo: tituloTema || `Tema RG ${numero}`,
        texto: textoTese || textoEmenta || tituloTema || `Tema ${numero} - Repercussão Geral`,
        tese: textoTese || undefined,
        tribunal: 'STF',
        numero,
        linkTese,
        linkEmenta,
        textoTese: textoTese || undefined,
        textoEmenta: textoEmenta || undefined,
      });
      rgCount++;
    } else if (linkTese || linkEmenta) {
      // Fallback: Se só tem links, adiciona com aviso
      jurisprudencias.push({
        tipo: 'repercussao_geral',
        titulo: tituloTema || `Tema RG ${numero}`,
        texto: tituloTema || `Tema ${numero} - Repercussão Geral (clique em "ver tese" ou "ver ementa" para detalhes)`,
        tribunal: 'STF',
        numero,
        linkTese,
        linkEmenta,
      });
      rgCount++;
    }
  }
  console.log(`[CORPUS927] Repercussão geral encontrados: ${rgCount}`);

  // ====== SÚMULAS STJ ======
  const sumStjPattern = /Súmula\s+(?:n?[°º]?\s*)?(\d+)\s*(?:do\s+)?STJ/gi;
  let sumStjCount = 0;
  
  while ((match = sumStjPattern.exec(html)) !== null) {
    const numero = match[1];
    const afterMatch = html.substring(match.index, match.index + 3000);
    
    const textoMatch = afterMatch.match(/<div[^>]*class="[^"]*texto[^"]*"[^>]*>/i);
    if (textoMatch) {
      const startIdx = textoMatch.index! + textoMatch[0].length;
      const textoConteudo = extrairConteudoDiv(afterMatch, startIdx);
      const texto = limparHtml(textoConteudo);
      
      if (texto.length > 10) {
        jurisprudencias.push({
          tipo: 'sumula_stj',
          titulo: `Súmula STJ ${numero}`,
          texto,
          ementa: texto,
          tribunal: 'STJ',
          numero,
        });
        sumStjCount++;
      }
    }
  }
  console.log(`[CORPUS927] Súmulas STJ encontradas: ${sumStjCount}`);

  // ====== RECURSOS REPETITIVOS ======
  const rrPattern = /Tema\s*n?[°º]?\s*(\d+)[\s\S]{0,200}Recursos?\s+Repetitivos?/gi;
  let rrCount = 0;
  
  while ((match = rrPattern.exec(html)) !== null) {
    const numero = match[1];
    const afterMatch = html.substring(match.index, match.index + 5000);
    
    const teseMatch = afterMatch.match(/<div[^>]*class="[^"]*tese[^"]*"[^>]*>/i);
    if (teseMatch) {
      const startIdx = teseMatch.index! + teseMatch[0].length;
      const teseConteudo = extrairConteudoDiv(afterMatch, startIdx);
      const tese = limparHtml(teseConteudo);
      
      if (tese.length > 10) {
        jurisprudencias.push({
          tipo: 'recurso_repetitivo',
          titulo: `Tema ${numero}`,
          texto: tese,
          tese,
          tribunal: 'STJ',
          numero,
        });
        rrCount++;
      }
    }
  }
  console.log(`[CORPUS927] Recursos repetitivos encontrados: ${rrCount}`);

  // ====== JURISPRUDÊNCIAS EM TESE ======
  const jtPattern = /Jurisprud[êe]ncia\s+em\s+Tese/gi;
  let jtCount = 0;
  
  while ((match = jtPattern.exec(html)) !== null) {
    const afterMatch = html.substring(match.index, match.index + 3000);
    
    const teseMatch = afterMatch.match(/<div[^>]*class="[^"]*tese[^"]*"[^>]*>/i);
    if (teseMatch) {
      const startIdx = teseMatch.index! + teseMatch[0].length;
      const teseConteudo = extrairConteudoDiv(afterMatch, startIdx);
      const texto = limparHtml(teseConteudo);
      
      if (texto.length > 20) {
        jurisprudencias.push({
          tipo: 'jurisprudencia_tese',
          titulo: `Jurisprudência em Tese`,
          texto,
          tese: texto,
          tribunal: 'STJ',
        });
        jtCount++;
      }
    }
  }
  console.log(`[CORPUS927] Jurisprudências em tese encontradas: ${jtCount}`);

  console.log(`[CORPUS927] Total bruto antes de deduplicar: ${jurisprudencias.length}`);

  // Remover duplicatas (mantendo a versão com ementa mais longa)
  const uniqueMap = new Map<string, JurisprudenciaItem>();
  for (const j of jurisprudencias) {
    const key = `${j.tipo}-${j.titulo}`;
    if (!uniqueMap.has(key) || (j.ementa?.length || 0) > (uniqueMap.get(key)?.ementa?.length || 0)) {
      uniqueMap.set(key, j);
    }
  }

  return Array.from(uniqueMap.values());
}

function limparHtml(texto: string): string {
  if (!texto) return '';
  
  return texto
    // Remover tags HTML
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?mark[^>]*>/gi, '')
    .replace(/<\/?strong>/gi, '')
    .replace(/<\/?b>/gi, '')
    .replace(/<\/?em>/gi, '')
    .replace(/<\/?i>/gi, '')
    .replace(/<\/?p>/gi, '\n')
    .replace(/<\/?div[^>]*>/gi, '\n')
    .replace(/<\/?span[^>]*>/gi, '')
    .replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    // Remover atributos HTML escapados (0">, ng-click, etc)
    .replace(/\d+">/g, '')
    .replace(/[a-z-]+="[^"]*"/gi, '')
    .replace(/ng-[a-z]+="[^"]*"/gi, '')
    // Remover textos de botões do site original
    .replace(/ver\s+tese/gi, '')
    .replace(/ver\s+ementa/gi, '')
    .replace(/ver\s+mais/gi, '')
    .replace(/clique\s+para\s+ver/gi, '')
    .replace(/ver\s+inteiro\s+teor/gi, '')
    .replace(/\d+\s*posicionamento\(?s?\)?\s*semelhante\(?s?\)?/gi, '')
    // Entidades HTML
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
    // Limpar espaços e quebras excessivas
    .replace(/\t+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

// Função para preservar destaques (marcações em amarelo) como **texto**
// EXPANDIDO: Detecta mais padrões de highlight usados pelo Corpus 927
function preservarDestaques(html: string): string {
  if (!html) return '';
  
  // Verificar se há marcações <mark> ou elementos com background amarelo
  const temMark = /<mark[^>]*>/i.test(html);
  const temHighlight = /style="[^"]*background[^"]*(?:yellow|#ff|rgb\s*\(\s*255\s*,\s*255\s*,\s*0|rgba\s*\(\s*255\s*,\s*255\s*,\s*0)[^"]*"/i.test(html);
  const temClassHighlight = /class="[^"]*(?:highlight|destaque|marcado|bg-amarelo|amarelo|yellow|search-highlight|text-highlight|hl|selected)[^"]*"/i.test(html);
  // Padrão Corpus 927: pode usar <b> ou <strong> dentro de contexto de ementa
  const temStrong = /<(?:b|strong)[^>]*>[^<]{5,}<\/(?:b|strong)>/i.test(html);
  
  // Se nenhum padrão, verificar por cores hexadecimais de amarelo
  const temHexYellow = /style="[^"]*(?:background(?:-color)?:\s*#(?:ffff00|fff[0-9a-f]{2}|fffe[0-9a-f]{2}|ff[ef][0-9a-f]{3}))[^"]*"/i.test(html);
  
  if (!temMark && !temHighlight && !temClassHighlight && !temHexYellow) {
    // Fallback: tentar encontrar <b> ou <strong> como destaques quando há vários
    const bTagCount = (html.match(/<(?:b|strong)[^>]*>/gi) || []).length;
    if (bTagCount < 2) return '';
  }
  
  // Extrair texto com destaques convertidos para **texto**
  let textoComDestaques = html
    // Capturar <mark> com conteúdo (incluindo quebras de linha e outros elementos)
    .replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, '**$1**')
    // Capturar elementos com style background yellow (vários formatos de cor)
    .replace(/<(?:span|div)[^>]*style="[^"]*background[^"]*(?:yellow|#ff|rgb\s*\(\s*255)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div)>/gi, '**$1**')
    // Capturar elementos com classe highlight/destaque (expandido)
    .replace(/<(?:span|div)[^>]*class="[^"]*(?:highlight|destaque|marcado|bg-amarelo|amarelo|yellow|search-highlight|text-highlight|hl|selected)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div)>/gi, '**$1**')
    // Capturar <b> e <strong> como possíveis destaques (Corpus 927 usa isso)
    .replace(/<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>/gi, '**$1**')
    // Limpar HTML restante
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?p>/gi, '\n')
    .replace(/<\/?div[^>]*>/gi, '\n')
    .replace(/<\/?span[^>]*>/gi, '')
    .replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    // Limpar entidades HTML
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Remover marcadores duplos adjacentes (ex: ****texto**** -> **texto**)
    .replace(/\*\*\*\*+/g, '**')
    // Limpar espaços dentro dos marcadores
    .replace(/\*\*\s+/g, '**')
    .replace(/\s+\*\*/g, '**')
    // Remover marcadores vazios
    .replace(/\*\*\*\*/g, '')
    // Limpar espaços excessivos
    .replace(/\s+/g, ' ')
    .trim();
  
  // Se não encontrou nenhum destaque após processamento, retornar vazio
  if (!textoComDestaques.includes('**')) return '';
  
  return textoComDestaques;
}

// Função para limpar ementa - extrai apenas texto relevante
function limparEmenta(ementa: string): string {
  if (!ementa) return '';
  
  let texto = limparHtml(ementa);
  
  // Remover cabeçalhos do processo (RELATOR:, AGRAVANTE:, etc)
  texto = texto
    .replace(/^.*?EMENTA[\s:–-]*/i, '') // Pegar só depois de EMENTA
    .replace(/RELATOR\s*:\s*MINISTR[OA]\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+/gi, '')
    .replace(/AGRAVAN?TE\s*:\s*[^\n]+/gi, '')
    .replace(/AGRAVAD[OA]\s*:\s*[^\n]+/gi, '')
    .replace(/RECORRENTE\s*:\s*[^\n]+/gi, '')
    .replace(/RECORRID[OA]\s*:\s*[^\n]+/gi, '')
    .replace(/ADVOGAD[OA]\s*:\s*[^\n]+/gi, '')
    .replace(/INTERES\.\s*:\s*[^\n]+/gi, '')
    .replace(/PROC\.\s*:\s*[^\n]+/gi, '')
    .trim();
  
  return texto;
}
