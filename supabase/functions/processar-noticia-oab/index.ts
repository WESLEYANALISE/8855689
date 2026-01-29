import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { DOMParser, Element, Node } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Converter HTML para texto simples (limpo)
function htmlToPlainText(element: Element): string {
  let result = '';
  
  for (const node of element.childNodes) {
    if (node.nodeType === 3) { // Text node
      result += node.textContent;
    } else if (node.nodeType === 1) { // Element node
      const el = node as Element;
      const tag = el.tagName?.toLowerCase() || '';
      
      if (tag === 'p' || tag === 'div') {
        result += '\n\n' + htmlToPlainText(el);
      } else if (tag === 'br') {
        result += '\n';
      } else if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
        result += '\n\n' + htmlToPlainText(el) + '\n';
      } else if (tag === 'li') {
        result += '\n- ' + htmlToPlainText(el);
      } else if (tag === 'ul' || tag === 'ol') {
        result += '\n' + htmlToPlainText(el) + '\n';
      } else if (tag === 'script' || tag === 'style' || tag === 'nav' || tag === 'header' || tag === 'footer') {
        // Skip
      } else {
        result += htmlToPlainText(el);
      }
    }
  }
  
  return result;
}

// Limpar texto
function cleanText(text: string): string {
  return text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n +/g, '\n')
    .replace(/ +\n/g, '\n')
    .trim();
}

