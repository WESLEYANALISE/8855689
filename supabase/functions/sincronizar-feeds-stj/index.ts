import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// URLs dos feeds RSS do STJ
const FEEDS_STJ = {
  noticias: 'https://www.stj.jus.br/sites/portalp/SiteAssets/documentos/rss/noticias.xml',
  teses: 'https://www.stj.jus.br/sites/portalp/SiteAssets/documentos/rss/jurisprudencia-em-teses.xml',
  informativos: 'https://www.stj.jus.br/sites/portalp/SiteAssets/documentos/rss/informativo-de-jurisprudencia.xml',
  pesquisa_pronta: 'https://www.stj.jus.br/sites/portalp/SiteAssets/documentos/rss/pesquisa-pronta.xml',
};

interface FeedItem {
  titulo: string;
  link: string;
  descricao: string | null;
  data_publicacao: string | null;
  categoria: string | null;
}

// Função para extrair texto de tags XML
function extractTagContent(xml: string, tagName: string): string | null {
  // Tentar com CDATA primeiro
  const cdataRegex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tagName}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }
  
  // Depois tentar conteúdo normal
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

// Função para parsear data do RSS
function parseRssDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch {
    // Ignorar erro de parse
  }
  
  return null;
}

// Função para limpar HTML
function cleanHtml(html: string | null): string | null {
  if (!html) return null;
  
  return html
    .replace(/<[^>]*>/g, '') // Remove tags HTML
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Função para parsear um feed RSS
async function parseFeed(feedUrl: string, feedTipo: string): Promise<FeedItem[]> {
  try {
    console.log(`[STJ Feed] Buscando feed: ${feedTipo} - ${feedUrl}`);
    
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JurisBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });
    
    if (!response.ok) {
      console.error(`[STJ Feed] Erro ao buscar ${feedTipo}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    console.log(`[STJ Feed] XML recebido para ${feedTipo}: ${xml.length} caracteres`);
    
    const items: FeedItem[] = [];
    
    // Extrair todos os itens do feed
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(xml)) !== null) {
      const itemXml = itemMatch[1];
      
      const titulo = cleanHtml(extractTagContent(itemXml, 'title'));
      const link = extractTagContent(itemXml, 'link');
      const descricao = cleanHtml(extractTagContent(itemXml, 'description'));
      const pubDate = extractTagContent(itemXml, 'pubDate');
      const categoria = cleanHtml(extractTagContent(itemXml, 'category'));
      
      if (titulo && link) {
        items.push({
          titulo,
          link,
          descricao,
          data_publicacao: parseRssDate(pubDate),
          categoria,
        });
      }
    }
    
    console.log(`[STJ Feed] ${feedTipo}: ${items.length} itens encontrados`);
    return items;
    
  } catch (error) {
    console.error(`[STJ Feed] Erro ao processar ${feedTipo}:`, error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('[STJ Feed] Iniciando sincronização de feeds');
    
    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const resultados = {
      noticias: { novos: 0, total: 0 },
      teses: { novos: 0, total: 0 },
      informativos: { novos: 0, total: 0 },
      pesquisa_pronta: { novos: 0, total: 0 },
    };
    
    // Processar cada feed
    for (const [feedTipo, feedUrl] of Object.entries(FEEDS_STJ)) {
      const items = await parseFeed(feedUrl, feedTipo);
      resultados[feedTipo as keyof typeof resultados].total = items.length;
      
      for (const item of items) {
        // Verificar se já existe
        const { data: existente } = await supabase
          .from('stj_feeds')
          .select('id')
          .eq('link', item.link)
          .maybeSingle();
        
        if (!existente) {
          // Inserir novo item
          const { error } = await supabase
            .from('stj_feeds')
            .insert({
              feed_tipo: feedTipo,
              titulo: item.titulo,
              link: item.link,
              descricao: item.descricao,
              data_publicacao: item.data_publicacao,
              categoria: item.categoria,
            });
          
          if (!error) {
            resultados[feedTipo as keyof typeof resultados].novos++;
          } else {
            console.error(`[STJ Feed] Erro ao inserir item:`, error);
          }
        }
      }
    }
    
    console.log('[STJ Feed] Sincronização concluída:', resultados);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Feeds sincronizados com sucesso',
        resultados,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error: unknown) {
    console.error('[STJ Feed] Erro geral:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro ao sincronizar feeds';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
