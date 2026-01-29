import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConcursoExtraido {
  titulo: string;
  descricao: string;
  conteudo: string;
  imagem: string;
  link: string;
  data_publicacao: string | null;
  regiao: string;
  estado: string | null;
  status: string | null;
}

// Mapear regiões para URLs
const regiaoUrlMap: Record<string, string> = {
  'nacional': 'https://www.pciconcursos.com.br/noticias/',
  'sudeste': 'https://www.pciconcursos.com.br/noticias/sudeste/',
  'sul': 'https://www.pciconcursos.com.br/noticias/sul/',
  'norte': 'https://www.pciconcursos.com.br/noticias/norte/',
  'nordeste': 'https://www.pciconcursos.com.br/noticias/nordeste/',
  'centrooeste': 'https://www.pciconcursos.com.br/noticias/centrooeste/',
};

// Estados por região
const estadosPorRegiao: Record<string, string[]> = {
  'sudeste': ['SP', 'RJ', 'MG', 'ES'],
  'sul': ['PR', 'SC', 'RS'],
  'norte': ['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'],
  'nordeste': ['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI'],
  'centrooeste': ['GO', 'MT', 'MS', 'DF'],
};

function extrairEstadoDoTitulo(titulo: string, regiao: string): string | null {
  const estados = estadosPorRegiao[regiao] || [];
  for (const estado of estados) {
    // Procurar padrões como "- SP", "– MG", "(RJ)", "SP " no início
    if (titulo.includes(` ${estado}`) || titulo.includes(`-${estado}`) || titulo.includes(`(${estado})`) || titulo.startsWith(`${estado} `)) {
      return estado;
    }
  }
  return null;
}

function extrairStatusDoTitulo(titulo: string): string | null {
  const tituloLower = titulo.toLowerCase();
  if (tituloLower.includes('prorrog')) return 'prorrogado';
  if (tituloLower.includes('suspend')) return 'suspenso';
  if (tituloLower.includes('reaber') || tituloLower.includes('reabre')) return 'reaberto';
  if (tituloLower.includes('cancel')) return 'cancelado';
  return 'aberto';
}

