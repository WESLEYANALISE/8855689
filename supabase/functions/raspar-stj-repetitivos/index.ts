import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RepetitivoExtraido {
  tema: number;
  processo?: string;
  ministro?: string;
  ramo_direito?: string;
  situacao?: string;
  questao_submetida?: string;
  tese_firmada?: string;
  link?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando raspagem de Recursos Repetitivos do STJ...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // URL correta da página de Precedentes Qualificados (Repetitivos)
    const urlRepetitivos = 'https://processo.stj.jus.br/repetitivos/temas_repetitivos/';

    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY não configurada');
    }

    console.log('Raspando página de Repetitivos...');
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: urlRepetitivos,
        formats: ['markdown', 'links'],
        onlyMainContent: false,
        waitFor: 5000,
        timeout: 60000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro do Firecrawl:', errorText);
      throw new Error(`Firecrawl error: ${response.status}`);
    }

    const data = await response.json();
    const markdown = data.data?.markdown || '';
    const links = data.data?.links || [];

    console.log(`Conteúdo recebido: ${markdown.length} caracteres, ${links.length} links`);

    // Extrair temas do conteúdo
    const repetitivos: RepetitivoExtraido[] = [];

    // Padrão para encontrar temas no markdown
    // Exemplo: "Tema 1.000", "TEMA 999", "Tema nº 998"
    const temaRegex = /Tema\s+(?:n[.º°]?\s*)?(\d+(?:\.\d+)?)/gi;
    const matches = markdown.matchAll(temaRegex);

    const temasEncontrados = new Set<number>();
    const temasParaRaspar: { tema: number; link: string }[] = [];
    
    for (const match of matches) {
      const temaStr = match[1].replace('.', '');
      const tema = parseInt(temaStr);
      if (!isNaN(tema) && !temasEncontrados.has(tema)) {
        temasEncontrados.add(tema);
        
        // Buscar link específico do tema
        const linkTema = links.find((l: string) => 
          l.includes('repetitivo') && l.includes(String(tema))
        ) || `https://www.stj.jus.br/sites/portalp/Jurisprudencia/Repetitivos-e-IAC?tema=${tema}`;

        temasParaRaspar.push({
          tema,
          link: linkTema,
        });
      }
    }

    console.log(`Encontrados ${temasParaRaspar.length} temas`);

    // Para cada tema, extrair detalhes
    let processados = 0;

    for (const tm of temasParaRaspar.slice(0, 15)) { // Limitar a 15 por vez
      try {
        console.log(`Raspando detalhes do tema ${tm.tema}...`);
        
        // Delay para evitar rate limiting
        await new Promise(r => setTimeout(r, 2000));

        const detailResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: tm.link,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 2000,
            timeout: 20000,
          }),
        });

        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          const detailMarkdown = detailData.data?.markdown || '';

          // Extrair processo
          const processoMatch = detailMarkdown.match(/(REsp|AgInt|AREsp|EREsp)\s*[\d.,\/]+[^.\n]*/i);

          // Extrair ministro
          const ministroMatch = detailMarkdown.match(/(?:Relator|Min(?:istro)?)[:\s]+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i);

          // Extrair situação
          let situacao = 'Afetado';
          if (/trânsito\s+em\s+julgado/i.test(detailMarkdown)) situacao = 'Trânsito em Julgado';
          else if (/julgado/i.test(detailMarkdown) && /tese\s+firmada/i.test(detailMarkdown)) situacao = 'Julgado';
          else if (/desafetado/i.test(detailMarkdown)) situacao = 'Desafetado';

          // Extrair questão submetida
          const questaoMatch = detailMarkdown.match(/(?:Quest[ãa]o\s+(?:submetida|jur[íi]dica)|Delimita[çc][ãa]o)[:\s]+(.+?)(?=(?:Tese|Situa[çc][ãa]o|Ac[óo]rd[ãa]o|$))/is);
          const questaoSubmetida = questaoMatch?.[1]?.trim().substring(0, 2000);

          // Extrair tese firmada
          const teseMatch = detailMarkdown.match(/Tese\s+(?:firmada|fixada)[:\s]+(.+?)(?=(?:Ac[óo]rd[ãa]o|Situa[çc][ãa]o|Relator|$))/is);
          const teseFirmada = teseMatch?.[1]?.trim().substring(0, 2000);

          // Detectar ramo do direito
          let ramoDireito = null;
          if (/penal|crime|criminal/i.test(detailMarkdown)) ramoDireito = 'Penal';
          else if (/civil|contrato|obrigação/i.test(detailMarkdown)) ramoDireito = 'Civil';
          else if (/tributár|imposto|fiscal/i.test(detailMarkdown)) ramoDireito = 'Tributário';
          else if (/trabalh|empregad|CLT/i.test(detailMarkdown)) ramoDireito = 'Trabalhista';
          else if (/administrativ|licitação|servidor/i.test(detailMarkdown)) ramoDireito = 'Administrativo';
          else if (/consumidor|CDC/i.test(detailMarkdown)) ramoDireito = 'Consumidor';
          else if (/previdenci|inss|aposentadoria/i.test(detailMarkdown)) ramoDireito = 'Previdenciário';
          else if (/ambient|floresta|ecológ/i.test(detailMarkdown)) ramoDireito = 'Ambiental';
          else if (/saúde|sus|plano/i.test(detailMarkdown)) ramoDireito = 'Saúde';
          else if (/bancár|financ|juros/i.test(detailMarkdown)) ramoDireito = 'Bancário';

          repetitivos.push({
            tema: tm.tema,
            processo: processoMatch?.[0],
            ministro: ministroMatch?.[1],
            ramo_direito: ramoDireito || undefined,
            situacao,
            questao_submetida: questaoSubmetida,
            tese_firmada: teseFirmada,
            link: tm.link,
          });

          processados++;
        }
      } catch (err) {
        console.error(`Erro ao raspar tema ${tm.tema}:`, err);
      }
    }

    console.log(`Detalhes extraídos de ${repetitivos.length} temas`);

    // Salvar no banco
    let inseridos = 0;
    for (const rep of repetitivos) {
      try {
        const { error } = await supabase
          .from('STJ_REPETITIVOS')
          .upsert({
            tema: rep.tema,
            processo: rep.processo,
            ministro: rep.ministro,
            ramo_direito: rep.ramo_direito,
            situacao: rep.situacao,
            questao_submetida: rep.questao_submetida,
            tese_firmada: rep.tese_firmada,
            link: rep.link,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'tema',
          });

        if (!error) inseridos++;
        else console.error(`Erro ao inserir tema ${rep.tema}:`, error);
      } catch (err) {
        console.error(`Erro ao salvar tema:`, err);
      }
    }

    console.log(`Raspagem concluída. ${inseridos} repetitivos salvos.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${inseridos} repetitivos atualizados`,
        total_temas: temasParaRaspar.length,
        total_processados: processados,
        total_salvos: inseridos,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na raspagem:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
