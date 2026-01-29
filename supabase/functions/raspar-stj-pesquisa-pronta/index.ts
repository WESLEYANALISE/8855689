import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PesquisaExtraida {
  ramo_direito: string;
  titulo_secao: string;
  tema: string;
  link_pesquisa: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Iniciando raspagem da Pesquisa Pronta STJ...');

    // Raspar a página principal
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://scon.stj.jus.br/SCON/pesquisa_pronta/listaPP.jsp',
        formats: ['markdown', 'links'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Erro Firecrawl:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || 'Erro ao raspar página' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = data.data?.markdown || '';
    const links = data.data?.links || [];
    
    console.log('Markdown obtido, tamanho:', markdown.length);
    console.log('Links encontrados:', links.length);

    // Processar o markdown para extrair as pesquisas
    const pesquisas: PesquisaExtraida[] = [];
    const linhas = markdown.split('\n');
    
    let ramoAtual = '';
    let tituloAtual = '';

    // Padrões para identificar estrutura
    // Ramos: geralmente são títulos principais como "Direito Administrativo", "Direito Civil"
    // Títulos de seção: subtítulos como "Concurso Público", "Contratos Administrativos"
    // Temas: itens com links para pesquisa

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      
      // Ignorar linhas vazias
      if (!linha) continue;

      // Detectar ramos do direito (geralmente títulos principais)
      const matchRamo = linha.match(/^#+\s*(.+?)\s*(?:\[|$)/);
      if (matchRamo) {
        const possibleRamo = matchRamo[1].trim();
        if (possibleRamo.toLowerCase().includes('direito') || 
            possibleRamo.toLowerCase().includes('penal') ||
            possibleRamo.toLowerCase().includes('processual') ||
            possibleRamo.toLowerCase().includes('tributário') ||
            possibleRamo.toLowerCase().includes('trabalhista') ||
            possibleRamo.toLowerCase().includes('ambiental') ||
            possibleRamo.toLowerCase().includes('constitucional')) {
          ramoAtual = possibleRamo;
          tituloAtual = '';
          continue;
        }
      }

      // Detectar link para pesquisar pela matéria (indica ramo)
      if (linha.includes('pesquisar pela matéria') || linha.includes('Clique para pesquisar pela matéria')) {
        const matchLink = linha.match(/\[([^\]]+)\]/);
        if (matchLink) {
          ramoAtual = matchLink[1].trim();
          tituloAtual = '';
        }
        continue;
      }

      // Detectar título de seção
      if (linha.includes('pesquisar pelo título') || linha.includes('Clique para pesquisar pelo título')) {
        const matchLink = linha.match(/\[([^\]]+)\]/);
        if (matchLink) {
          tituloAtual = matchLink[1].trim();
        }
        continue;
      }

      // Detectar subtítulos (## ou ###)
      const matchSubtitulo = linha.match(/^#{2,3}\s+(.+)/);
      if (matchSubtitulo && !linha.includes('[')) {
        const subtitulo = matchSubtitulo[1].trim();
        // Se parecer um título de seção, usar
        if (!subtitulo.toLowerCase().includes('direito')) {
          tituloAtual = subtitulo;
        }
        continue;
      }

      // Detectar temas (linhas com links ou bullet points)
      const matchTema = linha.match(/^[-*•]\s*\[?([^\]\[]+)\]?\s*(?:\(([^)]+)\))?/);
      if (matchTema && ramoAtual) {
        const tema = matchTema[1].trim();
        let linkPesquisa = matchTema[2] || null;
        
        // Buscar link correspondente
        if (!linkPesquisa && links.length > 0) {
          const linkEncontrado = links.find((l: string) => 
            l.includes('pesquisarJurisprudencia') || l.includes('SCON')
          );
          if (linkEncontrado) {
            linkPesquisa = linkEncontrado;
          }
        }

        if (tema && tema.length > 5) {
          pesquisas.push({
            ramo_direito: ramoAtual,
            titulo_secao: tituloAtual || ramoAtual,
            tema: tema,
            link_pesquisa: linkPesquisa,
          });
        }
        continue;
      }

      // Detectar temas inline (texto com link)
      const matchTemaLink = linha.match(/\[([^\]]+)\]\(([^)]+)\)/g);
      if (matchTemaLink && ramoAtual) {
        for (const match of matchTemaLink) {
          const parts = match.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (parts) {
            const tema = parts[1].trim();
            const link = parts[2];
            
            // Ignorar links de navegação
            if (tema.toLowerCase().includes('clique') || 
                tema.toLowerCase().includes('pesquisar') ||
                tema.toLowerCase().includes('saiba mais')) {
              continue;
            }

            if (tema.length > 5) {
              pesquisas.push({
                ramo_direito: ramoAtual,
                titulo_secao: tituloAtual || ramoAtual,
                tema: tema,
                link_pesquisa: link.startsWith('http') ? link : `https://scon.stj.jus.br${link}`,
              });
            }
          }
        }
      }
    }

    // Também processar padrões alternativos baseados na estrutura HTML comum
    const patternRamo = /(?:^|\n)([A-ZÀ-Ú][A-Za-zÀ-ú\s]+(?:Direito|Penal|Civil|Processual|Tributário|Trabalhista|Empresarial|Ambiental|Constitucional)[A-Za-zÀ-ú\s]*)/gi;
    const ramosEncontrados = markdown.match(patternRamo) || [];
    
    console.log('Ramos encontrados:', ramosEncontrados.slice(0, 5));
    console.log('Pesquisas extraídas inicialmente:', pesquisas.length);

    // Se não encontrou pesquisas com o método principal, tentar outro approach
    if (pesquisas.length < 10) {
      console.log('Tentando extração alternativa...');
      
      // Padrão mais simples: qualquer texto entre colchetes que pareça um tema jurídico
      const patternTemas = /\[([^\]]{10,200})\]\(([^)]+)\)/g;
      let match;
      
      ramoAtual = 'Direito Geral';
      tituloAtual = 'Temas Diversos';
      
      while ((match = patternTemas.exec(markdown)) !== null) {
        const tema = match[1].trim();
        const link = match[2];
        
        // Filtrar navegação e links não-temáticos
        if (tema.toLowerCase().includes('clique') ||
            tema.toLowerCase().includes('pesquisar') ||
            tema.toLowerCase().includes('voltar') ||
            tema.toLowerCase().includes('home') ||
            tema.toLowerCase().includes('saiba mais') ||
            tema.length < 10) {
          continue;
        }

        // Tentar inferir ramo a partir do tema
        let ramoInferido = ramoAtual;
        if (tema.toLowerCase().includes('penal') || tema.toLowerCase().includes('crime')) {
          ramoInferido = 'Direito Penal';
        } else if (tema.toLowerCase().includes('civil') || tema.toLowerCase().includes('contrato')) {
          ramoInferido = 'Direito Civil';
        } else if (tema.toLowerCase().includes('trabalh') || tema.toLowerCase().includes('emprego')) {
          ramoInferido = 'Direito do Trabalho';
        } else if (tema.toLowerCase().includes('tribut') || tema.toLowerCase().includes('fiscal')) {
          ramoInferido = 'Direito Tributário';
        } else if (tema.toLowerCase().includes('admin') || tema.toLowerCase().includes('público')) {
          ramoInferido = 'Direito Administrativo';
        } else if (tema.toLowerCase().includes('consum')) {
          ramoInferido = 'Direito do Consumidor';
        } else if (tema.toLowerCase().includes('ambient')) {
          ramoInferido = 'Direito Ambiental';
        } else if (tema.toLowerCase().includes('constitu')) {
          ramoInferido = 'Direito Constitucional';
        } else if (tema.toLowerCase().includes('empresa') || tema.toLowerCase().includes('societár')) {
          ramoInferido = 'Direito Empresarial';
        } else if (tema.toLowerCase().includes('previdenc') || tema.toLowerCase().includes('inss')) {
          ramoInferido = 'Direito Previdenciário';
        }

        pesquisas.push({
          ramo_direito: ramoInferido,
          titulo_secao: tituloAtual,
          tema: tema,
          link_pesquisa: link.startsWith('http') ? link : `https://scon.stj.jus.br${link}`,
        });
      }
    }

    console.log('Total de pesquisas extraídas:', pesquisas.length);

    // Remover duplicatas
    const pesquisasUnicas = new Map<string, PesquisaExtraida>();
    for (const p of pesquisas) {
      const chave = `${p.ramo_direito}|${p.titulo_secao}|${p.tema}`;
      if (!pesquisasUnicas.has(chave)) {
        pesquisasUnicas.set(chave, p);
      }
    }

    const pesquisasArray = Array.from(pesquisasUnicas.values());
    console.log('Pesquisas únicas:', pesquisasArray.length);

    if (pesquisasArray.length === 0) {
      // Log do markdown para debug
      console.log('Markdown (primeiros 2000 chars):', markdown.substring(0, 2000));
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Nenhuma pesquisa encontrada na página',
          debug: {
            markdownLength: markdown.length,
            linksCount: links.length,
            preview: markdown.substring(0, 500)
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inserir no banco com upsert
    let inseridos = 0;
    let erros = 0;

    for (const pesquisa of pesquisasArray) {
      const { error } = await supabase
        .from('stj_pesquisa_pronta')
        .upsert({
          ramo_direito: pesquisa.ramo_direito,
          titulo_secao: pesquisa.titulo_secao,
          tema: pesquisa.tema,
          link_pesquisa: pesquisa.link_pesquisa,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'ramo_direito,titulo_secao,tema'
        });

      if (error) {
        console.error('Erro ao inserir:', error);
        erros++;
      } else {
        inseridos++;
      }
    }

    console.log(`Raspagem concluída: ${inseridos} inseridos, ${erros} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        total_extraidas: pesquisasArray.length,
        inseridas: inseridos,
        erros: erros,
        ramos: [...new Set(pesquisasArray.map(p => p.ramo_direito))],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na raspagem:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
