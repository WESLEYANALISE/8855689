import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para extrair ementa usando Gemini AI
async function extrairEmentaComIA(html: string, numeroLei: string): Promise<string | null> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    console.error('LOVABLE_API_KEY não configurada');
    return null;
  }

  // Limitar HTML para evitar exceder tokens
  const htmlLimitado = html.substring(0, 15000);

  const prompt = `Analise o HTML de uma página de lei do Planalto (${numeroLei}) e extraia APENAS a ementa (resumo) da lei.

REGRAS IMPORTANTES:
1. A ementa é o texto que descreve o objetivo/conteúdo da lei
2. Geralmente está em texto vermelho (color="#800000" ou <font color="#800000">)
3. Aparece logo após o título da lei (ex: "LEI Nº 15.XXX, DE XX DE XXX DE 2025")
4. Geralmente começa com verbos como: Abre, Altera, Dispõe, Institui, Estabelece, Autoriza, Cria, Modifica, Regulamenta, Aprova, Dá, Denomina, Acrescenta, Revoga, Inclui, Fixa, Estima
5. NÃO inclui o título da lei (Lei nº X.XXX...)
6. NÃO inclui "O PRESIDENTE DA REPÚBLICA"
7. NÃO inclui textos como "Vigência" ou "Conversão de Medida Provisória"

RETORNE APENAS o texto da ementa, sem aspas, sem formatação, sem explicações. Se não conseguir encontrar, retorne "NAO_ENCONTRADA".

HTML:
${htmlLimitado}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro Gemini:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const ementa = data.choices?.[0]?.message?.content?.trim();

    if (!ementa || ementa === 'NAO_ENCONTRADA' || ementa.length < 20) {
      console.log('IA não conseguiu extrair ementa');
      return null;
    }

    // Validar que não é o título da lei
    if (/^Lei\s+(nº|Ordinária|Complementar)/i.test(ementa)) {
      console.log('IA retornou título ao invés de ementa');
      return null;
    }

    return ementa;
  } catch (error) {
    console.error('Erro ao chamar Gemini:', error);
    return null;
  }
}

// Função para extrair ementa com regex do texto bruto/HTML
function extrairEmentaComRegex(html: string): string | null {
  const limparTexto = (texto: string) => {
    return texto
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const isEmentaValida = (texto: string) => {
    if (!texto || texto.length < 20) return false;
    if (/^Lei\s+(nº|Ordinária|Complementar)/i.test(texto)) return false;
    if (/^Vigência/i.test(texto)) return false;
    if (/^O\s*PRESIDENTE/i.test(texto)) return false;
    return true;
  };

  // Padrão 1: Texto em font color="#800000" (vermelho) - MAIS COMUM
  const redFontPattern = /<font[^>]*color=["']?#800000["']?[^>]*>([\s\S]*?)<\/font>/gi;
  const redMatches = [...html.matchAll(redFontPattern)];
  
  for (const match of redMatches) {
    const texto = limparTexto(match[1]);
    // Verifica se começa com verbo típico de ementa
    if (/^(?:Abre|Altera|Dispõe|Institui|Estabelece|Autoriza|Cria|Modifica|Regulamenta|Aprova|Dá|Denomina|Acrescenta|Revoga|Inclui|Fixa|Estima|Inscreve|Confere|Concede)/i.test(texto)) {
      if (isEmentaValida(texto) && texto.length >= 30 && texto.length <= 2000) {
        console.log('Ementa encontrada via font color="#800000"');
        return texto;
      }
    }
  }

  // Padrão 2: Span com style de fonte vermelha
  const spanPattern = /<span[^>]*style="[^"]*font-family:[^"]*Arial[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
  const spanMatches = [...html.matchAll(spanPattern)];
  
  for (const match of spanMatches) {
    const texto = limparTexto(match[1]);
    if (/^(?:Abre|Altera|Dispõe|Institui|Estabelece|Autoriza|Cria|Modifica|Regulamenta|Aprova|Dá|Denomina|Acrescenta|Revoga|Inclui|Fixa|Estima|Inscreve|Confere|Concede)/i.test(texto)) {
      if (isEmentaValida(texto) && texto.length >= 30 && texto.length <= 2000) {
        console.log('Ementa encontrada via span style');
        return texto;
      }
    }
  }

  // Padrão 3: Qualquer texto que começa com verbo típico de ementa
  const verbosEmenta = /(?:>|\s)((?:Abre|Altera|Dispõe|Institui|Estabelece|Autoriza|Cria|Modifica|Regulamenta|Aprova|Dá|Denomina|Acrescenta|Revoga|Inclui|Fixa|Estima|Inscreve|Confere|Concede)[^<]{30,2000}?)(?:<\/|O\s*PRESIDENTE)/i;
  const verbMatch = html.match(verbosEmenta);
  if (verbMatch) {
    const textoExtraido = limparTexto(verbMatch[1]);
    if (isEmentaValida(textoExtraido) && textoExtraido.length >= 30) {
      console.log('Ementa encontrada via padrão de verbo');
      return textoExtraido;
    }
  }

  return null;
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

    const body = await req.json().catch(() => ({}));
    const limite = body.limite || 10;
    const leiId = body.leiId;
    const usarIA = body.usarIA !== false;

    // Query para buscar leis com ementa inválida - INCLUINDO texto_bruto
    let query = supabase
      .from('leis_push_2025')
      .select('id, numero_lei, ementa, url_planalto, texto_bruto');
    
    if (leiId) {
      query = query.eq('id', leiId);
    } else {
      // Buscar ementas que começam com "Lei" ou são marcadas como pendentes
      query = query.or(
        'ementa.ilike.Lei nº%,' +
        'ementa.ilike.Lei Ordinária%,' +
        'ementa.ilike.Lei Complementar%,' +
        'ementa.eq.Ementa pendente de extração,' +
        'ementa.eq.Ementa pendente,' +
        'ementa.is.null'
      );
    }
    
    const { data: leisInvalidas, error } = await query.limit(limite);

    if (error) {
      throw error;
    }

    if (!leisInvalidas || leisInvalidas.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhuma lei com ementa inválida encontrada', 
          corrigidas: 0,
          metodo: usarIA ? 'gemini-ai' : 'regex'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Corrigindo ${leisInvalidas.length} leis com ementa inválida...`);

    const resultados: { 
      numero_lei: string; 
      ementa_antiga: string; 
      ementa_nova: string; 
      sucesso: boolean;
      metodo: string;
    }[] = [];

    for (const lei of leisInvalidas) {
      try {
        console.log(`Processando: ${lei.numero_lei}`);
        
        let html = '';
        let metodoUsado = '';
        let ementaNova: string | null = null;

        // PRIORIDADE 1: Usar texto_bruto se disponível (evita nova raspagem)
        if (lei.texto_bruto && lei.texto_bruto.length > 100) {
          console.log(`Usando texto_bruto existente para ${lei.numero_lei}`);
          html = lei.texto_bruto;
          
          // Tentar extrair com regex primeiro (mais rápido)
          ementaNova = extrairEmentaComRegex(html);
          metodoUsado = 'regex-texto-bruto';
          
          // Se regex falhou e IA está habilitada, tentar com IA
          if (!ementaNova && usarIA) {
            console.log(`Regex falhou, tentando IA para ${lei.numero_lei}...`);
            ementaNova = await extrairEmentaComIA(html, lei.numero_lei);
            metodoUsado = 'ia-texto-bruto';
          }
        }

        // PRIORIDADE 2: Se não tem texto_bruto ou não conseguiu extrair, raspar novamente
        if (!ementaNova && firecrawlApiKey && lei.url_planalto) {
          console.log(`Raspando página para ${lei.numero_lei}...`);
          
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: lei.url_planalto,
              formats: ['html'],
              waitFor: 2000,
            }),
          });

          const scrapeData = await scrapeResponse.json();

          if (scrapeResponse.ok && scrapeData.success) {
            html = scrapeData.data?.html || '';
            
            // Tentar regex primeiro
            ementaNova = extrairEmentaComRegex(html);
            metodoUsado = 'regex-scrape';
            
            // Se regex falhou e IA está habilitada
            if (!ementaNova && usarIA) {
              ementaNova = await extrairEmentaComIA(html, lei.numero_lei);
              metodoUsado = 'ia-scrape';
            }
            
            // Atualizar texto_bruto se estava vazio
            if (!lei.texto_bruto && html) {
              await supabase
                .from('leis_push_2025')
                .update({ texto_bruto: html })
                .eq('id', lei.id);
              console.log(`Texto bruto atualizado para ${lei.numero_lei}`);
            }
          } else {
            console.error(`Erro ao raspar ${lei.numero_lei}:`, scrapeData);
          }
        }

        if (!ementaNova || ementaNova.length < 30) {
          console.log(`Não foi possível extrair ementa de ${lei.numero_lei}`);
          resultados.push({
            numero_lei: lei.numero_lei,
            ementa_antiga: lei.ementa || '',
            ementa_nova: '',
            sucesso: false,
            metodo: metodoUsado || 'nenhum',
          });
          continue;
        }

        // Limpar ementa
        ementaNova = ementaNova
          .replace(/\s+/g, ' ')
          .replace(/^\s*\.\s*/, '')
          .trim();

        // Atualizar no banco
        const { error: updateError } = await supabase
          .from('leis_push_2025')
          .update({ ementa: ementaNova })
          .eq('id', lei.id);

        if (updateError) {
          console.error(`Erro ao atualizar ${lei.numero_lei}:`, updateError);
          resultados.push({
            numero_lei: lei.numero_lei,
            ementa_antiga: lei.ementa || '',
            ementa_nova: ementaNova,
            sucesso: false,
            metodo: metodoUsado,
          });
        } else {
          console.log(`✅ Corrigida (${metodoUsado}): ${lei.numero_lei} - ${ementaNova.substring(0, 60)}...`);
          resultados.push({
            numero_lei: lei.numero_lei,
            ementa_antiga: lei.ementa || '',
            ementa_nova: ementaNova,
            sucesso: true,
            metodo: metodoUsado,
          });
        }

        // Delay para não sobrecarregar APIs (menor se usou texto_bruto)
        await new Promise(resolve => setTimeout(resolve, metodoUsado.includes('texto-bruto') ? 100 : 500));

      } catch (err) {
        console.error(`Erro ao processar ${lei.numero_lei}:`, err);
        resultados.push({
          numero_lei: lei.numero_lei,
          ementa_antiga: lei.ementa || '',
          ementa_nova: '',
          sucesso: false,
          metodo: 'erro',
        });
      }
    }

    const corrigidas = resultados.filter(r => r.sucesso).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `${corrigidas} de ${leisInvalidas.length} ementas corrigidas`,
        corrigidas,
        total: leisInvalidas.length,
        resultados,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao corrigir ementas:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
