import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Busca conteúdo da Wikipedia
async function buscarWikipedia(termo: string): Promise<{
  titulo: string;
  conteudo: string;
  imagens: string[];
} | null> {
  console.log(`[Wikipedia] Buscando: ${termo}`);
  
  try {
    // Primeiro, buscar o artigo
    const articleUrl = `https://pt.wikipedia.org/w/api.php?` +
      `action=query&titles=${encodeURIComponent(termo)}` +
      `&prop=extracts|pageimages|images` +
      `&format=json&utf8=1` +
      `&explaintext=1&exintro=0` +
      `&piprop=original&pithumbsize=800` +
      `&imlimit=10&redirects=1`;

    const response = await fetch(articleUrl);
    const data = await response.json();
    
    const pages = data.query?.pages;
    const pageId = Object.keys(pages || {})[0];
    
    if (!pageId || pageId === '-1') {
      console.log('[Wikipedia] Artigo não encontrado, tentando busca...');
      
      // Tentar busca
      const searchUrl = `https://pt.wikipedia.org/w/api.php?` +
        `action=query&list=search&srsearch=${encodeURIComponent(termo)}` +
        `&format=json&utf8=1&srlimit=1`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      const results = searchData.query?.search || [];
      
      if (results.length === 0) {
        return null;
      }
      
      // Buscar com o título encontrado
      return buscarWikipedia(results[0].title);
    }
    
    const page = pages[pageId];
    const imagens: string[] = [];
    
    // Imagem principal
    if (page.original?.source) {
      imagens.push(page.original.source);
    }
    
    // Buscar mais imagens se disponíveis
    if (page.images) {
      for (const img of page.images.slice(0, 5)) {
        if (img.title.match(/\.(jpg|jpeg|png|gif|webp)$/i) && 
            !img.title.includes('Commons-logo') &&
            !img.title.includes('Symbol') &&
            !img.title.includes('Icon')) {
          try {
            const imgUrl = `https://pt.wikipedia.org/w/api.php?` +
              `action=query&titles=${encodeURIComponent(img.title)}` +
              `&prop=imageinfo&iiprop=url&format=json`;
            
            const imgResponse = await fetch(imgUrl);
            const imgData = await imgResponse.json();
            const imgPage = Object.values(imgData.query?.pages || {})[0] as any;
            
            if (imgPage?.imageinfo?.[0]?.url) {
              imagens.push(imgPage.imageinfo[0].url);
            }
          } catch (e) {
            console.log('[Wikipedia] Erro ao buscar imagem:', e);
          }
        }
      }
    }
    
    return {
      titulo: page.title,
      conteudo: page.extract || '',
      imagens
    };
  } catch (error) {
    console.error('[Wikipedia] Erro:', error);
    return null;
  }
}