function parseDataPublicacao(dataTexto: string): string | null {
  try {
    // Formato esperado: "Quinta-feira, 4 de dezembro de 2025"
    const meses: Record<string, string> = {
      'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
      'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
      'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
    };
    
    const match = dataTexto.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
    if (match) {
      const dia = match[1].padStart(2, '0');
      const mesNome = match[2].toLowerCase();
      const ano = match[3];
      const mes = meses[mesNome];
      if (mes) {
        return `${ano}-${mes}-${dia}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function limparTexto(texto: string): string {
  return texto
    .replace(/\[.*?\]/g, '') // Remove markdown links
    .replace(/\(https?:\/\/[^\)]+\)/g, '') // Remove URLs em parênteses
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove imagens markdown
    .replace(/#{1,6}\s/g, '') // Remove headers markdown
    .replace(/\*\*/g, '') // Remove bold
    .replace(/\*/g, '') // Remove italic
    .replace(/\n{3,}/g, '\n\n') // Reduz múltiplas quebras de linha
    .trim();
}

async function rasparListaConcursos(url: string, apiKey: string): Promise<{ links: string[], imagens: Map<string, string> }> {
  console.log('Raspando lista de:', url);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      waitFor: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Erro ao raspar lista:', error);
    throw new Error(`Erro ao raspar lista: ${response.status}`);
  }

  const data = await response.json();
  const markdown = data.data?.markdown || data.markdown || '';
  const html = data.data?.html || data.html || '';
  
  // Extrair links de notícias
  const linksSet = new Set<string>();
  const linkRegex = /\[([^\]]+)\]\((https:\/\/www\.pciconcursos\.com\.br\/noticias\/[^)]+)\)/g;
  let match;
  
  while ((match = linkRegex.exec(markdown)) !== null) {
    const link = match[2];
    // Filtrar apenas links de notícias individuais (não categorias)
    if (!link.endsWith('/noticias/') && 
        !link.includes('/noticias/sudeste/') && 
        !link.includes('/noticias/sul/') &&
        !link.includes('/noticias/norte/') &&
        !link.includes('/noticias/nordeste/') &&
        !link.includes('/noticias/centrooeste/')) {
      linksSet.add(link);
    }
  }

  // Extrair imagens associadas a cada notícia do HTML
  const imagens = new Map<string, string>();
  const imgRegex = /<a[^>]+href="(https:\/\/www\.pciconcursos\.com\.br\/noticias\/[^"]+)"[^>]*>.*?<img[^>]+src="([^"]+)"[^>]*>/gs;
  while ((match = imgRegex.exec(html)) !== null) {
    imagens.set(match[1], match[2]);
  }

  console.log(`Encontrados ${linksSet.size} links de notícias`);
  return { links: Array.from(linksSet).slice(0, 20), imagens }; // Limitar a 20
}

async function rasparNoticiaIndividual(link: string, apiKey: string, regiao: string, imagemPrevia: string | null): Promise<ConcursoExtraido | null> {
  console.log('Raspando notícia:', link);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: link,
        formats: ['markdown', 'html'],
        onlyMainContent: false, // Pegar todo o conteúdo
        waitFor: 3000,
        timeout: 30000,
      }),
    });

    if (!response.ok) {
      console.error(`Erro ao raspar ${link}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || '';
    const html = data.data?.html || data.html || '';
    const metadata = data.data?.metadata || data.metadata || {};

    console.log(`Conteúdo recebido: markdown=${markdown.length}, html=${html.length}`);

    // Extrair título do metadata ou do link
    let titulo = metadata.title || metadata.ogTitle || '';
    
    // Tentar extrair do markdown
    const tituloMatch = markdown.match(/^#\s+(.+)$/m);
    if (tituloMatch) {
      titulo = tituloMatch[1].trim();
    }
    
    // Fallback: extrair do link
    if (!titulo) {
      const linkParts = link.split('/').pop()?.replace(/-/g, ' ') || '';
      titulo = linkParts.charAt(0).toUpperCase() + linkParts.slice(1);
    }
    
    // Limpar título
    titulo = titulo
      .replace(/\s*-\s*PCI Concursos.*$/i, '')
      .replace(/\s*\|\s*PCI.*$/i, '')
      .replace(/\s*–\s*PCI.*$/i, '')
      .trim();

    if (!titulo || titulo.length < 10) {
      console.log('Título não encontrado ou muito curto, ignorando:', link);
      return null;
    }

    // Extrair data de publicação
    let dataPublicacao: string | null = null;
    const dataMatch = markdown.match(/(?:Publicado em|Atualizado em|Em)\s*:?\s*(.+?(?:de\s+\d{4}|\d{4}))/i) ||
                      markdown.match(/(\w+(?:-feira)?,?\s*\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/i) ||
                      html.match(/datetime="(\d{4}-\d{2}-\d{2})/);
    if (dataMatch) {
      if (dataMatch[1].match(/^\d{4}-\d{2}-\d{2}$/)) {
        dataPublicacao = dataMatch[1];
      } else {
        dataPublicacao = parseDataPublicacao(dataMatch[1]);
      }
    }

    // Extrair imagem
    let imagem = imagemPrevia || '';
    const imgMatch = markdown.match(/!\[.*?\]\((https?:\/\/[^\)]+(?:\.jpg|\.png|\.jpeg|\.webp)[^\)]*)\)/i);
    if (imgMatch) {
      imagem = imgMatch[1];
    }
    if (!imagem && metadata.ogImage) {
      imagem = metadata.ogImage;
    }
    // Tentar extrair do HTML
    if (!imagem) {
      const htmlImgMatch = html.match(/<img[^>]+src="(https?:\/\/[^"]+(?:\.jpg|\.png|\.jpeg|\.webp)[^"]*)"/i);
      if (htmlImgMatch) {
        imagem = htmlImgMatch[1];
      }
    }

    // Extrair descrição do metadata ou do conteúdo
    let descricao = metadata.description || metadata.ogDescription || '';
    if (!descricao) {
      const conteudoLimpo = limparTexto(markdown);
      descricao = conteudoLimpo.substring(0, 250).replace(/\n/g, ' ').trim();
      if (descricao.length > 50) {
        descricao += '...';
      }
    }

    // Limpar e formatar conteúdo
    const conteudoLimpo = limparTexto(markdown);

    // Extrair estado e status
    const estado = extrairEstadoDoTitulo(titulo, regiao);
    const status = extrairStatusDoTitulo(titulo);

    console.log(`Sucesso: ${titulo.substring(0, 50)}...`);

    return {
      titulo,
      descricao: descricao || titulo,
      conteudo: conteudoLimpo || descricao || titulo,
      imagem,
      link,
      data_publicacao: dataPublicacao,
      regiao,
      estado,
      status,
    };
  } catch (error) {
    console.error(`Erro ao processar ${link}:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { regiao = 'nacional' } = await req.json();

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY não configurada');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = regiaoUrlMap[regiao] || regiaoUrlMap['nacional'];
    console.log(`Iniciando raspagem para região: ${regiao}, URL: ${url}`);

    // Raspar lista de links
    const { links, imagens } = await rasparListaConcursos(url, apiKey);
    console.log(`Links encontrados: ${links.length}`);

    if (links.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum concurso novo encontrado',
          total: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Raspar cada notícia individualmente
    const concursos: ConcursoExtraido[] = [];
    for (const link of links) {
      const imagemPrevia = imagens.get(link) || null;
      const concurso = await rasparNoticiaIndividual(link, apiKey, regiao, imagemPrevia);
      if (concurso) {
        concursos.push(concurso);
      }
      // Pequeno delay entre requisições
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Concursos extraídos: ${concursos.length}`);

    // Salvar no banco
    let salvos = 0;
    for (const concurso of concursos) {
      try {
        const { error } = await supabase
          .from('CONCURSOS_ABERTOS')
          .upsert(
            {
              titulo: concurso.titulo,
              descricao: concurso.descricao,
              conteudo: concurso.conteudo,
              imagem: concurso.imagem,
              link: concurso.link,
              data_publicacao: concurso.data_publicacao,
              regiao: concurso.regiao,
              estado: concurso.estado,
              status: concurso.status,
              updated_at: new Date().toISOString(),
            },
            { 
              onConflict: 'link',
              ignoreDuplicates: false 
            }
          );

        if (error) {
          console.error('Erro ao salvar concurso:', error);
        } else {
          salvos++;
        }
      } catch (err) {
        console.error('Erro ao processar salvamento:', err);
      }
    }

    console.log(`Concursos salvos: ${salvos}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${salvos} concursos salvos/atualizados`,
        total: salvos,
        regiao 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
