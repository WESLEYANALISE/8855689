import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gemini API keys com fallback
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
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
          }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
      if (response.status === 429 || response.status === 503) continue;
    } catch (error) {
      console.error('Gemini API error:', error);
    }
  }
  throw new Error('Todas as chaves Gemini falharam');
}

// Função para decodificar entidades HTML e normalizar UTF-8
function decodeHTMLEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&aacute;/gi, 'á').replace(/&Aacute;/gi, 'Á')
    .replace(/&eacute;/gi, 'é').replace(/&Eacute;/gi, 'É')
    .replace(/&iacute;/gi, 'í').replace(/&Iacute;/gi, 'Í')
    .replace(/&oacute;/gi, 'ó').replace(/&Oacute;/gi, 'Ó')
    .replace(/&uacute;/gi, 'ú').replace(/&Uacute;/gi, 'Ú')
    .replace(/&agrave;/gi, 'à').replace(/&Agrave;/gi, 'À')
    .replace(/&atilde;/gi, 'ã').replace(/&Atilde;/gi, 'Ã')
    .replace(/&otilde;/gi, 'õ').replace(/&Otilde;/gi, 'Õ')
    .replace(/&ntilde;/gi, 'ñ').replace(/&Ntilde;/gi, 'Ñ')
    .replace(/&ccedil;/gi, 'ç').replace(/&Ccedil;/gi, 'Ç')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&apos;/gi, "'")
    .replace(/&mdash;/gi, '\u2014')
    .replace(/&ndash;/gi, '\u2013')
    .replace(/&lsquo;/gi, '\u2018')
    .replace(/&rsquo;/gi, '\u2019')
    .replace(/&ldquo;/gi, '\u201C')
    .replace(/&rdquo;/gi, '\u201D')
    .replace(/&hellip;/gi, '\u2026')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim();
}

// Fontes de notícias políticas (RSS feeds) - balanceado por espectro político
const FONTES_NOTICIAS = [
  // Centro
  { nome: 'G1', url: 'https://g1.globo.com/rss/g1/politica/', espectro: 'centro' },
  { nome: 'Terra', url: 'https://www.terra.com.br/rss/controller.htm?ch=noticias', espectro: 'centro' },
  { nome: 'Poder360', url: 'https://www.poder360.com.br/feed/', espectro: 'centro' },
  // Centro-esquerda
  { nome: 'Folha', url: 'https://feeds.folha.uol.com.br/poder/rss091.xml', espectro: 'centro-esquerda' },
  { nome: 'Estadão', url: 'https://www.estadao.com.br/arc/outboundfeeds/rss/editoria/politica/', espectro: 'centro-esquerda' },
  // Esquerda
  { nome: 'Brasil de Fato', url: 'https://www.brasildefato.com.br/rss2', espectro: 'esquerda' },
  { nome: 'CartaCapital', url: 'https://www.cartacapital.com.br/feed/', espectro: 'esquerda' },
  // Centro-direita
  { nome: 'R7', url: 'https://noticias.r7.com/brasil/feed.xml', espectro: 'centro-direita' },
  { nome: 'Gazeta do Povo', url: 'https://www.gazetadopovo.com.br/feed/rss/republica.xml', espectro: 'centro-direita' },
];

interface NoticiaItem {
  titulo: string;
  descricao: string | null;
  url: string;
  fonte: string;
  espectro: string;
  imagem_url: string | null;
  data_publicacao: string; // Agora é obrigatório, não null
}

// Função para buscar og:image da página
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DireitoPremium/1.0)' },
      redirect: 'follow'
    });
    if (!response.ok) return null;
    
    const html = await response.text();
    let match = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (!match) match = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (match) return match[1];
    
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+(?:\.jpg|\.jpeg|\.png|\.webp)[^"']*)["']/i);
    if (imgMatch && !imgMatch[1].includes('logo') && !imgMatch[1].includes('icon')) {
      return imgMatch[1];
    }
    return null;
  } catch {
    return null;
  }
}

