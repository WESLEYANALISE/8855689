import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AtoExtraido {
  tipo_ato: string;
  numero: string;
  data_ato: string;
  ementa: string;
  url_dou: string;
  url_planalto: string;
}

// Tipos de atos que queremos capturar
const TIPOS_INTERESSE = [
  'LEI',
  'DECRETO',
  'MEDIDA PROVISÓRIA',
  'LEI COMPLEMENTAR',
  'EMENDA CONSTITUCIONAL',
  'LEI Nº',
  'DECRETO Nº',
  'MP Nº',
  'LC Nº',
  'EC Nº'
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const body = await req.json().catch(() => ({}));
    
    // Data padrão: hoje
    const hoje = new Date();
    const dataParam = body.data || `${String(hoje.getDate()).padStart(2, '0')}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${hoje.getFullYear()}`;
    
    console.log(`[raspar-dou] Iniciando raspagem para data: ${dataParam}`);
    
    // URL do DOU - Seção 1 (onde ficam as leis)
    const urlDou = `https://www.in.gov.br/leiturajornal?data=${dataParam}&secao=dou1`;
    
    console.log(`[raspar-dou] URL: ${urlDou}`);
    
    // Usar Firecrawl para raspar
    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY não configurada');
    }
    
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: urlDou,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000,
        timeout: 60000
      })
    });
    
    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('[raspar-dou] Erro Firecrawl:', errorText);
      throw new Error(`Firecrawl error: ${scrapeResponse.status}`);
    }
    
    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || '';
    const html = scrapeData.data?.html || '';
    
    console.log(`[raspar-dou] Conteúdo recebido: ${markdown.length} chars markdown, ${html.length} chars html`);
    
    // Extrair atos do conteúdo
    const atosExtraidos = extrairAtosDoConteudo(markdown, html, dataParam);
    
    console.log(`[raspar-dou] Atos extraídos: ${atosExtraidos.length}`);
    
    if (atosExtraidos.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Nenhum ato relevante encontrado para ${dataParam}`,
          total_extraidos: 0,
          novos_inseridos: 0,
          data: dataParam
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verificar quais atos já existem
    const numerosLeis = atosExtraidos.map(a => a.numero);
    const { data: existentes } = await supabase
      .from('leis_push_2025')
      .select('numero_lei')
      .in('numero_lei', numerosLeis);
    
    const existentesSet = new Set((existentes || []).map(e => e.numero_lei));
    const atosNovos = atosExtraidos.filter(a => !existentesSet.has(a.numero));
    
    console.log(`[raspar-dou] Atos novos para inserir: ${atosNovos.length}`);
    
    // Inserir novos atos
    let inseridos = 0;
    const atosInseridos: string[] = [];
    
    for (const ato of atosNovos) {
      // Converter data DD-MM-YYYY para YYYY-MM-DD
      const [dia, mes, ano] = dataParam.split('-');
      const dataDou = `${ano}-${mes}-${dia}`;
      
      const { error } = await supabase
        .from('leis_push_2025')
        .insert({
          numero_lei: ato.numero,
          tipo_ato: ato.tipo_ato,
          ementa: ato.ementa,
          url_planalto: ato.url_planalto,
          data_dou: dataDou,
          data_ato: ato.data_ato || dataDou,
          status: 'pendente',
          ordem_dou: inseridos + 1
        });
      
      if (error) {
        console.error(`[raspar-dou] Erro ao inserir ${ato.numero}:`, error.message);
      } else {
        inseridos++;
        atosInseridos.push(`${ato.tipo_ato} ${ato.numero}`);
        console.log(`[raspar-dou] Inserido: ${ato.tipo_ato} ${ato.numero}`);
      }
    }
    
    // Se inseriu novos atos, chamar automação de formatação
    if (inseridos > 0) {
      console.log(`[raspar-dou] Chamando automacao-formatacao-leis para ${inseridos} novos atos...`);
      
      try {
        await supabase.functions.invoke('automacao-formatacao-leis', {
          body: { trigger: 'raspar-dou' }
        });
        console.log('[raspar-dou] Automação de formatação iniciada');
      } catch (err) {
        console.error('[raspar-dou] Erro ao chamar automação:', err);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Raspagem concluída para ${dataParam}`,
        total_extraidos: atosExtraidos.length,
        novos_inseridos: inseridos,
        atos_inseridos: atosInseridos,
        data: dataParam
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error('[raspar-dou] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function extrairAtosDoConteudo(markdown: string, html: string, dataParam: string): AtoExtraido[] {
  const atos: AtoExtraido[] = [];
  const atosEncontrados = new Set<string>();
  
  // Converter data DD-MM-YYYY para componentes
  const [dia, mes, ano] = dataParam.split('-');
  
  // Padrões para encontrar leis, decretos, etc
  // Formato típico: [LEI Nº 15.319, DE 26 DE DEZEMBRO DE 2025](url)
  // ou: LEI Nº 15.319, DE 26 DE DEZEMBRO DE 2025
  
  const regexPatterns = [
    // Lei no formato markdown link
    /\[LEI\s+(?:Nº\s*)?(\d+\.?\d*),?\s*DE\s+(\d+)\s+DE\s+(\w+)\s+DE\s+(\d{4})\]\(([^)]+)\)/gi,
    // Decreto no formato markdown link
    /\[DECRETO\s+(?:Nº\s*)?(\d+\.?\d*),?\s*DE\s+(\d+)\s+DE\s+(\w+)\s+DE\s+(\d{4})\]\(([^)]+)\)/gi,
    // Medida Provisória
    /\[MEDIDA\s+PROVISÓRIA\s+(?:Nº\s*)?(\d+\.?\d*),?\s*DE\s+(\d+)\s+DE\s+(\w+)\s+DE\s+(\d{4})\]\(([^)]+)\)/gi,
    // Lei Complementar
    /\[LEI\s+COMPLEMENTAR\s+(?:Nº\s*)?(\d+\.?\d*),?\s*DE\s+(\d+)\s+DE\s+(\w+)\s+DE\s+(\d{4})\]\(([^)]+)\)/gi,
    // Emenda Constitucional
    /\[EMENDA\s+CONSTITUCIONAL\s+(?:Nº\s*)?(\d+\.?\d*),?\s*DE\s+(\d+)\s+DE\s+(\w+)\s+DE\s+(\d{4})\]\(([^)]+)\)/gi,
  ];
  
  const tiposMap: Record<string, string> = {
    'lei': 'Lei Ordinária',
    'decreto': 'Decreto',
    'medida provisória': 'Medida Provisória',
    'lei complementar': 'Lei Complementar',
    'emenda constitucional': 'Emenda Constitucional'
  };
  
  const mesesMap: Record<string, string> = {
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
    'abril': '04', 'maio': '05', 'junho': '06',
    'julho': '07', 'agosto': '08', 'setembro': '09',
    'outubro': '10', 'novembro': '11', 'dezembro': '12'
  };
  
  // Primeiro, tentar extrair com regex de links markdown
  for (const pattern of regexPatterns) {
    const matches = markdown.matchAll(pattern);
    for (const match of matches) {
      const numero = match[1].replace('.', '');
      const diaAto = match[2];
      const mesAto = mesesMap[match[3].toLowerCase()] || mes;
      const anoAto = match[4];
      const urlDou = match[5];
      
      // Determinar tipo
      let tipoAto = 'Lei Ordinária';
      const textoMatch = match[0].toLowerCase();
      if (textoMatch.includes('decreto')) tipoAto = 'Decreto';
      else if (textoMatch.includes('medida provisória')) tipoAto = 'Medida Provisória';
      else if (textoMatch.includes('lei complementar')) tipoAto = 'Lei Complementar';
      else if (textoMatch.includes('emenda constitucional')) tipoAto = 'Emenda Constitucional';
      
      const chaveUnica = `${tipoAto}-${numero}`;
      if (atosEncontrados.has(chaveUnica)) continue;
      atosEncontrados.add(chaveUnica);
      
      // Construir URL do Planalto
      const urlPlanalto = construirUrlPlanalto(tipoAto, numero, anoAto);
      
      // Tentar extrair ementa (texto após o link até próxima linha)
      const posMatch = markdown.indexOf(match[0]);
      let ementa = '';
      if (posMatch > -1) {
        const textoApos = markdown.substring(posMatch + match[0].length, posMatch + match[0].length + 500);
        const linhas = textoApos.split('\n').filter(l => l.trim());
        if (linhas.length > 0) {
          ementa = linhas[0].trim().replace(/^\s*[-–—:]\s*/, '');
        }
      }
      
      atos.push({
        tipo_ato: tipoAto,
        numero: numero,
        data_ato: `${anoAto}-${mesAto}-${diaAto.padStart(2, '0')}`,
        ementa: ementa || `${tipoAto} nº ${numero}`,
        url_dou: urlDou,
        url_planalto: urlPlanalto
      });
    }
  }
  
  // Se não encontrou nada, tentar padrão sem link
  if (atos.length === 0) {
    const regexSemLink = [
      /LEI\s+(?:Nº\s*)?(\d+\.?\d*),?\s*DE\s+(\d+)\s+DE\s+(\w+)\s+DE\s+(\d{4})/gi,
      /DECRETO\s+(?:Nº\s*)?(\d+\.?\d*),?\s*DE\s+(\d+)\s+DE\s+(\w+)\s+DE\s+(\d{4})/gi,
      /MEDIDA\s+PROVISÓRIA\s+(?:Nº\s*)?(\d+\.?\d*),?\s*DE\s+(\d+)\s+DE\s+(\w+)\s+DE\s+(\d{4})/gi,
    ];
    
    for (const pattern of regexSemLink) {
      const matches = markdown.matchAll(pattern);
      for (const match of matches) {
        const numero = match[1].replace('.', '');
        const diaAto = match[2];
        const mesAto = mesesMap[match[3].toLowerCase()] || mes;
        const anoAto = match[4];
        
        let tipoAto = 'Lei Ordinária';
        const textoMatch = match[0].toLowerCase();
        if (textoMatch.includes('decreto')) tipoAto = 'Decreto';
        else if (textoMatch.includes('medida provisória')) tipoAto = 'Medida Provisória';
        
        const chaveUnica = `${tipoAto}-${numero}`;
        if (atosEncontrados.has(chaveUnica)) continue;
        atosEncontrados.add(chaveUnica);
        
        const urlPlanalto = construirUrlPlanalto(tipoAto, numero, anoAto);
        
        atos.push({
          tipo_ato: tipoAto,
          numero: numero,
          data_ato: `${anoAto}-${mesAto}-${diaAto.padStart(2, '0')}`,
          ementa: `${tipoAto} nº ${numero}`,
          url_dou: '',
          url_planalto: urlPlanalto
        });
      }
    }
  }
  
  return atos;
}

function construirUrlPlanalto(tipo: string, numero: string, ano: string): string {
  const atoDir = ano >= '2019' ? '2019-2022' : 
                 ano >= '2023' ? '2023-2026' : '2019-2022';
  
  const numeroLimpo = numero.replace('.', '');
  
  switch (tipo) {
    case 'Lei Ordinária':
      return `http://www.planalto.gov.br/ccivil_03/_ato${atoDir}/${ano}/Lei/L${numeroLimpo}.htm`;
    case 'Decreto':
      return `http://www.planalto.gov.br/ccivil_03/_ato${atoDir}/${ano}/Decreto/D${numeroLimpo}.htm`;
    case 'Medida Provisória':
      return `http://www.planalto.gov.br/ccivil_03/_ato${atoDir}/${ano}/Mpv/Mpv${numeroLimpo}.htm`;
    case 'Lei Complementar':
      return `http://www.planalto.gov.br/ccivil_03/Leis/LCP/Lcp${numeroLimpo}.htm`;
    case 'Emenda Constitucional':
      return `http://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc${numeroLimpo}.htm`;
    default:
      return `http://www.planalto.gov.br/ccivil_03/_ato${atoDir}/${ano}/Lei/L${numeroLimpo}.htm`;
  }
}