// Reformular conteúdo com Gemini usando chaves com fallback
async function reformularComGemini(
  titulo: string,
  conteudoOriginal: string,
  apiKeys: string[]
): Promise<string | null> {
  const prompt = `Você é um redator especializado em conteúdo jurídico educacional. Reescreva o seguinte conteúdo da Wikipedia sobre "${titulo}" de forma mais didática, clara e objetiva, voltado para estudantes de Direito e interessados na área jurídica.

CONTEÚDO ORIGINAL:
${conteudoOriginal.substring(0, 8000)}

INSTRUÇÕES:
1. Mantenha a precisão das informações
2. Use linguagem acessível mas profissional
3. Organize com subtítulos usando markdown (##, ###)
4. Destaque conceitos importantes em **negrito**
5. Adicione contexto jurídico brasileiro quando relevante
6. Inclua dicas práticas ou aplicações quando possível
7. Limite a cerca de 1500-2000 palavras
8. Se o tema for sobre uma pessoa, inclua uma breve biografia e suas principais contribuições
9. Se for sobre um conceito jurídico, explique de forma clara e com exemplos

Reescreva o conteúdo agora:`;

  for (let i = 0; i < apiKeys.length; i++) {
    try {
      console.log(`[Gemini] Tentando chave ${i + 1}/${apiKeys.length}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const conteudo = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (conteudo) {
          console.log(`[Gemini] ✓ Conteúdo gerado com chave ${i + 1}`);
          return conteudo;
        }
      } else if (response.status === 429 || response.status === 503) {
        console.log(`[Gemini] Chave ${i + 1} com rate limit, tentando próxima...`);
        continue;
      } else {
        console.error(`[Gemini] Erro com chave ${i + 1}: ${response.status}`);
      }
    } catch (error) {
      console.error(`[Gemini] Erro com chave ${i + 1}:`, error);
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { categoria, ordem, titulo, termo_wikipedia, topicos } = await req.json();

    if (!categoria || !ordem || !titulo) {
      return new Response(
        JSON.stringify({ error: 'Categoria, ordem e título são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Coletar chaves Gemini disponíveis
    const apiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];

    if (apiKeys.length === 0) {
      throw new Error('Nenhuma chave API Gemini configurada');
    }

    console.log(`[gerar-conteudo-blogger-wikipedia] ${apiKeys.length} chaves disponíveis`);
    console.log(`[gerar-conteudo-blogger-wikipedia] Processando: ${titulo} (termo: ${termo_wikipedia || titulo})`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar conteúdo da Wikipedia
    const termoParaBuscar = termo_wikipedia || titulo;
    const wikiData = await buscarWikipedia(termoParaBuscar);

    let conteudoFinal = '';
    let imagemWikipedia = '';

    if (wikiData && wikiData.conteudo) {
      console.log(`[gerar-conteudo-blogger-wikipedia] Wikipedia encontrado: ${wikiData.titulo}`);
      console.log(`[gerar-conteudo-blogger-wikipedia] ${wikiData.imagens.length} imagens encontradas`);

      // 2. Reformular com Gemini
      const conteudoReformulado = await reformularComGemini(
        titulo,
        wikiData.conteudo,
        apiKeys
      );

      if (conteudoReformulado) {
        conteudoFinal = conteudoReformulado;
      } else {
        // Fallback: usar conteúdo original formatado
        conteudoFinal = `# ${titulo}\n\n${wikiData.conteudo}`;
      }

      // 3. Usar imagem da Wikipedia se disponível
      if (wikiData.imagens.length > 0) {
        imagemWikipedia = wikiData.imagens[0];
        console.log(`[gerar-conteudo-blogger-wikipedia] Usando imagem da Wikipedia: ${imagemWikipedia}`);
      }
    } else {
      console.log(`[gerar-conteudo-blogger-wikipedia] Wikipedia não encontrado, gerando com IA pura`);
      
      // Gerar conteúdo diretamente com Gemini
      const promptDireto = `Escreva um artigo educacional completo sobre "${titulo}" voltado para estudantes de Direito.

${topicos ? `TÓPICOS A ABORDAR:\n${topicos.map((t: string) => `- ${t}`).join('\n')}\n` : ''}

INSTRUÇÕES:
1. Escreva um artigo completo com pelo menos 1500 palavras
2. Use linguagem clara e acessível
3. Organize com subtítulos usando markdown (##, ###)
4. Inclua informações práticas e atualizadas
5. Adicione exemplos quando relevante
6. Destaque pontos importantes em **negrito**
7. Contextualize para o sistema jurídico brasileiro

Escreva o artigo completo:`;

      for (let i = 0; i < apiKeys.length; i++) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys[i]}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptDireto }] }],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 8192,
                }
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            conteudoFinal = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (conteudoFinal) break;
          }
        } catch (e) {
          console.error(`Erro com chave ${i + 1}:`, e);
        }
      }
    }

    if (!conteudoFinal) {
      throw new Error('Não foi possível gerar o conteúdo');
    }

    // 4. Salvar no banco
    const updateData: any = {
      conteudo_gerado: conteudoFinal,
      gerado_em: new Date().toISOString(),
      cache_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    if (imagemWikipedia) {
      updateData.imagem_wikipedia = imagemWikipedia;
      updateData.url_capa = imagemWikipedia; // Usar imagem da Wikipedia como capa
    }

    const { error: updateError } = await supabase
      .from('BLOGGER_JURIDICO')
      .update(updateData)
      .eq('categoria', categoria)
      .eq('ordem', ordem);

    if (updateError) {
      console.error('[gerar-conteudo-blogger-wikipedia] Erro ao salvar:', updateError);
    }

    console.log(`[gerar-conteudo-blogger-wikipedia] ✓ Conteúdo gerado para: ${titulo}`);

    return new Response(
      JSON.stringify({ 
        conteudo: conteudoFinal,
        imagem_wikipedia: imagemWikipedia || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gerar-conteudo-blogger-wikipedia] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
