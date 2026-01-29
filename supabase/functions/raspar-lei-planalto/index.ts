import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

async function callGemini(prompt: string): Promise<string> {
  let lastError: Error | null = null;
  
  for (const apiKey of GEMINI_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
          }),
        }
      );

      if (response.status === 429) {
        console.log('[Gemini] Rate limit, próxima chave...');
        continue;
      }

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }
  
  throw lastError || new Error('Todas as chaves Gemini falharam');
}

function gerarUrl(lei: string | null): string | null {
  if (!lei) return null;
  const numMatch = lei.match(/n[ºo°]?\s*([\d.]+)/i);
  if (!numMatch) return null;
  const numero = numMatch[1].replace(/\./g, '');
  const leiLower = lei.toLowerCase();
  
  if (leiLower.includes('emenda constitucional')) {
    return `https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc${numero}.htm`;
  }
  if (leiLower.includes('lei complementar') || leiLower.startsWith('lc')) {
    return `https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp${numero}.htm`;
  }
  if (leiLower.includes('lei')) {
    const numInt = parseInt(numero);
    if (numInt >= 10000) {
      return `https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l${numero}.htm`;
    }
    return `https://www.planalto.gov.br/ccivil_03/leis/l${numero}.htm`;
  }
  return null;
}

// Extrair alterações automaticamente via regex (mais confiável que Gemini)
function extrairAlteracoesAutomatico(texto: string): any[] {
  const alteracoes: any[] = [];
  
  // Padrão para encontrar anotações entre parênteses
  const padraoAnotacao = /\((?:Redação dada|Incluído|Revogado|Acrescido|Suprimido|Vetado|Vide|Vigência|Renumerado|Expressão suprimida)[^)]+\)/gi;
  
  // Dividir por artigos para contexto
  const linhas = texto.split(/\n/);
  let artigoAtual = '';
  let incisoAtual = '';
  let paragrafoAtual = '';
  
  for (const linha of linhas) {
    // Detectar artigo atual
    const matchArtigo = linha.match(/Art\.?\s*(\d+[ºª°-]?[A-Z]?)/i);
    if (matchArtigo) {
      artigoAtual = matchArtigo[1].replace(/[ºª°]/g, '');
      incisoAtual = '';
      paragrafoAtual = '';
    }
    
    // Detectar parágrafo
    const matchParagrafo = linha.match(/§\s*(\d+[ºª°]?)/i);
    if (matchParagrafo) {
      paragrafoAtual = matchParagrafo[1];
    }
    
    // Detectar inciso (números romanos)
    const matchInciso = linha.match(/^\s*(X{0,3}(?:IX|IV|V?I{0,3}))\s*[-–—]/);
    if (matchInciso) {
      incisoAtual = matchInciso[1];
    }
    
    // Encontrar todas as anotações na linha
    const anotacoes = linha.match(padraoAnotacao);
    if (anotacoes && artigoAtual) {
      for (const anotacao of anotacoes) {
        // Classificar tipo de alteração
        let tipoAlteracao = 'Outro';
        if (/Redação dada/i.test(anotacao)) tipoAlteracao = 'Redação';
        else if (/Incluído/i.test(anotacao)) tipoAlteracao = 'Inclusão';
        else if (/Revogado/i.test(anotacao)) tipoAlteracao = 'Revogação';
        else if (/Acrescido/i.test(anotacao)) tipoAlteracao = 'Acréscimo';
        else if (/Suprimido/i.test(anotacao)) tipoAlteracao = 'Supressão';
        else if (/Vetado/i.test(anotacao)) tipoAlteracao = 'Vetado';
        else if (/Vide/i.test(anotacao)) tipoAlteracao = 'Vide';
        else if (/Vigência/i.test(anotacao)) tipoAlteracao = 'Vigência';
        else if (/Renumerado/i.test(anotacao)) tipoAlteracao = 'Renumeração';
        
        // Extrair lei alteradora
        const matchLei = anotacao.match(/(?:Lei|Decreto(?:-Lei)?|Medida Provisória|Emenda Constitucional)\s+n[ºo°]?\s*[\d.]+(?:[,\s]+de\s+[\d.]+)?/i);
        const leiAlteradora = matchLei ? matchLei[0] : null;
        
        // Extrair ano
        const matchAno = anotacao.match(/\b(19\d{2}|20\d{2})\b/);
        const anoAlteracao = matchAno ? parseInt(matchAno[1]) : null;
        
        // Determinar tipo de elemento
        let elementoTipo = 'artigo';
        let elementoNumero = null;
        
        if (paragrafoAtual) {
          elementoTipo = 'parágrafo';
          elementoNumero = `§ ${paragrafoAtual}`;
        } else if (incisoAtual) {
          elementoTipo = 'inciso';
          elementoNumero = incisoAtual;
        }
        
        alteracoes.push({
          numero_artigo: artigoAtual,
          elemento_tipo: elementoTipo,
          elemento_numero: elementoNumero,
          tipo_alteracao: tipoAlteracao,
          lei_alteradora: leiAlteradora,
          ano_alteracao: anoAlteracao,
          texto_completo: anotacao
        });
      }
    }
  }
  
  return alteracoes;
}

