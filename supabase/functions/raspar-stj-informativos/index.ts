import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InformativoExtraido {
  numero: number;
  data_publicacao?: string;
  titulo?: string;
  processo?: string;
  ramo_direito?: string;
  ministro?: string;
  tese?: string;
  destaque?: string;
  link?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando raspagem de informativos do STJ...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // URL correta da página de informativos do STJ
    const urlInformativos = 'https://processo.stj.jus.br/jurisprudencia/externo/informativo/';

    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY não configurada');
    }

    console.log('Raspando página de informativos...');
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: urlInformativos,
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

    // Extrair informativos do markdown
    const informativos: InformativoExtraido[] = [];

    // O formato no markdown é algo como:
    // "Informativo nº 874" ou "Informativo de Jurisprudência n. 874"
    // Seguido por data, processo, ramo do direito, tema, destaque
    
    // Regex melhorada para encontrar blocos de informativos
    const blocos = markdown.split(/(?=Informativo\s+(?:de\s+Jurisprudência\s+)?n[.ºo°]\s*\d+)/gi);
    
    console.log(`Encontrados ${blocos.length - 1} blocos de informativos`);

    for (const bloco of blocos) {
      // Extrair número do informativo
      const numeroMatch = bloco.match(/Informativo\s+(?:de\s+Jurisprudência\s+)?n[.ºo°]\s*(\d+)/i);
      if (!numeroMatch) continue;

      const numero = parseInt(numeroMatch[1]);
      if (isNaN(numero)) continue;

      // Extrair data de publicação
      const dataMatch = bloco.match(/(\d{1,2})\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/i);
      let dataPublicacao = null;
      if (dataMatch) {
        const meses: Record<string, string> = {
          'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
          'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
          'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
        };
        const mes = meses[dataMatch[2].toLowerCase()];
        if (mes) {
          dataPublicacao = `${dataMatch[3]}-${mes}-${dataMatch[1].padStart(2, '0')}`;
        }
      }

      // Extrair processo
      const processoMatch = bloco.match(/\[(REsp|AgInt|AREsp|RHC|HC|MS|EREsp|AgRg|EDcl)\s*[\d.,\-\/]+[^\]]*\]/i);
      const processo = processoMatch ? processoMatch[0].replace(/[\[\]]/g, '') : null;

      // Extrair ramo do direito
      const ramoMatch = bloco.match(/Ramo do Direito\s*\n+([^\n]+)/i);
      const ramoDireito = ramoMatch ? ramoMatch[1].trim() : null;

      // Extrair ministro
      const ministroMatch = bloco.match(/Rel\.?\s+Minist(?:ro|ra)\s+([^,\n]+)/i);
      const ministro = ministroMatch ? ministroMatch[1].trim() : null;

      // Extrair tema
      const temaMatch = bloco.match(/Tema\s*\n+[^\n]*\n+([^\n]+)/i);
      const tema = temaMatch ? temaMatch[1].trim().substring(0, 1000) : null;

      // Extrair destaque
      const destaqueMatch = bloco.match(/Destaque\s*\n+([^\n]+(?:\n[^\n]+)*)/i);
      const destaque = destaqueMatch ? destaqueMatch[1].trim().substring(0, 1000) : null;

      // Construir link
      const link = `https://processo.stj.jus.br/jurisprudencia/externo/informativo/?acao=pesquisar&livre=@CNOT=%27${numero}%27`;

      informativos.push({
        numero,
        data_publicacao: dataPublicacao || undefined,
        processo: processo || undefined,
        ministro: ministro || undefined,
        ramo_direito: ramoDireito || undefined,
        tese: tema || undefined,
        destaque: destaque || undefined,
        link,
      });
    }

    // Remover duplicatas mantendo o mais completo
    const informativosUnicos = new Map<number, InformativoExtraido>();
    for (const info of informativos) {
      const existing = informativosUnicos.get(info.numero);
      if (!existing || (info.destaque && !existing.destaque)) {
        informativosUnicos.set(info.numero, info);
      }
    }

    const informativosFinal = Array.from(informativosUnicos.values());
    console.log(`Informativos únicos extraídos: ${informativosFinal.length}`);

    // Salvar no banco
    let inseridos = 0;
    for (const info of informativosFinal) {
      try {
        const { error } = await supabase
          .from('STJ_INFORMATIVOS')
          .upsert({
            numero: info.numero,
            data_publicacao: info.data_publicacao,
            processo: info.processo || `INF-${info.numero}`,
            ministro: info.ministro,
            ramo_direito: info.ramo_direito,
            tese: info.tese,
            destaque: info.destaque,
            link: info.link,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'numero,processo',
          });

        if (!error) inseridos++;
        else console.error(`Erro ao inserir informativo ${info.numero}:`, error);
      } catch (err) {
        console.error(`Erro ao salvar informativo ${info.numero}:`, err);
      }
    }

    console.log(`Raspagem concluída. ${inseridos} informativos salvos.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${inseridos} informativos atualizados`,
        total_encontrados: informativosFinal.length,
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
