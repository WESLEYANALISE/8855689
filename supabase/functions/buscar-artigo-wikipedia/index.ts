import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WikipediaSearchResult {
  title: string;
  snippet: string;
  pageid: number;
}

interface WikipediaArticle {
  titulo: string;
  conteudo: string;
  html: string;
  imagens: string[];
  links_relacionados: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, query, titulo, categoria } = await req.json();

    console.log('Wikipedia API Request:', { action, query, titulo, categoria });

    // Buscar artigos
    if (action === 'search') {
      const searchUrl = `https://pt.wikipedia.org/w/api.php?` +
        `action=query&list=search&srsearch=${encodeURIComponent(query)}` +
        `&format=json&utf8=1&srlimit=10`;

      const response = await fetch(searchUrl);
      const data = await response.json();

      const results: WikipediaSearchResult[] = data.query?.search || [];

      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter artigo completo
    if (action === 'article') {
      if (!titulo) {
        throw new Error('Título é obrigatório para buscar artigo');
      }

      // Verificar cache nas tabelas específicas primeiro
      let cachedData = null;
      
      if (categoria === 'jurista') {
        const { data } = await supabase
          .from('meu_brasil_juristas')
          .select('*')
          .eq('nome', titulo)
          .single();
        
        if (data && data.conteudo_melhorado) {
          cachedData = {
            titulo: data.nome,
            conteudo: data.conteudo_melhorado.resumo_executivo || '',
            html: '',
            imagens: data.imagens || [],
            links_relacionados: data.links_relacionados || [],
            foto_url: data.foto_url,
            conteudo_completo: data.conteudo_melhorado
          };
        }
      } else if (categoria === 'instituicao') {
        const { data } = await supabase
          .from('meu_brasil_instituicoes')
          .select('*')
          .eq('nome', titulo)
          .single();
        
        if (data && data.conteudo_melhorado) {
          cachedData = {
            titulo: data.nome,
            conteudo: data.conteudo_melhorado.resumo_executivo || '',
            html: '',
            imagens: data.imagens || [],
            links_relacionados: [],
            logo_url: data.logo_url,
            conteudo_completo: data.conteudo_melhorado
          };
        }
      } else if (categoria === 'caso') {
        const { data } = await supabase
          .from('meu_brasil_casos')
          .select('*')
          .eq('nome', titulo)
          .single();
        
        if (data && data.conteudo_melhorado) {
          cachedData = {
            titulo: data.nome,
            conteudo: data.conteudo_melhorado.resumo_executivo || '',
            html: '',
            imagens: data.imagens || [],
            links_relacionados: [],
            conteudo_completo: data.conteudo_melhorado
          };
        }
      } else if (categoria === 'sistema') {
        const { data } = await supabase
          .from('meu_brasil_sistemas')
          .select('*')
          .eq('pais', titulo)
          .single();
        
        if (data && data.conteudo_melhorado) {
          cachedData = {
            titulo: data.pais,
            conteudo: data.conteudo_melhorado.resumo_executivo || '',
            html: '',
            imagens: data.imagens || [],
            links_relacionados: [],
            bandeira_url: data.bandeira_url,
            conteudo_completo: data.conteudo_melhorado
          };
        }
      } else if (categoria === 'historia') {
        const { data } = await supabase
          .from('meu_brasil_historia')
          .select('*')
          .eq('periodo', titulo)
          .single();
        
        if (data && data.conteudo_melhorado) {
          cachedData = {
            titulo: data.periodo,
            conteudo: data.conteudo_melhorado.resumo_executivo || '',
            html: '',
            imagens: data.imagens || [],
            links_relacionados: [],
            conteudo_completo: data.conteudo_melhorado
          };
        }
      }

      // Se encontrou no cache específico, retornar
      if (cachedData) {
        console.log('Retornando do cache específico:', titulo);
        
        // Registrar histórico
        const authHeader = req.headers.get('Authorization');
        if (authHeader && categoria) {
          try {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            
            if (user) {
              await supabase.from('wikipedia_historico').insert({
                user_id: user.id,
                titulo,
                categoria
              });
            }
          } catch (e) {
            console.log('Erro ao registrar histórico (usuário não autenticado)');
          }
        }

        return new Response(
          JSON.stringify(cachedData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar cache genérico (válido por 7 dias)
      const { data: cached } = await supabase
        .from('wikipedia_cache')
        .select('*')
        .eq('titulo', titulo)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (cached) {
        console.log('Retornando artigo do cache genérico:', titulo);
        
        // Registrar histórico
        const authHeader = req.headers.get('Authorization');
        if (authHeader && categoria) {
          try {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            
            if (user) {
              await supabase.from('wikipedia_historico').insert({
                user_id: user.id,
                titulo,
                categoria
              });
            }
          } catch (e) {
            console.log('Erro ao registrar histórico');
          }
        }

        return new Response(
          JSON.stringify(cached.conteudo),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar da Wikipedia
      console.log('Buscando artigo da Wikipedia:', titulo);

      let finalTitulo = titulo;

      // Obter conteúdo COMPLETO do artigo com MAIS imagens
      let articleUrl = `https://pt.wikipedia.org/w/api.php?` +
        `action=query&titles=${encodeURIComponent(titulo)}` +
        `&prop=extracts|pageimages|images|categories` +
        `&format=json&utf8=1` +
        `&explaintext=0&exintro=0` +
        `&piprop=original&pithumbsize=500` +
        `&imlimit=50&cllimit=50` +
        `&redirects=1`;

      let articleResponse = await fetch(articleUrl);
      let articleData = await articleResponse.json();

      let pages = articleData.query?.pages;
      let pageId = Object.keys(pages || {})[0];

      // Se não encontrou, tentar buscar pelo título como query
      if (!pageId || pageId === '-1') {
        console.log('Artigo não encontrado diretamente, tentando buscar...');
        
        const searchUrl = `https://pt.wikipedia.org/w/api.php?` +
          `action=query&list=search&srsearch=${encodeURIComponent(titulo)}` +
          `&format=json&utf8=1&srlimit=5`;

        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        const results = searchData.query?.search || [];

        if (results.length === 0) {
          console.log('Nenhum resultado encontrado na busca');
          return new Response(
            JSON.stringify({ error: 'Artigo não encontrado' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Usar o primeiro resultado da busca
        finalTitulo = results[0].title;
        console.log('Usando título encontrado na busca:', finalTitulo);

        // Tentar novamente com o título correto
        articleUrl = `https://pt.wikipedia.org/w/api.php?` +
          `action=query&titles=${encodeURIComponent(finalTitulo)}` +
          `&prop=extracts|pageimages|images|categories` +
          `&format=json&utf8=1` +
          `&explaintext=0&exintro=0` +
          `&piprop=original&pithumbsize=500` +
          `&imlimit=50&cllimit=50` +
          `&redirects=1`;

        articleResponse = await fetch(articleUrl);
        articleData = await articleResponse.json();

        pages = articleData.query?.pages;
        pageId = Object.keys(pages || {})[0];

        if (!pageId || pageId === '-1') {
          return new Response(
            JSON.stringify({ error: 'Artigo não encontrado' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const page = pages[pageId];

      // Obter HTML do artigo
      const htmlUrl = `https://pt.wikipedia.org/w/api.php?` +
        `action=parse&page=${encodeURIComponent(finalTitulo)}` +
        `&format=json&utf8=1&prop=text`;

      const htmlResponse = await fetch(htmlUrl);
      const htmlData = await htmlResponse.json();

      // Extrair imagens (foto principal e outras)
      const imagens: string[] = [];
      if (page.original?.source) {
        imagens.push(page.original.source);
      }
      
      // Buscar mais imagens do artigo
      const imagesUrl = `https://pt.wikipedia.org/w/api.php?` +
        `action=query&titles=${encodeURIComponent(finalTitulo)}` +
        `&prop=images&format=json&utf8=1&imlimit=10`;
      
      const imagesResponse = await fetch(imagesUrl);
      const imagesData = await imagesResponse.json();
      const pageImages = Object.values(imagesData.query?.pages || {})[0] as any;
      
      if (pageImages?.images) {
        for (const img of pageImages.images) {
          // Buscar URL da imagem
          const imgUrl = `https://pt.wikipedia.org/w/api.php?` +
            `action=query&titles=${encodeURIComponent(img.title)}` +
            `&prop=imageinfo&iiprop=url&format=json`;
          
          try {
            const imgResponse = await fetch(imgUrl);
            const imgData = await imgResponse.json();
            const imgPage = Object.values(imgData.query?.pages || {})[0] as any;
            
            if (imgPage?.imageinfo?.[0]?.url) {
              imagens.push(imgPage.imageinfo[0].url);
            }
          } catch (e) {
            console.log('Erro ao buscar imagem:', e);
          }
        }
      }

      // Extrair links relacionados
      const links_relacionados: string[] = (page.links || [])
        .slice(0, 10)
        .map((link: any) => link.title);

      const article: WikipediaArticle = {
        titulo: page.title,
        conteudo: page.extract || '',
        html: htmlData.parse?.text?.['*'] || '',
        imagens,
        links_relacionados
      };

      // 🆕 ENRIQUECER AUTOMATICAMENTE COM GEMINI para casos, sistemas e instituições
      if (categoria === 'caso' || categoria === 'sistema' || categoria === 'instituicao') {
        console.log(`Enriquecendo automaticamente com Gemini: ${categoria} - ${finalTitulo}`);
        
        try {
          const enrichResponse = await fetch(`${supabaseUrl}/functions/v1/enriquecer-conteudo-meu-brasil`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tipo: categoria,
              nome: finalTitulo,
              conteudo_original: article
            })
          });

          if (enrichResponse.ok) {
            const enrichData = await enrichResponse.json();
            
            if (enrichData.success && enrichData.conteudo_melhorado) {
              // Salvar na tabela específica
              const tableName = categoria === 'caso' 
                ? 'meu_brasil_casos' 
                : categoria === 'sistema' 
                ? 'meu_brasil_sistemas'
                : 'meu_brasil_instituicoes';
              
              const dataToSave: any = {
                nome: finalTitulo,
                conteudo_melhorado: enrichData.conteudo_melhorado,
                imagens,
                links_relacionados,
                updated_at: new Date().toISOString()
              };

              if (categoria === 'sistema') {
                dataToSave.pais = finalTitulo.replace('Direito de ', '').replace('Direito do ', '');
                if (imagens[0]) {
                  dataToSave.bandeira_url = imagens[0];
                }
              } else if (categoria === 'instituicao') {
                // Extrair sigla (ex: "STJ" de "Superior Tribunal de Justiça")
                const siglas: Record<string, string> = {
                  'Supremo Tribunal Federal': 'STF',
                  'Superior Tribunal de Justiça': 'STJ',
                  'Tribunal Superior do Trabalho': 'TST',
                  'Tribunal Superior Eleitoral': 'TSE',
                  'Superior Tribunal Militar': 'STM',
                  'Conselho Nacional de Justiça': 'CNJ',
                  'Ordem dos Advogados do Brasil': 'OAB',
                  'Ministério Público Federal': 'MPF',
                  'Defensoria Pública da União': 'DPU'
                };
                dataToSave.sigla = siglas[finalTitulo] || '';
                
                // Identificar tipo
                if (finalTitulo.includes('Tribunal')) {
                  dataToSave.tipo = 'Tribunal';
                } else if (finalTitulo.includes('Conselho')) {
                  dataToSave.tipo = 'Órgão de Controle';
                } else if (finalTitulo.includes('Ministério Público')) {
                  dataToSave.tipo = 'Ministério Público';
                } else if (finalTitulo.includes('Defensoria')) {
                  dataToSave.tipo = 'Defensoria';
                } else {
                  dataToSave.tipo = 'Instituição';
                }
                
                if (imagens[0]) {
                  dataToSave.logo_url = imagens[0];
                }
              }

              await supabase.from(tableName as any).upsert(dataToSave);

              console.log('Conteúdo enriquecido e salvo com sucesso');

              // Registrar histórico antes de retornar
              const authHeader = req.headers.get('Authorization');
              if (authHeader && categoria) {
                try {
                  const token = authHeader.replace('Bearer ', '');
                  const { data: { user } } = await supabase.auth.getUser(token);
                  
                  if (user) {
                    await supabase.from('wikipedia_historico').insert({
                      user_id: user.id,
                      titulo: finalTitulo,
                      categoria
                    });
                  }
                } catch (e) {
                  console.log('Erro ao registrar histórico');
                }
              }

              // Retornar conteúdo enriquecido
              return new Response(
                JSON.stringify({
                  titulo: finalTitulo,
                  conteudo: enrichData.conteudo_melhorado.resumo_executivo || article.conteudo,
                  html: article.html,
                  imagens,
                  links_relacionados,
                  conteudo_completo: enrichData.conteudo_melhorado
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } else {
            console.error('Erro ao enriquecer:', await enrichResponse.text());
          }
        } catch (enrichError) {
          console.error('Erro ao enriquecer conteúdo:', enrichError);
          // Continuar com o artigo não enriquecido
        }
      }

      // Salvar no cache
      await supabase.from('wikipedia_cache').upsert({
        titulo,
        conteudo: article,
        imagens,
        links_relacionados,
        updated_at: new Date().toISOString()
      });

      // Registrar histórico
      const authHeader = req.headers.get('Authorization');
      if (authHeader && categoria) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          await supabase.from('wikipedia_historico').insert({
            user_id: user.id,
            titulo,
            categoria
          });
        }
      }

      return new Response(
        JSON.stringify(article),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar imagens adicionais
    if (action === 'images') {
      if (!titulo) {
        throw new Error('Título é obrigatório para buscar imagens');
      }

      const imagesUrl = `https://pt.wikipedia.org/w/api.php?` +
        `action=query&titles=${encodeURIComponent(titulo)}` +
        `&prop=images&format=json&utf8=1&imlimit=20`;

      const response = await fetch(imagesUrl);
      const data = await response.json();

      const pages = data.query?.pages;
      const pageId = Object.keys(pages || {})[0];
      const images = pages?.[pageId]?.images || [];

      return new Response(
        JSON.stringify({ images }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na edge function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
