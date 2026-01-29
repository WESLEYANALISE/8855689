import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean);

async function callGeminiWithFallback(prompt: string): Promise<string> {
  for (const apiKey of GEMINI_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 4000 }
          })
        }
      );

      if (response.status === 429 || response.status === 503) continue;
      if (!response.ok) continue;

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch {
      continue;
    }
  }
  throw new Error('Todas as chaves Gemini falharam');
}

// Função para limpar e extrair texto principal da notícia
function extrairConteudoPrincipal(html: string): { titulo: string; subtitulo: string; conteudo: string; autor: string; dataPublicacao: string } {
  let titulo = '';
  let subtitulo = '';
  let conteudo = '';
  let autor = '';
  let dataPublicacao = '';

  // Extrair título - og:title ou h1
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  if (ogTitleMatch) {
    titulo = ogTitleMatch[1];
  } else {
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) titulo = h1Match[1];
  }

  // Extrair subtítulo - og:description ou meta description
  const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:description["']/i) ||
                      html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (ogDescMatch) {
    subtitulo = ogDescMatch[1];
  }

  // Extrair autor
  const autorMatch = html.match(/<meta[^>]+name=["']author["'][^>]*content=["']([^"']+)["']/i) ||
                     html.match(/<span[^>]*class=["'][^"']*author[^"']*["'][^>]*>([^<]+)<\/span>/i) ||
                     html.match(/<a[^>]*class=["'][^"']*author[^"']*["'][^>]*>([^<]+)<\/a>/i);
  if (autorMatch) {
    autor = autorMatch[1].trim();
  }

  // Extrair data de publicação
  const dataMatch = html.match(/<time[^>]*datetime=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i);
  if (dataMatch) {
    try {
      const date = new Date(dataMatch[1]);
      dataPublicacao = date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      dataPublicacao = dataMatch[1];
    }
  }

  // Extrair conteúdo principal do artigo
  const articlePatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class=["'][^"']*(?:content|article|post|entry|texto|materia|corpo)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
  ];

  let articleContent = '';
  for (const pattern of articlePatterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].length > articleContent.length) {
      articleContent = match[1];
    }
  }

  if (!articleContent) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) articleContent = bodyMatch[1];
  }

  // Extrair parágrafos do conteúdo
  const paragrafos: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(articleContent)) !== null) {
    let texto = pMatch[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)))
      .trim();

    if (texto.length > 30 && !texto.includes('Assine') && !texto.includes('cadastre-se') && !texto.includes('Leia também')) {
      paragrafos.push(texto);
    }
  }

  conteudo = paragrafos.join('\n\n');

  titulo = titulo
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .trim();

  subtitulo = subtitulo
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .trim();

  return { titulo, subtitulo, conteudo, autor, dataPublicacao };
}

async function formatarComGemini(conteudo: string, titulo: string): Promise<{ conteudoFormatado: string; termos: Array<{termo: string; significado: string}> }> {
  if (!conteudo || conteudo.length < 50) return { conteudoFormatado: conteudo, termos: [] };

  const prompt = `Você é um editor de texto de notícias. Faça DUAS tarefas:

TAREFA 1 - REFORMATAR O TEXTO:
Reformate o texto da notícia para melhor leitura mobile.

TÍTULO: ${titulo}

TEXTO ORIGINAL:
${conteudo}

REGRAS DE FORMATAÇÃO OBRIGATÓRIAS:
1. MANTENHA o texto original - não altere palavras
2. SEPARE cada parágrafo com UMA LINHA EM BRANCO (não apenas quebra de linha)
3. Cada parágrafo deve ter NO MÁXIMO 2-3 frases
4. Se houver citação direta, use > antes
5. Destaque em **negrito** APENAS: valores monetários (R$, US$), porcentagens (%), e números de votação
6. NÃO destaque nomes de pessoas, partidos, instituições ou texto comum

EXEMPLO DE FORMATAÇÃO CORRETA:
"A Primeira Turma do STF tornou réus três denunciados pela tentativa de um ataque.

A partir de então, eles passam a responder a um processo penal.

Votaram nesse sentido o relator, Alexandre de Moraes, e outros ministros."

TAREFA 2 - EXTRAIR TERMOS:
Liste os termos técnicos ou políticos com significados simples.

RESPONDA EM JSON:
{
  "conteudo": "texto com parágrafos separados por linha em branco",
  "termos": [{"termo": "STF", "significado": "Supremo Tribunal Federal, corte máxima do país"}]
}`;

  try {
    const resposta = await callGeminiWithFallback(prompt);
    
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Garantir quebras de parágrafo
      let conteudoLimpo = parsed.conteudo || conteudo;
      // Normalizar quebras de linha para garantir parágrafos separados
      conteudoLimpo = conteudoLimpo
        .replace(/\n{3,}/g, '\n\n')  // Múltiplas quebras viram duas
        .replace(/([.!?])\s*\n(?!\n)/g, '$1\n\n')  // Após ponto sem quebra dupla, adicionar
        .trim();
      
      return {
        conteudoFormatado: conteudoLimpo,
        termos: parsed.termos || []
      };
    }
    return { conteudoFormatado: conteudo, termos: [] };
  } catch (e) {
    console.error('Erro ao formatar com Gemini:', e);
    return { conteudoFormatado: conteudo, termos: [] };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      throw new Error('URL não fornecida');
    }

    console.log('Extraindo texto da URL:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Falha ao buscar URL: ${response.status}`);
    }

    const html = await response.text();
    const { titulo, subtitulo, conteudo, autor, dataPublicacao } = extrairConteudoPrincipal(html);

    // Formatar conteúdo com Gemini
    const { conteudoFormatado, termos } = await formatarComGemini(conteudo, titulo);

    // Extrair imagem principal
    let imagemUrl = '';
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImageMatch) {
      imagemUrl = ogImageMatch[1];
    }

    console.log('Texto extraído e formatado com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true,
        titulo,
        subtitulo,
        conteudo: conteudoFormatado,
        termos,
        autor,
        dataPublicacao,
        imagemUrl,
        url 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Erro ao extrair texto:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