// Extrair texto completo da página
async function extrairTextoCompleto(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DireitoPremium/1.0)' },
      redirect: 'follow'
    });
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Remover scripts, styles, etc
    let texto = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '');
    
    // Extrair conteúdo do artigo
    const articleMatch = texto.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
    if (articleMatch) texto = articleMatch[1];
    
    // Limpar tags HTML
    texto = texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    texto = decodeHTMLEntities(texto);
    
    return texto.slice(0, 10000);
  } catch {
    return null;
  }
}

// Processar notícia completamente antes de salvar
async function processarNoticiaCompleta(noticia: NoticiaItem): Promise<{
  conteudo_formatado: string;
  resumo_executivo: string;
  resumo_facil: string;
  pontos_principais: string[];
  termos: Array<{termo: string; significado: string}>;
} | null> {
  try {
    console.log(`Processando: ${noticia.titulo.slice(0, 50)}...`);
    
    // 1. Extrair texto completo da página
    const textoOriginal = await extrairTextoCompleto(noticia.url);
    if (!textoOriginal || textoOriginal.length < 200) {
      console.log('Texto muito curto, ignorando');
      return null;
    }
    
    // 2. Prompt único para fazer TUDO de uma vez (mais eficiente)
    const prompt = `Você é um editor político. Analise esta notícia e retorne um JSON com TODAS as informações:

TÍTULO: ${noticia.titulo}
FONTE: ${noticia.fonte}

TEXTO ORIGINAL:
${textoOriginal.slice(0, 6000)}

Retorne EXATAMENTE este JSON:
{
  "conteudo_formatado": "RESUMO da notícia em 3-5 parágrafos curtos, com SUAS PRÓPRIAS PALAVRAS. NÃO copie o texto original. Explique os fatos principais de forma objetiva e didática, como um professor explicaria. Separe parágrafos por linha dupla.",
  "resumo_executivo": "Análise técnica em 3-4 frases SEM marcações Markdown. Explique o contexto político, quem são os envolvidos e as implicações de forma clara e direta.",
  "resumo_facil": "Explicação em 2-3 frases BEM SIMPLES, sem Markdown. O que aconteceu? Por que eu deveria me importar? Como isso afeta minha vida? Linguagem coloquial.",
  "pontos_principais": ["ponto 1", "ponto 2", "ponto 3", "ponto 4"],
  "termos": [
    {"termo": "Termo técnico/político 1", "significado": "Explicação simples"},
    {"termo": "Termo técnico/político 2", "significado": "Explicação simples"}
  ]
}

IMPORTANTE:
- conteudo_formatado: NÃO copie o texto original - faça um RESUMO próprio em português claro e objetivo
- resumo_executivo e resumo_facil: NÃO use asteriscos (**), hífens (-) ou qualquer Markdown
- termos: inclua TODOS os termos políticos, jurídicos ou técnicos da notícia
- Retorne APENAS o JSON válido, sem texto adicional`;

    const resposta = await callGeminiWithFallback(prompt);
    
    // Extrair JSON
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('Falha ao extrair JSON da resposta');
      return null;
    }
    
    const dados = JSON.parse(jsonMatch[0]);
    
    // Garantir quebras de parágrafo corretas
    let conteudoLimpo = dados.conteudo_formatado || '';
    conteudoLimpo = conteudoLimpo
      .replace(/\n{3,}/g, '\n\n')
      .replace(/([.!?])\s*\n(?!\n)/g, '$1\n\n')
      .trim();
    
    return {
      conteudo_formatado: conteudoLimpo,
      resumo_executivo: dados.resumo_executivo || '',
      resumo_facil: dados.resumo_facil || '',
      pontos_principais: dados.pontos_principais || [],
      termos: dados.termos || []
    };
  } catch (error) {
    console.error('Erro ao processar notícia:', error);
    return null;
  }
}