// Dividir texto em chunks menores
function dividirEmChunks(texto: string, maxChars: number = 30000): string[] {
  const chunks: string[] = [];
  
  // Tentar dividir por artigos
  const artigoPattern = /(?=Art\.\s*\d+)/gi;
  const partes = texto.split(artigoPattern);
  
  let chunkAtual = '';
  for (const parte of partes) {
    if ((chunkAtual + parte).length > maxChars) {
      if (chunkAtual) chunks.push(chunkAtual);
      chunkAtual = parte;
    } else {
      chunkAtual += parte;
    }
  }
  if (chunkAtual) chunks.push(chunkAtual);
  
  return chunks.length > 0 ? chunks : [texto];
}

// Prompt para Gemini extrair alterações
function getPromptExtracao(textoChunk: string): string {
  return `Analise este trecho de lei brasileira e EXTRAIA TODAS as anotações entre parênteses que indicam alterações legislativas.

PROCURE POR PADRÕES COMO:
- (Incluído pela Lei nº X)
- (Incluído pelo Decreto nº X)
- (Redação dada pela Lei nº X)
- (Revogado pela Lei nº X)
- (Revogado pela Medida Provisória nº X)
- (Acrescido pela Lei nº X)
- (Suprimido pela Lei nº X)
- (Vetado)
- (Vide Lei nº X)
- (Vigência)
- (Renumerado pela Lei nº X)
- (Expressão suprimida pela Lei nº X)

Para CADA alteração encontrada, identifique:
1. numero_artigo: O número do artigo onde está (ex: "44", "5º", "1.029")
2. elemento_tipo: "artigo", "inciso", "parágrafo", "alínea" ou "caput"
3. elemento_numero: O número/letra do elemento (ex: "I", "II", "§ 1º", "a", "b")
4. tipo_alteracao: "Inclusão", "Revogação", "Redação", "Acréscimo", "Vetado", "Vide", "Vigência", "Supressão", "Renumeração"
5. lei_alteradora: A lei/decreto/medida que fez a alteração (ex: "Lei nº 14.382, de 2022")
6. ano_alteracao: O ano (ex: 2022)
7. texto_completo: O texto exato entre parênteses (ex: "(Revogado pela Lei nº 14.382, de 2022)")

REGRAS:
- Analise LINHA POR LINHA
- Identifique se a alteração está em um inciso (I, II, III...), parágrafo (§), ou alínea (a, b, c...)
- Se não conseguir identificar, use "artigo" como tipo
- Capture o texto exato entre parênteses

Retorne APENAS um JSON válido:
{
  "alteracoes": [
    {
      "numero_artigo": "44",
      "elemento_tipo": "inciso",
      "elemento_numero": "VI",
      "tipo_alteracao": "Revogação",
      "lei_alteradora": "Lei nº 14.382, de 2022",
      "ano_alteracao": 2022,
      "texto_completo": "(Revogado pela Lei nº 14.382, de 2022)"
    }
  ]
}

Se não encontrar alterações, retorne: {"alteracoes": []}

TEXTO DA LEI:
${textoChunk}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tableName, urlPlanalto, stream = false } = await req.json();
    
    if (!tableName || !urlPlanalto) {
      return new Response(
        JSON.stringify({ error: 'tableName e urlPlanalto são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (GEMINI_KEYS.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma chave Gemini configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se streaming está ativado, usar SSE
    if (stream) {
      const encoder = new TextEncoder();
      
      const readable = new ReadableStream({
        async start(controller) {
          const send = (event: string, data: any) => {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          };
          
          try {
            // ============ FASE 1: RASPAR COM FIRECRAWL ============
            send('fase', { fase: 'raspando', titulo: 'Fase 1: Raspando texto do Planalto' });
            send('log', { mensagem: 'Conectando ao Firecrawl...' });
            
            const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
            if (!firecrawlApiKey) {
              throw new Error('FIRECRAWL_API_KEY não configurada');
            }

            send('log', { mensagem: 'Baixando texto da lei...' });

            const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: urlPlanalto,
                formats: ['markdown', 'html'],
                onlyMainContent: false, // IMPORTANTE: false para capturar anotações de alteração
                waitFor: 3000,
                timeout: 60000,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(`Firecrawl: ${errorData.error || response.status}`);
            }

            const data = await response.json();
            const markdown = data.data?.markdown || data.markdown || '';
            const html = data.data?.html || data.html || '';
            
            // Preferir HTML quando tiver anotações de alteração (links com "Redação dada", etc)
            // pois o markdown pode perder essas informações importantes
            const temAnotacoesHtml = html.includes('Redação dada') || 
                                     html.includes('Incluído pela') || 
                                     html.includes('Revogado pela') ||
                                     html.includes('Acrescido pela');
            
            let textoLei = markdown;
            if (temAnotacoesHtml && html.length > 0) {
              // Converter HTML para texto preservando as anotações
              textoLei = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<a[^>]*href="[^"]*"[^>]*>([^<]+)<\/a>/gi, '$1') // Manter texto dos links
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>/gi, '\n\n')
                .replace(/<\/div>/gi, '\n')
                .replace(/<\/li>/gi, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\n{3,}/g, '\n\n')
                .trim();
              send('log', { mensagem: `📊 Usando HTML (com anotações de alteração)`, tipo: 'info' });
            }
            
            send('log', { mensagem: `✓ Texto recebido: ${textoLei.length.toLocaleString()} caracteres`, tipo: 'success' });
            
            // Verificar se capturou anotações de alteração
            const anotacoesEncontradas = (textoLei.match(/\((?:Redação dada|Incluído|Revogado|Acrescido|Vetado)[^)]+\)/gi) || []).length;
            send('log', { mensagem: `📝 Anotações de alteração encontradas: ${anotacoesEncontradas}`, tipo: 'info' });
            
            // Enviar texto bruto completo para visualização
            send('texto_bruto', { 
              texto: textoLei.substring(0, 5000), // Primeiros 5000 chars para preview
              total: textoLei.length,
              anotacoes: anotacoesEncontradas
            });

            if (!textoLei || textoLei.length < 100) {
              throw new Error('Texto da lei muito curto ou vazio');
            }

            // ============ FASE 2: EXTRAÇÃO AUTOMÁTICA VIA REGEX ============
            send('fase', { fase: 'extraindo', titulo: 'Fase 2: Extraindo alterações automaticamente' });
            send('log', { mensagem: 'Analisando texto com regex para encontrar anotações...' });
            
            // Usar extração automática (muito mais rápida e confiável)
            const todasAlteracoes = extrairAlteracoesAutomatico(textoLei);
            
            send('log', { 
              mensagem: `✓ Extração automática: ${todasAlteracoes.length} alteração(ões) encontrada(s)`, 
              tipo: 'success' 
            });
            
            // Enviar cada alteração encontrada
            for (const alt of todasAlteracoes) {
              send('alteracao', {
                numero_artigo: alt.numero_artigo,
                elemento_tipo: alt.elemento_tipo,
                elemento_numero: alt.elemento_numero,
                tipo_alteracao: alt.tipo_alteracao,
                lei_alteradora: alt.lei_alteradora,
                ano_alteracao: alt.ano_alteracao,
                texto_completo: alt.texto_completo
              });
            }
            
            // Mostrar estatísticas por tipo
            const tiposCount: Record<string, number> = {};
            for (const alt of todasAlteracoes) {
              tiposCount[alt.tipo_alteracao] = (tiposCount[alt.tipo_alteracao] || 0) + 1;
            }
            
            send('log', { 
              mensagem: `Tipos: ${Object.entries(tiposCount).map(([t, c]) => `${t}: ${c}`).join(', ')}`, 
              tipo: 'info' 
            });

            send('log', { mensagem: `Total de alterações extraídas: ${todasAlteracoes.length}`, tipo: 'info' });

            // ============ FASE 4: SALVAR NO BANCO ============
            send('fase', { fase: 'salvando', titulo: 'Fase 4: Salvando no banco de dados' });
            
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            if (todasAlteracoes.length > 0) {
              // Ordenar por ano (mais recente primeiro)
              todasAlteracoes.sort((a, b) => {
                if (a.ano_alteracao && b.ano_alteracao) {
                  return b.ano_alteracao - a.ano_alteracao;
                }
                return 0;
              });
              
              send('log', { mensagem: 'Apagando registros antigos...' });
              await supabase.from('historico_alteracoes').delete().eq('tabela_lei', tableName);

              const dadosParaInserir = todasAlteracoes.map(alt => ({
                tabela_lei: tableName,
                numero_artigo: String(alt.numero_artigo || ''),
                tipo_alteracao: alt.tipo_alteracao || 'Outro',
                lei_alteradora: alt.lei_alteradora || null,
                ano_alteracao: alt.ano_alteracao || null,
                texto_completo: alt.texto_completo || null,
                elemento_tipo: alt.elemento_tipo || 'artigo',
                elemento_numero: alt.elemento_numero || null,
                elemento_texto: null,
                url_lei_alteradora: gerarUrl(alt.lei_alteradora)
              }));

              const batchSize = 100;
              for (let i = 0; i < dadosParaInserir.length; i += batchSize) {
                const batch = dadosParaInserir.slice(i, i + batchSize);
                await supabase.from('historico_alteracoes').insert(batch);
                
                send('salvando', {
                  lote: Math.floor(i / batchSize) + 1,
                  totalLotes: Math.ceil(dadosParaInserir.length / batchSize),
                  registrosSalvos: Math.min(i + batchSize, dadosParaInserir.length)
                });
              }
              
              send('log', { mensagem: `✓ ${dadosParaInserir.length} registros salvos`, tipo: 'success' });
            }

            // Estatísticas
            const porElemento = {
              artigo: todasAlteracoes.filter(a => a.elemento_tipo === 'artigo').length,
              inciso: todasAlteracoes.filter(a => a.elemento_tipo === 'inciso').length,
              paragrafo: todasAlteracoes.filter(a => a.elemento_tipo === 'parágrafo').length,
              alinea: todasAlteracoes.filter(a => a.elemento_tipo === 'alínea').length,
              caput: todasAlteracoes.filter(a => a.elemento_tipo === 'caput').length,
            };
            
            const tiposEncontrados = [...new Set(todasAlteracoes.map(a => a.tipo_alteracao))];

            send('concluido', {
              success: true,
              caracteresRaspados: textoLei.length,
              totalAlteracoes: todasAlteracoes.length,
              tiposEncontrados,
              porElemento
            });

          } catch (error: any) {
            send('erro', { message: error.message || 'Erro desconhecido' });
          } finally {
            controller.close();
          }
        }
      });

      return new Response(readable, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // Modo não-streaming (fallback)
    return new Response(
      JSON.stringify({ error: 'Use stream: true' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[raspar-lei-planalto] Erro:`, error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
