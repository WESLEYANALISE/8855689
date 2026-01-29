import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TeseExtraida {
  edicao: number;
  numero_tese?: number;
  titulo_edicao?: string;
  data_publicacao?: string;
  ramo_direito?: string;
  tese: string;
  acordaos_vinculados?: string[];
  link?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando raspagem de Jurisprudência em Teses do STJ...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const urlTeses = 'https://scon.stj.jus.br/SCON/jt/';

    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY não configurada');
    }

    console.log('Raspando página de Jurisprudência em Teses...');
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: urlTeses,
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

    console.log(`Conteúdo recebido: ${markdown.length} caracteres`);
    console.log('Amostra do markdown:', markdown.substring(0, 2000));

    const teses: TeseExtraida[] = [];

    // Padrão para formato de tabela: | | EDIÇÃO N. 272: PLANOS DE SAÚDE V | 19/11/2025 |
    const edicaoTablePattern = /\|\s*\|?\s*\[?EDIÇÃO\s*N\.?\s*(\d+):?\s*([^\]|]+)\]?\s*\|?\s*(\d{2}\/\d{2}\/\d{4})?\s*\|?/gi;
    
    // Padrão alternativo para links: [EDIÇÃO N. 272: PLANOS DE SAÚDE V](url)
    const edicaoLinkPattern = /\[EDIÇÃO\s*N\.?\s*(\d+):?\s*([^\]]+)\]\(([^)]+)\)/gi;
    
    // Padrão simples: EDIÇÃO N. 272 ou EDIÇÃO 272
    const edicaoSimplePattern = /EDIÇÃO\s*N\.?\s*(\d+)/gi;

    const edicoesProcessadas = new Set<number>();

    // Primeiro, tentar extrair do formato de tabela
    let match;
    while ((match = edicaoTablePattern.exec(markdown)) !== null) {
      const edicao = parseInt(match[1]);
      if (!isNaN(edicao) && !edicoesProcessadas.has(edicao)) {
        edicoesProcessadas.add(edicao);
        
        let titulo = match[2]?.trim() || '';
        // Limpar título de caracteres extras
        titulo = titulo.replace(/[\[\]()]/g, '').replace(/https?:\/\/[^\s]+/g, '').trim();
        
        const dataPub = match[3] || '';
        
        // Inferir ramo do direito do título
        let ramoDireito = '';
        const textoAnalise = titulo.toLowerCase();
        if (/civil|contrato|obrigaç|família|sucessão|responsabilidade/i.test(textoAnalise)) ramoDireito = 'Direito Civil';
        else if (/penal|crime|criminal|pena|homicídio|roubo|furto/i.test(textoAnalise)) ramoDireito = 'Direito Penal';
        else if (/process|recurso|ação|agravo|execução|cumprimento/i.test(textoAnalise)) ramoDireito = 'Direito Processual';
        else if (/tributár|imposto|fiscal|icms|iss|ipi/i.test(textoAnalise)) ramoDireito = 'Direito Tributário';
        else if (/trabalh|emprego|clt|fgts/i.test(textoAnalise)) ramoDireito = 'Direito do Trabalho';
        else if (/administrativ|licitação|servidor|improbidade/i.test(textoAnalise)) ramoDireito = 'Direito Administrativo';
        else if (/consumidor|cdc|fornecedor|produto|plano.*saúde/i.test(textoAnalise)) ramoDireito = 'Direito do Consumidor';
        else if (/ambient|floresta|fauna|poluição/i.test(textoAnalise)) ramoDireito = 'Direito Ambiental';
        else if (/criança|adolescente|eca|menor/i.test(textoAnalise)) ramoDireito = 'ECA';
        else if (/previdenciár|inss|aposentadoria|benefício/i.test(textoAnalise)) ramoDireito = 'Direito Previdenciário';
        else if (/saúde|plano|sus|médico/i.test(textoAnalise)) ramoDireito = 'Direito da Saúde';
        else if (/empresarial|falência|recuperação|sociedade/i.test(textoAnalise)) ramoDireito = 'Direito Empresarial';

        teses.push({
          edicao,
          numero_tese: 1,
          titulo_edicao: titulo || `Edição ${edicao}`,
          data_publicacao: dataPub,
          ramo_direito: ramoDireito || undefined,
          tese: `Jurisprudência em Teses - Edição ${edicao}${titulo ? `: ${titulo}` : ''}`,
          link: `https://scon.stj.jus.br/SCON/jt/doc.jsp?livre=%27${edicao}%27%20INPATH(TIT)`,
        });
        
        console.log(`Edição ${edicao} extraída: ${titulo}`);
      }
    }

    // Se não encontrou no formato tabela, tentar formato de link
    if (edicoesProcessadas.size === 0) {
      while ((match = edicaoLinkPattern.exec(markdown)) !== null) {
        const edicao = parseInt(match[1]);
        if (!isNaN(edicao) && !edicoesProcessadas.has(edicao)) {
          edicoesProcessadas.add(edicao);
          
          let titulo = match[2]?.trim() || '';
          titulo = titulo.replace(/https?:\/\/[^\s]+/g, '').trim();
          const link = match[3] || '';
          
          let ramoDireito = '';
          const textoAnalise = titulo.toLowerCase();
          if (/civil|contrato|obrigaç|família|sucessão|responsabilidade/i.test(textoAnalise)) ramoDireito = 'Direito Civil';
          else if (/penal|crime|criminal|pena/i.test(textoAnalise)) ramoDireito = 'Direito Penal';
          else if (/process|recurso|ação|agravo/i.test(textoAnalise)) ramoDireito = 'Direito Processual';
          else if (/tributár|imposto|fiscal/i.test(textoAnalise)) ramoDireito = 'Direito Tributário';
          else if (/administrativ|licitação|servidor/i.test(textoAnalise)) ramoDireito = 'Direito Administrativo';
          else if (/consumidor|cdc|fornecedor|plano.*saúde/i.test(textoAnalise)) ramoDireito = 'Direito do Consumidor';

          teses.push({
            edicao,
            numero_tese: 1,
            titulo_edicao: titulo || `Edição ${edicao}`,
            ramo_direito: ramoDireito || undefined,
            tese: `Jurisprudência em Teses - Edição ${edicao}${titulo ? `: ${titulo}` : ''}`,
            link: link.startsWith('http') ? link : `https://scon.stj.jus.br${link}`,
          });
          
          console.log(`Edição ${edicao} extraída (link): ${titulo}`);
        }
      }
    }

    // Se ainda não encontrou, usar padrão simples
    if (edicoesProcessadas.size === 0) {
      while ((match = edicaoSimplePattern.exec(markdown)) !== null) {
        const edicao = parseInt(match[1]);
        if (!isNaN(edicao) && !edicoesProcessadas.has(edicao) && edicoesProcessadas.size < 50) {
          edicoesProcessadas.add(edicao);
          
          teses.push({
            edicao,
            numero_tese: 1,
            titulo_edicao: `Edição ${edicao}`,
            tese: `Jurisprudência em Teses - Edição ${edicao}`,
            link: `https://scon.stj.jus.br/SCON/jt/doc.jsp?livre=%27${edicao}%27%20INPATH(TIT)`,
          });
        }
      }
    }

    // Ordenar por edição (mais recente primeiro)
    teses.sort((a, b) => b.edicao - a.edicao);

    console.log(`Total de teses processadas: ${teses.length}`);

    // Salvar no banco
    let inseridas = 0;
    for (const tese of teses.slice(0, 50)) {
      try {
        const { error } = await supabase
          .from('STJ_TESES')
          .upsert({
            edicao: tese.edicao,
            numero_tese: tese.numero_tese,
            titulo_edicao: tese.titulo_edicao,
            data_publicacao: tese.data_publicacao,
            ramo_direito: tese.ramo_direito,
            tese: tese.tese,
            acordaos_vinculados: tese.acordaos_vinculados,
            link: tese.link,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'edicao,numero_tese',
          });

        if (!error) inseridas++;
        else console.error(`Erro ao inserir tese ${tese.edicao}:`, error);
      } catch (err) {
        console.error(`Erro ao salvar tese:`, err);
      }
    }

    console.log(`Raspagem concluída. ${inseridas} teses salvas.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${inseridas} teses atualizadas`,
        total_encontradas: teses.length,
        total_salvas: inseridas,
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