async function buscarRSS(fonte: typeof FONTES_NOTICIAS[0]): Promise<NoticiaItem[]> {
  try {
    const response = await fetch(fonte.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DireitoPremium/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });
    
    if (!response.ok) {
      console.log(`Erro ao buscar ${fonte.nome}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const noticias: NoticiaItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && noticias.length < 5) {
      const itemXml = match[1];
      
      const titulo = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1]?.trim();
      const link = itemXml.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)?.[1]?.trim();
      const descricao = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]?.trim();
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim();
      
      let imagem = itemXml.match(/<media:content[^>]*url="([^"]+)"/)?.[1];
      if (!imagem) imagem = itemXml.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1];
      if (!imagem) imagem = itemXml.match(/<enclosure[^>]*url="([^"]+)"/)?.[1];
      if (!imagem && descricao) {
        const imgMatch = descricao.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) imagem = imgMatch[1];
      }

      if (titulo && link) {
        // Termos que indicam política
        const termosPolíticos = [
          'político', 'politica', 'política', 'congresso', 'senado', 'câmara', 
          'deputado', 'senador', 'presidente', 'ministro', 'stf', 'stj', 'tse',
          'governo', 'eleição', 'eleições', 'votação', 'lei ', 'projeto de lei',
          'pec', 'planalto', 'lula', 'bolsonaro', 'orçamento', 'reforma', 
          'impeachment', 'cpi', 'prefeito', 'governador', 'vereador'
        ];
        
        // Termos que indicam que NÃO é política (esportes, entretenimento, etc)
        const termosNaoPoliticos = [
          'futebol', 'corinthians', 'flamengo', 'palmeiras', 'são paulo', 'santos',
          'campeonato', 'libertadores', 'copa do brasil', 'brasileirão', 'série a',
          'gol', 'técnico', 'jogador', 'artilheiro', 'contratação', 'transferência',
          'fórmula 1', 'nba', 'ufc', 'boxe', 'tênis', 'vôlei', 'basquete',
          'novela', 'bbb', 'big brother', 'reality', 'famoso', 'celebridade',
          'show', 'música', 'filme', 'série'
        ];
        
        const textoCompleto = `${titulo} ${descricao || ''}`.toLowerCase();
        
        // Verificar se contém termo NÃO político
        const ehEsporteOuEntretenimento = termosNaoPoliticos.some(termo => textoCompleto.includes(termo));
        
        // Verificar se contém termo político
        const ehPolitica = termosPolíticos.some(termo => textoCompleto.includes(termo));
        
        // Só incluir se for política E não for esporte/entretenimento
        // Para URLs específicas de política (G1), aceitar se não for claramente esporte
        const ehUrlPolitica = fonte.url.includes('/politica') || fonte.url.includes('republica');
        const incluir = (ehPolitica && !ehEsporteOuEntretenimento) || (ehUrlPolitica && !ehEsporteOuEntretenimento);
        
        if (incluir) {
          // SEMPRE definir data_publicacao - usar agora como fallback
          let dataPublicacao: string = new Date().toISOString();
          if (pubDate) {
            try {
              const date = new Date(pubDate);
              if (!isNaN(date.getTime())) dataPublicacao = date.toISOString();
            } catch {}
          }
          
          if (!imagem && link) {
            const ogImage = await fetchOgImage(link);
            if (ogImage) imagem = ogImage;
          }
          
          if (imagem) {
            const tituloLimpo = decodeHTMLEntities(titulo.replace(/<[^>]+>/g, '')).slice(0, 300);
            const descricaoLimpa = descricao ? decodeHTMLEntities(descricao.replace(/<[^>]+>/g, '')).slice(0, 500) : null;
            
            noticias.push({
              titulo: tituloLimpo,
              descricao: descricaoLimpa,
              url: link,
              fonte: fonte.nome,
              espectro: fonte.espectro,
              imagem_url: imagem,
              data_publicacao: dataPublicacao
            });
          }
        }
      }
    }

    console.log(`${fonte.nome}: ${noticias.length} notícias encontradas`);
    return noticias;
  } catch (error) {
    console.error(`Erro ao buscar ${fonte.nome}:`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se há parâmetro de data específica
    const { data: dataEspecifica } = await req.json().catch(() => ({ data: null }));
    
    console.log('Iniciando busca de notícias políticas...');
    if (dataEspecifica) {
      console.log(`Buscando para data específica: ${dataEspecifica}`);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar de todas as fontes em paralelo
    const resultados = await Promise.all(
      FONTES_NOTICIAS.map(fonte => buscarRSS(fonte))
    );

    let todasNoticias = resultados.flat();
    console.log(`Total de notícias encontradas: ${todasNoticias.length}`);

    // Se foi passada uma data específica, filtrar ou ajustar as datas das notícias
    if (dataEspecifica) {
      // Ajustar notícias sem data para a data solicitada
      todasNoticias = todasNoticias.map(noticia => {
        if (!noticia.data_publicacao) {
          const dataAlvo = new Date(dataEspecifica);
          dataAlvo.setHours(12, 0, 0, 0);
          return { ...noticia, data_publicacao: dataAlvo.toISOString() };
        }
        return noticia;
      });
    }

    if (todasNoticias.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma notícia encontrada', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpar notícias antigas (mais de 14 dias)
    const quatorzeDiasAtras = new Date();
    quatorzeDiasAtras.setDate(quatorzeDiasAtras.getDate() - 14);
    await supabase
      .from('noticias_politicas_cache')
      .delete()
      .lt('data_publicacao', quatorzeDiasAtras.toISOString());

    // Processar e inserir novas notícias
    let inseridas = 0;
    for (const noticia of todasNoticias) {
      // Verificar se já existe
      const { data: existente } = await supabase
        .from('noticias_politicas_cache')
        .select('id')
        .eq('url', noticia.url)
        .single();
      
      if (!existente) {
        // PROCESSAR COMPLETAMENTE antes de salvar
        console.log(`Pré-processando: ${noticia.titulo.slice(0, 40)}...`);
        const processado = await processarNoticiaCompleta(noticia);
        
        if (processado) {
          // Converter imagem para WebP se existir
          let imagemUrlWebp: string | null = null;
          if (noticia.imagem_url) {
            try {
              console.log(`Convertendo imagem para WebP: ${noticia.imagem_url.slice(0, 50)}...`);
              const webpResponse = await fetch(`${supabaseUrl}/functions/v1/converter-imagem-webp`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({ imageUrl: noticia.imagem_url })
              });
              
              if (webpResponse.ok) {
                const webpData = await webpResponse.json();
                if (webpData.success && webpData.url) {
                  imagemUrlWebp = webpData.url;
                  console.log(`✓ Imagem convertida: ${webpData.reducao || 0}% menor`);
                }
              }
            } catch (webpError) {
              console.error('Erro ao converter imagem:', webpError);
            }
          }
          
          const { error } = await supabase
            .from('noticias_politicas_cache')
            .insert({
              titulo: noticia.titulo,
              descricao: noticia.descricao,
              url: noticia.url,
              fonte: noticia.fonte,
              espectro: noticia.espectro,
              imagem_url: noticia.imagem_url,
              imagem_url_webp: imagemUrlWebp,
              data_publicacao: noticia.data_publicacao,
              // Dados pré-processados
              conteudo_formatado: processado.conteudo_formatado,
              resumo_executivo: processado.resumo_executivo,
              resumo_facil: processado.resumo_facil,
              pontos_principais: processado.pontos_principais,
              termos: processado.termos,
              processado: true
            });

          if (error) {
            console.error('Erro ao inserir notícia:', error);
          } else {
            inseridas++;
            console.log(`✓ Notícia processada e inserida: ${noticia.titulo.slice(0, 40)}...`);
          }
        } else {
          console.log(`✗ Falha ao processar: ${noticia.titulo.slice(0, 40)}...`);
        }
      }
    }
    
    console.log(`Notícias processadas e inseridas: ${inseridas}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: inseridas,
        total_encontradas: todasNoticias.length,
        fontes: FONTES_NOTICIAS.map(f => f.nome)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