// Formatar conteúdo com Gemini
async function formatarConteudoComGemini(titulo: string, conteudoBruto: string): Promise<string | null> {
  const geminiKeys = [
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
    Deno.env.get('GEMINI_KEY_3'),
    Deno.env.get('GEMINI_API_KEY'),
  ].filter(Boolean) as string[];

  if (geminiKeys.length === 0) {
    console.log('No Gemini API keys available for formatting');
    return null;
  }

  const prompt = `Você é um editor de notícias jurídicas especializado em formatação para leitura. Formate a seguinte notícia de forma clara e profissional.

TÍTULO: ${titulo}

CONTEÚDO BRUTO:
${conteudoBruto.slice(0, 8000)}

INSTRUÇÕES DE FORMATAÇÃO:
1. Crie um resumo inicial de 2-3 frases sobre o tema principal
2. Destaque os PONTOS PRINCIPAIS com marcadores (use "🔹" para cada ponto)
3. Organize o conteúdo em seções claras com títulos (## Seção)
4. **DATAS IMPORTANTES**: Destaque em negrito todas as datas citadas
5. **LINKS**: Se o texto mencionar recursos, documentos ou links (gabaritos, resultados, consultas), formate como links clicáveis markdown:
   - Use [Nome do recurso](URL) se a URL for encontrada no texto
   - Se mencionar um recurso mas não tiver URL no texto, NÃO escreva "(Link não fornecido)" - apenas descreva o recurso sem link
6. Use formatação markdown: **negrito** para termos importantes, > para citações
7. Remova qualquer conteúdo irrelevante (menus, rodapés, propagandas)
8. Se mencionar documentos, editais ou resultados, destaque claramente em seções próprias

IMPORTANTE:
- NUNCA escreva "(Link não fornecido)" ou similar - se não tiver link, apenas descreva
- Formate links reais quando encontrados no texto
- Destaque datas com **negrito** (ex: **30 de janeiro de 2026**)

FORMATO DE SAÍDA:
Use markdown limpo e legível. Não inclua cabeçalho com o título (já será exibido separadamente).`;

  for (const apiKey of geminiKeys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 4000,
            }
          }),
        }
      );

      if (!response.ok) {
        console.log(`Gemini formatting failed: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        console.log('Content formatted successfully with Gemini');
        return text;
      }
    } catch (error) {
      console.error('Gemini formatting error:', error);
      continue;
    }
  }

  return null;
}

// Extrair data da página se não tiver
function extractDateFromPage(doc: any): string | null {
  // Padrões comuns de data
  const datePatterns = [
    /(\d{1,2})\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/gi,
    /(\d{2})\/(\d{2})\/(\d{4})/g,
    /(\d{4})-(\d{2})-(\d{2})/g
  ];

  const months: Record<string, string> = {
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
    'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
    'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
  };

  // Procurar em elementos comuns de data
  const dateSelectors = ['.data', '.date', '.noticia-data', 'time', '[datetime]', '.post-date', '.entry-date'];
  
  for (const selector of dateSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      const text = el.textContent || el.getAttribute('datetime') || '';
      
      // Tentar formato português
      const ptMatch = text.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
      if (ptMatch) {
        const day = ptMatch[1].padStart(2, '0');
        const month = months[ptMatch[2].toLowerCase()];
        const year = ptMatch[3];
        if (month) return `${year}-${month}-${day}`;
      }
      
      // Tentar formato ISO
      const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) return isoMatch[0];
      
      // Tentar formato BR
      const brMatch = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
    }
  }

  // Procurar no corpo do texto
  const bodyText = doc.body?.textContent || '';
  const ptMatch = bodyText.match(/(\d{1,2})\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/i);
  if (ptMatch) {
    const day = ptMatch[1].padStart(2, '0');
    const month = months[ptMatch[2].toLowerCase()];
    const year = ptMatch[3];
    if (month) return `${year}-${month}-${day}`;
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get unprocessed news items (limit to 3 per run for reliability)
    const { data: pendingNews, error: fetchError } = await supabase
      .from('noticias_oab_cache')
      .select('*')
      .eq('processado', false)
      .is('erro_processamento', null)
      .order('created_at', { ascending: true })
      .limit(3);

    if (fetchError) {
      console.error('Error fetching pending news:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingNews || pendingNews.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No pending news to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${pendingNews.length} news items`);

    let processed = 0;
    let errors = 0;

    for (const news of pendingNews) {
      try {
        console.log(`Processing: ${news.titulo} - ${news.link}`);

        // Fetch content using native fetch
        const response = await fetch(news.link, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          },
        });

        if (!response.ok) {
          console.error(`Failed to fetch ${news.link}: ${response.status}`);
          await supabase
            .from('noticias_oab_cache')
            .update({ erro_processamento: `HTTP ${response.status}` })
            .eq('id', news.id);
          errors++;
          continue;
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        if (!doc) {
          console.error(`Failed to parse HTML for ${news.link}`);
          await supabase
            .from('noticias_oab_cache')
            .update({ erro_processamento: 'Failed to parse HTML' })
            .eq('id', news.id);
          errors++;
          continue;
        }

        // Extract main content - try multiple selectors
        const contentSelectors = [
          '.noticia-content',
          '.noticia-corpo',
          'article .content',
          'article',
          '.content',
          '.post-content',
          '.entry-content',
          'main .content',
          '#content',
          'main',
        ];

        let mainContent: Element | null = null;
        for (const selector of contentSelectors) {
          mainContent = doc.querySelector(selector);
          if (mainContent) break;
        }

        // Get plain text content
        let rawContent = '';
        if (mainContent) {
          rawContent = cleanText(htmlToPlainText(mainContent));
        } else {
          const body = doc.querySelector('body');
          if (body) {
            rawContent = cleanText(htmlToPlainText(body));
          }
        }

        // Extract date from page if not available
        let dataPublicacao = news.data_publicacao;
        if (!dataPublicacao) {
          const extractedDate = extractDateFromPage(doc);
          if (extractedDate) {
            dataPublicacao = new Date(extractedDate).toISOString();
            console.log(`Extracted date from page: ${extractedDate}`);
          }
        }

        // Format content with Gemini AI
        let formattedContent = rawContent;
        if (rawContent.length > 100) {
          const aiFormatted = await formatarConteudoComGemini(news.titulo, rawContent);
          if (aiFormatted) {
            formattedContent = aiFormatted;
          }
        }

        // Update the news item with processed content
        const { error: updateError } = await supabase
          .from('noticias_oab_cache')
          .update({
            conteudo_completo: formattedContent.slice(0, 50000),
            data_publicacao: dataPublicacao,
            processado: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', news.id);

        if (updateError) {
          console.error(`Error updating news ${news.id}:`, updateError);
          errors++;
        } else {
          processed++;
          console.log(`Successfully processed: ${news.titulo}`);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (itemError) {
        console.error(`Error processing news ${news.id}:`, itemError);
        await supabase
          .from('noticias_oab_cache')
          .update({ erro_processamento: itemError instanceof Error ? itemError.message : 'Unknown error' })
          .eq('id', news.id);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processed} news items, ${errors} errors`,
        processed,
        errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing OAB news:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
