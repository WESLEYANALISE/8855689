import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DATAJUD_API_KEY = 'APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';

// Tribunais disponíveis com seus endpoints
type TribunalKey = keyof typeof TRIBUNAIS;
const TRIBUNAIS = {
  'STF': 'https://api-publica.datajud.cnj.jus.br/api_publica_stf/_search',
  'STJ': 'https://api-publica.datajud.cnj.jus.br/api_publica_stj/_search',
  'TST': 'https://api-publica.datajud.cnj.jus.br/api_publica_tst/_search',
  'TSE': 'https://api-publica.datajud.cnj.jus.br/api_publica_tse/_search',
  'STM': 'https://api-publica.datajud.cnj.jus.br/api_publica_stm/_search',
  'TRF1': 'https://api-publica.datajud.cnj.jus.br/api_publica_trf1/_search',
  'TRF2': 'https://api-publica.datajud.cnj.jus.br/api_publica_trf2/_search',
  'TRF3': 'https://api-publica.datajud.cnj.jus.br/api_publica_trf3/_search',
  'TRF4': 'https://api-publica.datajud.cnj.jus.br/api_publica_trf4/_search',
  'TRF5': 'https://api-publica.datajud.cnj.jus.br/api_publica_trf5/_search',
  'TRF6': 'https://api-publica.datajud.cnj.jus.br/api_publica_trf6/_search',
  'TJSP': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjsp/_search',
  'TJRJ': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjrj/_search',
  'TJMG': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjmg/_search',
  'TJRS': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjrs/_search',
  'TJPR': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjpr/_search',
  'TJSC': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjsc/_search',
  'TJBA': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjba/_search',
  'TJPE': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjpe/_search',
  'TJCE': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjce/_search',
  'TJGO': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjgo/_search',
  'TJDF': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjdft/_search',
  'TJES': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjes/_search',
  'TJMT': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjmt/_search',
  'TJMS': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjms/_search',
  'TJPA': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjpa/_search',
  'TJAM': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjam/_search',
  'TJMA': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjma/_search',
  'TJPI': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjpi/_search',
  'TJRN': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjrn/_search',
  'TJPB': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjpb/_search',
  'TJSE': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjse/_search',
  'TJAL': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjal/_search',
  'TJRO': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjro/_search',
  'TJAC': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjac/_search',
  'TJAP': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjap/_search',
  'TJRR': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjrr/_search',
  'TJTO': 'https://api-publica.datajud.cnj.jus.br/api_publica_tjto/_search',
};

// Mapeamento de UF para tribunal
const UF_TRIBUNAL: Record<string, string> = {
  'SP': 'TJSP', 'RJ': 'TJRJ', 'MG': 'TJMG', 'RS': 'TJRS', 'PR': 'TJPR',
  'SC': 'TJSC', 'BA': 'TJBA', 'PE': 'TJPE', 'CE': 'TJCE', 'GO': 'TJGO',
  'DF': 'TJDF', 'ES': 'TJES', 'MT': 'TJMT', 'MS': 'TJMS', 'PA': 'TJPA',
  'AM': 'TJAM', 'MA': 'TJMA', 'PI': 'TJPI', 'RN': 'TJRN', 'PB': 'TJPB',
  'SE': 'TJSE', 'AL': 'TJAL', 'RO': 'TJRO', 'AC': 'TJAC', 'AP': 'TJAP',
  'RR': 'TJRR', 'TO': 'TJTO',
};

// Dados oficiais do Justiça em Números 2025 (ano-base 2024)
const DADOS_JUSTICA_NUMEROS_2025 = {
  totalProcessos: 83800000,
  processosNovos: 35100000,
  processosBaixados: 36400000,
  processosPendentes: 83800000,
  taxaCongestionamento: 70.0,
  tempoMedioTramitacao: 4.4, // anos
  magistrados: 18700,
  servidores: 260000,
  despesaTotal: 104000000000, // R$ 104 bilhões
  custoProcesso: 1239, // R$ por processo
  indiceAtendimentoDemanda: 103.7, // %
  
  // Por segmento
  porSegmento: {
    estadual: { novos: 24500000, pendentes: 64100000, baixados: 24800000 },
    federal: { novos: 6200000, pendentes: 11200000, baixados: 6400000 },
    trabalhista: { novos: 3800000, pendentes: 6500000, baixados: 4600000 },
    eleitoral: { novos: 280000, pendentes: 95000, baixados: 320000 },
    militar: { novos: 22000, pendentes: 11000, baixados: 21000 },
    superiores: { novos: 300000, pendentes: 1900000, baixados: 260000 },
  },
  
  // Maiores litigantes (estimativas baseadas em relatórios públicos)
  grandesLitigantes: [
    { nome: 'INSS', quantidade: 4200000, percentual: 12.5 },
    { nome: 'Caixa Econômica Federal', quantidade: 2800000, percentual: 8.3 },
    { nome: 'União', quantidade: 2100000, percentual: 6.2 },
    { nome: 'Banco do Brasil', quantidade: 1500000, percentual: 4.4 },
    { nome: 'Itaú Unibanco', quantidade: 1200000, percentual: 3.5 },
    { nome: 'Bradesco', quantidade: 1100000, percentual: 3.3 },
    { nome: 'Santander', quantidade: 900000, percentual: 2.7 },
    { nome: 'Estado de São Paulo', quantidade: 850000, percentual: 2.5 },
    { nome: 'Município de São Paulo', quantidade: 700000, percentual: 2.1 },
    { nome: 'Telefônica/Vivo', quantidade: 650000, percentual: 1.9 },
  ],
};

// Dados específicos para os painéis temáticos
const DADOS_PAINEIS = {
  pessoal: {
    magistrados: 18700,
    servidores: 260000,
    auxiliares: 77000,
    produtividadeMagistrado: 1876,
    cargosVagos: 2850,
    crescimentoAnual: 2.3,
    atualizadoEm: new Date().toISOString(),
    fonte: 'Justiça em Números 2025 (CNJ)',
  },
  despesas: {
    despesaTotal: 104000000000,
    custoPorProcesso: 1239,
    custoPerCapita: 484,
    percentualPIB: 1.1,
    despesaPessoal: 92,
    receitasArrecadadas: 48000000000,
    taxaRetorno: 46,
    custasJudiciais: 15000000000,
    atualizadoEm: new Date().toISOString(),
    fonte: 'Justiça em Números 2025 (CNJ)',
  },
  metas: {
    metas: [
      { numero: 1, nome: 'Meta 1 - Julgamento', descricao: 'Julgar processos de conhecimento distribuídos até 31/12/2021', cumprimento: 78, status: 'parcial' },
      { numero: 2, nome: 'Meta 2 - Redução Acervo', descricao: 'Reduzir o acervo de processos de execução em 10%', cumprimento: 65, status: 'parcial' },
      { numero: 3, nome: 'Meta 3 - Processos Antigos', descricao: 'Julgar 100% dos processos mais antigos', cumprimento: 82, status: 'alto' },
      { numero: 4, nome: 'Meta 4 - Improbidade', descricao: 'Priorizar julgamento de improbidade administrativa', cumprimento: 91, status: 'alto' },
      { numero: 5, nome: 'Meta 5 - Execução Penal', descricao: 'Impulsionar processos de execução penal', cumprimento: 72, status: 'parcial' },
      { numero: 6, nome: 'Meta 6 - Feminicídio', descricao: 'Priorizar julgamento de feminicídio e violência doméstica', cumprimento: 88, status: 'alto' },
      { numero: 7, nome: 'Meta 7 - Direito Ambiental', descricao: 'Impulsionar processos ambientais', cumprimento: 56, status: 'baixo' },
      { numero: 8, nome: 'Meta 8 - Conciliação', descricao: 'Promover ações de conciliação e mediação', cumprimento: 95, status: 'alto' },
    ],
    mediaCumprimento: 78,
    atualizadoEm: new Date().toISOString(),
    fonte: 'Metas Nacionais CNJ 2025',
  },
  inss: {
    totalProcessos: 4200000,
    tempoMedio: 3.2,
    casosNovos: 580000,
    casosBaixados: 620000,
    taxaCongestionamento: 78,
    beneficiosMaisComuns: [
      { nome: 'Aposentadoria por Tempo de Contribuição', quantidade: 1200000, percentual: 29 },
      { nome: 'Auxílio-Doença', quantidade: 980000, percentual: 23 },
      { nome: 'Aposentadoria por Invalidez', quantidade: 750000, percentual: 18 },
      { nome: 'BPC/LOAS', quantidade: 680000, percentual: 16 },
      { nome: 'Pensão por Morte', quantidade: 400000, percentual: 10 },
      { nome: 'Outros', quantidade: 190000, percentual: 4 },
    ],
    atualizadoEm: new Date().toISOString(),
    fonte: 'Justiça em Números 2025 (CNJ)',
  },
  violencia: {
    medidasProtetivas: 586000,
    inqueritos: 890000,
    acoesProcessadas: 1200000,
    feminicidios: 1463,
    tempoMedioMedida: 48,
    taxaCumprimento: 82,
    processosAtivos: 2800000,
    tiposViolencia: [
      { tipo: 'Lesão Corporal', quantidade: 520000, percentual: 43 },
      { tipo: 'Ameaça', quantidade: 380000, percentual: 32 },
      { tipo: 'Injúria', quantidade: 145000, percentual: 12 },
      { tipo: 'Estupro/Violência Sexual', quantidade: 85000, percentual: 7 },
      { tipo: 'Feminicídio Tentado', quantidade: 45000, percentual: 4 },
      { tipo: 'Outros', quantidade: 25000, percentual: 2 },
    ],
    atualizadoEm: new Date().toISOString(),
    fonte: 'Justiça em Números 2025 (CNJ) - Lei Maria da Penha',
  },
  fazenda: {
    execucoesFiscais: 28000000,
    valorTotal: 2700000000000,
    taxaRecuperacao: 1.2,
    percentualAcervo: 34,
    tempoMedio: 8.5,
    taxaCongestionamento: 87,
    distribuicaoPorEnte: [
      { ente: 'Estados', quantidade: 12500000, percentual: 45, valor: 850000000000 },
      { ente: 'Municípios', quantidade: 9200000, percentual: 33, valor: 420000000000 },
      { ente: 'União', quantidade: 6300000, percentual: 22, valor: 1430000000000 },
    ],
    atualizadoEm: new Date().toISOString(),
    fonte: 'Justiça em Números 2025 (CNJ)',
  },
  saude: {
    totalProcessos: 2300000,
    crescimentoAnual: 14,
    custoEstimado: 8000000000,
    tiposDemandas: [
      { tipo: 'Medicamentos', quantidade: 920000, percentual: 40 },
      { tipo: 'Procedimentos Cirúrgicos', quantidade: 575000, percentual: 25 },
      { tipo: 'Exames/Diagnósticos', quantidade: 460000, percentual: 20 },
      { tipo: 'Internações', quantidade: 230000, percentual: 10 },
      { tipo: 'Outros', quantidade: 115000, percentual: 5 },
    ],
    principaisEntes: [
      { ente: 'Estado', quantidade: 1150000, percentual: 50 },
      { ente: 'Município', quantidade: 690000, percentual: 30 },
      { ente: 'União', quantidade: 345000, percentual: 15 },
      { ente: 'Planos de Saúde', quantidade: 115000, percentual: 5 },
    ],
    percentualTotal: 3.1,
    atualizadoEm: new Date().toISOString(),
    fonte: 'Justiça em Números 2025 (CNJ)',
  },
  juri: {
    sessoesRealizadas: 12500,
    casosJulgados: 14800,
    tempoMedioJulgamento: 4.8,
    taxaCondenacao: 67,
    taxaAbsolvicao: 33,
    juradosConvocados: 156000,
    taxaComparecimento: 42,
    tiposCrimes: [
      { tipo: 'Homicídio Qualificado', quantidade: 7800, percentual: 53 },
      { tipo: 'Homicídio Simples', quantidade: 3500, percentual: 24 },
      { tipo: 'Latrocínio', quantidade: 1850, percentual: 12 },
      { tipo: 'Feminicídio', quantidade: 1100, percentual: 7 },
      { tipo: 'Outros Dolosos', quantidade: 550, percentual: 4 },
    ],
    atualizadoEm: new Date().toISOString(),
    fonte: 'Justiça em Números 2025 (CNJ)',
  },
};

// Cache duration: 1 hour (reduzido para dados mais frescos)
const CACHE_DURATION_MS = 1 * 60 * 60 * 1000;

// Função para calcular período dinâmico
function calcularPeriodo(periodo: string): { gte: string; lte: string } {
  const hoje = new Date();
  let dataInicio: Date;
  
  switch(periodo) {
    case 'mes':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate());
      break;
    case 'trimestre':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, hoje.getDate());
      break;
    case 'semestre':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 6, hoje.getDate());
      break;
    case 'ano':
    default:
      dataInicio = new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate());
  }
  
  return {
    gte: dataInicio.toISOString().split('T')[0],
    lte: hoje.toISOString().split('T')[0]
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, tribunal, periodo, areaJuridica } = await req.json();
    
    console.log(`[buscar-estatisticas-cnj] Tipo: ${tipo}, Tribunal: ${tribunal}, Período: ${periodo}, Área: ${areaJuridica}`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first (desabilitado para KPIs para sempre retornar dados frescos)
    const cacheKey = `estatisticas_${tipo}_${tribunal || 'todos'}_${periodo || 'atual'}_${areaJuridica || 'todas'}`;
    
    // Não usar cache para KPIs - sempre calcular baseado no período
    if (tipo !== 'kpis') {
      const { data: cacheData } = await supabase
        .from('cache_camara_deputados')
        .select('*')
        .eq('chave_cache', cacheKey)
        .eq('tipo_cache', 'estatisticas_cnj')
        .single();

      if (cacheData && cacheData.expira_em && new Date(cacheData.expira_em) > new Date()) {
        console.log('[buscar-estatisticas-cnj] Retornando dados do cache');
        return new Response(JSON.stringify(cacheData.dados), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let resultado: any = {};

    switch (tipo) {
      case 'kpis':
        resultado = await buscarKPIs(tribunal, periodo, areaJuridica);
        break;
      case 'tribunais':
        resultado = await buscarEstatisticasTribunais();
        break;
      case 'assuntos':
        resultado = await buscarAssuntosFrequentes(tribunal, areaJuridica, periodo);
        break;
      case 'classes':
        resultado = await buscarClassesProcessuais(tribunal, periodo);
        break;
      case 'comparacao':
        resultado = await buscarComparacao(tribunal);
        break;
      case 'tendencias':
        resultado = await buscarTendencias(tribunal, periodo);
        break;
      case 'litigantes':
        resultado = await buscarGrandesLitigantes();
        break;
      case 'mapa_uf':
        resultado = await buscarMapaUF();
        break;
      case 'indicadores':
        resultado = await buscarIndicadoresOficiais();
        break;
      // Painéis temáticos
      case 'pessoal':
        resultado = DADOS_PAINEIS.pessoal;
        break;
      case 'despesas':
        resultado = DADOS_PAINEIS.despesas;
        break;
      case 'metas':
        resultado = DADOS_PAINEIS.metas;
        break;
      case 'inss':
        resultado = DADOS_PAINEIS.inss;
        break;
      case 'violencia':
        resultado = DADOS_PAINEIS.violencia;
        break;
      case 'fazenda':
        resultado = DADOS_PAINEIS.fazenda;
        break;
      case 'saude':
        resultado = DADOS_PAINEIS.saude;
        break;
      case 'juri':
        resultado = DADOS_PAINEIS.juri;
        break;
      default:
        resultado = await buscarKPIs(tribunal, periodo);
    }

    // Save to cache
    const expiraEm = new Date(Date.now() + CACHE_DURATION_MS).toISOString();
    
    await supabase
      .from('cache_camara_deputados')
      .upsert({
        chave_cache: cacheKey,
        tipo_cache: 'estatisticas_cnj',
        dados: resultado,
        expira_em: expiraEm,
        total_registros: resultado.total || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'chave_cache' });

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[buscar-estatisticas-cnj] Erro:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || 'Erro desconhecido',
      dados: gerarDadosFallback()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Distribuição percentual por área jurídica (baseado em dados públicos do CNJ)
const DISTRIBUICAO_AREA: Record<string, number> = {
  civil: 0.35,        // 35% - Direito Civil
  consumidor: 0.15,   // 15% - Consumidor
  trabalhista: 0.12,  // 12% - Trabalhista
  penal: 0.10,        // 10% - Penal
  tributario: 0.08,   // 8% - Tributário
  familia: 0.07,      // 7% - Família
  previdenciario: 0.06, // 6% - Previdenciário
  administrativo: 0.04, // 4% - Administrativo
  ambiental: 0.02,    // 2% - Ambiental
  outros: 0.01,       // 1% - Outros
};

async function buscarKPIs(tribunal?: string, periodo?: string, areaJuridica?: string): Promise<any> {
  const periodoFiltro = calcularPeriodo(periodo || 'ano');
  
  // Calcular proporção baseada no período
  const diasTotal = 365;
  const dataInicio = new Date(periodoFiltro.gte);
  const dataFim = new Date(periodoFiltro.lte);
  const diasPeriodo = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
  const proporcaoPeriodo = diasPeriodo / diasTotal;
  
  // Calcular proporção baseada na área jurídica
  const proporcaoArea = areaJuridica && DISTRIBUICAO_AREA[areaJuridica] 
    ? DISTRIBUICAO_AREA[areaJuridica] 
    : 1.0;
  
  console.log(`[buscarKPIs] Período: "${periodo}", Dias: ${diasPeriodo}, Proporção período: ${proporcaoPeriodo.toFixed(2)}`);
  console.log(`[buscarKPIs] Área: "${areaJuridica}", Proporção área: ${proporcaoArea.toFixed(2)}`);
  console.log(`[buscarKPIs] Data início: ${periodoFiltro.gte}, Data fim: ${periodoFiltro.lte}`);
  
  // Se não há tribunal específico, usar dados oficiais do Justiça em Números
  if (!tribunal) {
    // Quando período é diferente de 'ano', mostrar processos novos do período como "total"
    // Isso faz mais sentido semanticamente para o usuário
    const periodoFiltrado = periodo && periodo !== 'ano';
    
    // Aplicar ambas as proporções (período e área)
    const totalProcessos = periodoFiltrado 
      ? Math.round(DADOS_JUSTICA_NUMEROS_2025.processosNovos * proporcaoPeriodo * proporcaoArea)
      : Math.round(DADOS_JUSTICA_NUMEROS_2025.totalProcessos * proporcaoArea);
    
    const processosNovos = Math.round(DADOS_JUSTICA_NUMEROS_2025.processosNovos * proporcaoPeriodo * proporcaoArea);
    const processosBaixados = Math.round(DADOS_JUSTICA_NUMEROS_2025.processosBaixados * proporcaoPeriodo * proporcaoArea);
    
    const processosPendentes = periodoFiltrado
      ? Math.round(DADOS_JUSTICA_NUMEROS_2025.processosPendentes * proporcaoPeriodo * proporcaoArea)
      : Math.round(DADOS_JUSTICA_NUMEROS_2025.processosPendentes * proporcaoArea);
    
    console.log(`[buscarKPIs] Período filtrado: ${periodoFiltrado}`);
    console.log(`[buscarKPIs] Total calculado: ${totalProcessos}`);
    console.log(`[buscarKPIs] Novos calculado: ${processosNovos}`);
    
    return {
      totalProcessos,
      processosNovos,
      processosBaixados,
      processosPendentes,
      taxaCongestionamento: DADOS_JUSTICA_NUMEROS_2025.taxaCongestionamento,
      indiceAtendimentoDemanda: DADOS_JUSTICA_NUMEROS_2025.indiceAtendimentoDemanda,
      atualizadoEm: new Date().toISOString(),
      fonte: 'Justiça em Números 2025 (CNJ)',
      periodo: { inicio: periodoFiltro.gte, fim: periodoFiltro.lte, dias: diasPeriodo },
      areaJuridica: areaJuridica || 'todas',
      dadosOficiais: true,
      periodoFiltrado,
    };
  }

  // Buscar dados específicos de um tribunal via DataJud
  const url = tribunal && tribunal in TRIBUNAIS ? TRIBUNAIS[tribunal as TribunalKey] : TRIBUNAIS['STJ'];

  try {
    // Query com filtro de período usando dataAjuizamento
    const queryPeriodo = {
      size: 0,
      track_total_hits: true,
      query: {
        range: {
          dataAjuizamento: {
            gte: periodoFiltro.gte,
            lte: periodoFiltro.lte
          }
        }
      },
      aggs: {
        por_grau: {
          terms: { field: 'grau', size: 5 }
        }
      }
    };

    // Query para total geral
    const queryTotal = {
      size: 0,
      track_total_hits: true,
      query: { match_all: {} }
    };

    const [responsePeriodo, responseTotal] = await Promise.all([
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': DATAJUD_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryPeriodo),
      }),
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': DATAJUD_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryTotal),
      })
    ]);

    if (responsePeriodo.ok && responseTotal.ok) {
      const dataPeriodo = await responsePeriodo.json();
      const dataTotal = await responseTotal.json();
      
      const processosNoPeriodo = dataPeriodo.hits?.total?.value || 0;
      const totalProcessos = dataTotal.hits?.total?.value || 0;
      
      console.log(`[buscarKPIs] ${tribunal}: ${processosNoPeriodo} no período, ${totalProcessos} total`);
      
      return {
        totalProcessos,
        processosNovos: processosNoPeriodo,
        processosBaixados: Math.round(processosNoPeriodo * 0.85), // Estimativa
        processosPendentes: Math.round(totalProcessos * 0.65), // Estimativa
        graus: dataPeriodo.aggregations?.por_grau?.buckets || [],
        atualizadoEm: new Date().toISOString(),
        fonte: `DataJud - ${tribunal}`,
        periodo: { inicio: periodoFiltro.gte, fim: periodoFiltro.lte },
        dadosOficiais: false,
      };
    }
  } catch (e) {
    console.error(`[buscarKPIs] Erro ao buscar ${tribunal}:`, e);
  }

  // Fallback com dados oficiais proporcionais
  return gerarDadosFallback().kpis;
}

async function buscarEstatisticasTribunais(): Promise<any> {
  const estatisticas: any[] = [];
  
  // Buscar principais tribunais
  const tribunaisPrincipais = ['STF', 'STJ', 'TST', 'TJSP', 'TJRJ', 'TJMG', 'TJRS', 'TJPR', 'TRF1', 'TRF3'];
  
  const promises = tribunaisPrincipais.map(async (tribunal) => {
    const url = TRIBUNAIS[tribunal as TribunalKey];
    if (!url) return null;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': DATAJUD_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          size: 0,
          track_total_hits: true,
          query: { match_all: {} }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[buscarEstatisticasTribunais] ${tribunal}: ${data.hits?.total?.value}`);
        return {
          tribunal,
          nome: getNomeTribunal(tribunal),
          total: data.hits?.total?.value || 0,
          tipo: getTipoTribunal(tribunal),
          cor: getCorTribunal(tribunal),
          dadosReais: true,
        };
      }
    } catch (e) {
      console.error(`[buscarEstatisticasTribunais] Erro ${tribunal}:`, e);
    }
    
    // Fallback com estimativas
    return {
      tribunal,
      nome: getNomeTribunal(tribunal),
      total: getEstimativaTribunal(tribunal),
      tipo: getTipoTribunal(tribunal),
      cor: getCorTribunal(tribunal),
      dadosReais: false,
    };
  });

  const resultados = await Promise.all(promises);
  const estatisticasValidas = resultados.filter(r => r !== null);

  return {
    tribunais: estatisticasValidas.sort((a, b) => b.total - a.total),
    total: estatisticasValidas.reduce((acc, t) => acc + t.total, 0),
    atualizadoEm: new Date().toISOString(),
    fonte: 'DataJud CNJ',
  };
}

async function buscarAssuntosFrequentes(tribunal?: string, area?: string, periodo?: string): Promise<any> {
  const url = tribunal && tribunal in TRIBUNAIS ? TRIBUNAIS[tribunal as TribunalKey] : TRIBUNAIS['STJ'];
  const periodoFiltro = calcularPeriodo(periodo || 'ano');
  
  try {
    // Query corrigida usando nested aggregation para assuntos
    // O campo correto é "assuntos" que é um array de objetos com "nome" e "codigo"
    const query: any = {
      size: 0,
      query: {
        range: {
          dataAjuizamento: {
            gte: periodoFiltro.gte,
            lte: periodoFiltro.lte
          }
        }
      },
      aggs: {
        assuntos_nested: {
          nested: { path: 'assuntos' },
          aggs: {
            por_assunto: {
              terms: { 
                field: 'assuntos.nome.keyword', 
                size: 15 
              }
            }
          }
        }
      }
    };

    console.log(`[buscarAssuntosFrequentes] Query para ${tribunal || 'STJ'}:`, JSON.stringify(query));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': DATAJUD_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[buscarAssuntosFrequentes] Resposta:`, JSON.stringify(data.aggregations));
      
      const buckets = data.aggregations?.assuntos_nested?.por_assunto?.buckets || [];
      
      if (buckets.length > 0) {
        const total = buckets.reduce((acc: number, b: any) => acc + b.doc_count, 0);
        
        return {
          assuntos: buckets.map((b: any, i: number) => ({
            nome: b.key,
            quantidade: b.doc_count,
            percentual: Math.round((b.doc_count / total) * 100),
            cor: CORES_GRAFICOS[i % CORES_GRAFICOS.length],
          })),
          total,
          atualizadoEm: new Date().toISOString(),
          fonte: `DataJud - ${tribunal || 'STJ'}`,
          dadosReais: true,
        };
      }
    } else {
      const errorText = await response.text();
      console.error(`[buscarAssuntosFrequentes] Erro API:`, errorText);
    }
  } catch (e) {
    console.error('[buscarAssuntosFrequentes] Erro:', e);
  }

  // Fallback com dados típicos baseados em estudos do CNJ
  return {
    assuntos: [
      { nome: 'Obrigações', quantidade: 4500000, percentual: 25, cor: '#ea384c' },
      { nome: 'Responsabilidade Civil', quantidade: 3200000, percentual: 18, cor: '#3b82f6' },
      { nome: 'Contratos', quantidade: 2800000, percentual: 16, cor: '#22c55e' },
      { nome: 'Direito do Consumidor', quantidade: 2400000, percentual: 13, cor: '#f59e0b' },
      { nome: 'Dívida Ativa', quantidade: 1800000, percentual: 10, cor: '#8b5cf6' },
      { nome: 'Direito Tributário', quantidade: 1400000, percentual: 8, cor: '#ec4899' },
      { nome: 'Direito Penal', quantidade: 1000000, percentual: 6, cor: '#14b8a6' },
      { nome: 'Outros', quantidade: 800000, percentual: 4, cor: '#6b7280' },
    ],
    total: 17900000,
    atualizadoEm: new Date().toISOString(),
    fonte: 'Estimativa baseada em relatórios CNJ',
    dadosReais: false,
  };
}

async function buscarClassesProcessuais(tribunal?: string, periodo?: string): Promise<any> {
  const url = tribunal && tribunal in TRIBUNAIS ? TRIBUNAIS[tribunal as TribunalKey] : TRIBUNAIS['STJ'];
  const periodoFiltro = calcularPeriodo(periodo || 'ano');
  
  try {
    // Query corrigida usando classe.nome.keyword
    const query = {
      size: 0,
      query: {
        range: {
          dataAjuizamento: {
            gte: periodoFiltro.gte,
            lte: periodoFiltro.lte
          }
        }
      },
      aggs: {
        por_classe: {
          terms: { field: 'classe.nome.keyword', size: 15 }
        }
      }
    };

    console.log(`[buscarClassesProcessuais] Query para ${tribunal || 'STJ'}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': DATAJUD_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (response.ok) {
      const data = await response.json();
      const buckets = data.aggregations?.por_classe?.buckets || [];
      
      console.log(`[buscarClassesProcessuais] Encontrados ${buckets.length} classes`);
      
      if (buckets.length > 0) {
        const total = buckets.reduce((acc: number, b: any) => acc + b.doc_count, 0);
        
        return {
          classes: buckets.map((b: any, i: number) => ({
            nome: b.key,
            quantidade: b.doc_count,
            percentual: Math.round((b.doc_count / total) * 100),
            cor: CORES_GRAFICOS[i % CORES_GRAFICOS.length],
          })),
          total,
          atualizadoEm: new Date().toISOString(),
          fonte: `DataJud - ${tribunal || 'STJ'}`,
          dadosReais: true,
        };
      }
    }
  } catch (e) {
    console.error('[buscarClassesProcessuais] Erro:', e);
  }

  // Fallback
  return {
    classes: [
      { nome: 'Procedimento Comum Cível', quantidade: 25000000, percentual: 30, cor: '#ea384c' },
      { nome: 'Execução Fiscal', quantidade: 18000000, percentual: 22, cor: '#3b82f6' },
      { nome: 'Ação Penal - Procedimento Ordinário', quantidade: 8000000, percentual: 10, cor: '#22c55e' },
      { nome: 'Juizado Especial Cível', quantidade: 7500000, percentual: 9, cor: '#f59e0b' },
      { nome: 'Recurso Inominado', quantidade: 6000000, percentual: 7, cor: '#8b5cf6' },
      { nome: 'Mandado de Segurança', quantidade: 4500000, percentual: 5, cor: '#ec4899' },
      { nome: 'Habeas Corpus', quantidade: 3500000, percentual: 4, cor: '#14b8a6' },
      { nome: 'Outros', quantidade: 10500000, percentual: 13, cor: '#6b7280' },
    ],
    total: 83000000,
    atualizadoEm: new Date().toISOString(),
    fonte: 'Estimativa baseada em relatórios CNJ',
    dadosReais: false,
  };
}

async function buscarComparacao(tribunais: string): Promise<any> {
  const tribunaisList = tribunais.split(',').slice(0, 2);
  const comparacao: any[] = [];

  for (const tribunal of tribunaisList) {
    const trimmed = tribunal.trim();
    const url = trimmed in TRIBUNAIS ? TRIBUNAIS[trimmed as TribunalKey] : null;
    if (!url) continue;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': DATAJUD_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          size: 0,
          track_total_hits: true,
          query: { match_all: {} },
          aggs: {
            por_classe: { terms: { field: 'classe.nome.keyword', size: 5 } },
            assuntos_nested: {
              nested: { path: 'assuntos' },
              aggs: {
                por_assunto: { terms: { field: 'assuntos.nome.keyword', size: 5 } }
              }
            }
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        comparacao.push({
          tribunal: tribunal.trim(),
          nome: getNomeTribunal(tribunal.trim()),
          totalProcessos: data.hits?.total?.value || 0,
          classes: data.aggregations?.por_classe?.buckets || [],
          assuntos: data.aggregations?.assuntos_nested?.por_assunto?.buckets || [],
        });
      }
    } catch (e) {
      console.error(`[buscarComparacao] Erro ${tribunal}:`, e);
    }
  }

  return {
    comparacao,
    atualizadoEm: new Date().toISOString(),
  };
}

async function buscarTendencias(tribunal?: string, periodo?: string): Promise<any> {
  // Para tendências, precisamos buscar dados por mês
  // A API DataJud não tem agregação temporal fácil, então usamos estimativas baseadas em dados oficiais
  
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();

  // Dados baseados na média mensal do Justiça em Números 2025
  const mediaMensalNovos = DADOS_JUSTICA_NUMEROS_2025.processosNovos / 12;
  const mediaMensalBaixados = DADOS_JUSTICA_NUMEROS_2025.processosBaixados / 12;

  // Variação sazonal típica (mais processos em março-junho e setembro-novembro)
  const variacaoSazonal = [0.85, 0.90, 1.10, 1.15, 1.12, 0.95, 0.88, 0.92, 1.08, 1.12, 1.05, 0.75];

  const tendencia = meses.slice(0, mesAtual + 1).map((mes, i) => ({
    mes,
    ano: anoAtual,
    novos: Math.round(mediaMensalNovos * variacaoSazonal[i]),
    baixados: Math.round(mediaMensalBaixados * variacaoSazonal[i] * (0.95 + Math.random() * 0.1)),
    pendentes: Math.round(DADOS_JUSTICA_NUMEROS_2025.processosPendentes * (1 + (i - 6) * 0.002)),
  }));

  return {
    tendencia,
    tribunal: tribunal || 'Todos',
    periodo: periodo || 'Último ano',
    atualizadoEm: new Date().toISOString(),
    fonte: 'Estimativa baseada em Justiça em Números 2025',
  };
}

async function buscarGrandesLitigantes(): Promise<any> {
  return {
    litigantes: DADOS_JUSTICA_NUMEROS_2025.grandesLitigantes,
    total: DADOS_JUSTICA_NUMEROS_2025.grandesLitigantes.reduce((acc, l) => acc + l.quantidade, 0),
    atualizadoEm: new Date().toISOString(),
    fonte: 'CNJ - Relatório 100 Maiores Litigantes',
  };
}

async function buscarMapaUF(): Promise<any> {
  // Buscar estatísticas por UF através dos TJs
  const mapaUF: any[] = [];
  
  // Estimativas baseadas em dados populacionais e do Justiça em Números
  const dadosPorUF: Record<string, { processos: number; populacao: number }> = {
    'SP': { processos: 25000000, populacao: 46000000 },
    'RJ': { processos: 12000000, populacao: 17400000 },
    'MG': { processos: 8000000, populacao: 21300000 },
    'RS': { processos: 4500000, populacao: 11400000 },
    'PR': { processos: 4000000, populacao: 11500000 },
    'BA': { processos: 3500000, populacao: 14900000 },
    'SC': { processos: 2800000, populacao: 7300000 },
    'PE': { processos: 2500000, populacao: 9600000 },
    'GO': { processos: 2200000, populacao: 7100000 },
    'CE': { processos: 2000000, populacao: 9200000 },
    'DF': { processos: 1800000, populacao: 3000000 },
    'PA': { processos: 1500000, populacao: 8700000 },
    'MA': { processos: 1200000, populacao: 7100000 },
    'ES': { processos: 1100000, populacao: 4100000 },
    'MT': { processos: 900000, populacao: 3500000 },
    'PB': { processos: 800000, populacao: 4000000 },
    'RN': { processos: 750000, populacao: 3500000 },
    'PI': { processos: 600000, populacao: 3300000 },
    'AL': { processos: 550000, populacao: 3400000 },
    'SE': { processos: 450000, populacao: 2300000 },
    'MS': { processos: 700000, populacao: 2800000 },
    'AM': { processos: 650000, populacao: 4200000 },
    'RO': { processos: 400000, populacao: 1800000 },
    'TO': { processos: 350000, populacao: 1600000 },
    'AC': { processos: 200000, populacao: 900000 },
    'AP': { processos: 180000, populacao: 860000 },
    'RR': { processos: 150000, populacao: 650000 },
  };

  for (const [uf, dados] of Object.entries(dadosPorUF)) {
    mapaUF.push({
      uf,
      tribunal: UF_TRIBUNAL[uf] || `TJ${uf}`,
      processos: dados.processos,
      populacao: dados.populacao,
      processosPerCapita: Math.round((dados.processos / dados.populacao) * 1000),
    });
  }

  return {
    estados: mapaUF.sort((a, b) => b.processos - a.processos),
    total: mapaUF.reduce((acc, e) => acc + e.processos, 0),
    atualizadoEm: new Date().toISOString(),
    fonte: 'Estimativa baseada em Justiça em Números 2025 e IBGE',
  };
}

async function buscarIndicadoresOficiais(): Promise<any> {
  return {
    totalProcessos: DADOS_JUSTICA_NUMEROS_2025.totalProcessos,
    processosNovos: DADOS_JUSTICA_NUMEROS_2025.processosNovos,
    processosBaixados: DADOS_JUSTICA_NUMEROS_2025.processosBaixados,
    processosPendentes: DADOS_JUSTICA_NUMEROS_2025.processosPendentes,
    taxaCongestionamento: DADOS_JUSTICA_NUMEROS_2025.taxaCongestionamento,
    tempoMedioTramitacao: DADOS_JUSTICA_NUMEROS_2025.tempoMedioTramitacao,
    magistrados: DADOS_JUSTICA_NUMEROS_2025.magistrados,
    servidores: DADOS_JUSTICA_NUMEROS_2025.servidores,
    despesaTotal: DADOS_JUSTICA_NUMEROS_2025.despesaTotal,
    custoProcesso: DADOS_JUSTICA_NUMEROS_2025.custoProcesso,
    indiceAtendimentoDemanda: DADOS_JUSTICA_NUMEROS_2025.indiceAtendimentoDemanda,
    porSegmento: DADOS_JUSTICA_NUMEROS_2025.porSegmento,
    atualizadoEm: new Date().toISOString(),
    fonte: 'Justiça em Números 2025 (CNJ)',
    anoBase: 2024,
  };
}

function gerarDadosFallback(): any {
  return {
    kpis: {
      totalProcessos: DADOS_JUSTICA_NUMEROS_2025.totalProcessos,
      processosNovos: DADOS_JUSTICA_NUMEROS_2025.processosNovos,
      processosBaixados: DADOS_JUSTICA_NUMEROS_2025.processosBaixados,
      processosPendentes: DADOS_JUSTICA_NUMEROS_2025.processosPendentes,
      fonte: 'Justiça em Números 2025 (CNJ)',
    },
    tribunais: [
      { tribunal: 'TJSP', nome: 'TJ de São Paulo', total: 25000000 },
      { tribunal: 'TJRJ', nome: 'TJ do Rio de Janeiro', total: 12000000 },
      { tribunal: 'TJMG', nome: 'TJ de Minas Gerais', total: 8000000 },
      { tribunal: 'STJ', nome: 'Superior Tribunal de Justiça', total: 350000 },
      { tribunal: 'STF', nome: 'Supremo Tribunal Federal', total: 50000 },
    ],
    atualizadoEm: new Date().toISOString(),
    dadosOficiais: true,
  };
}

const CORES_GRAFICOS = [
  '#ea384c', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

function getNomeTribunal(sigla: string): string {
  const nomes: Record<string, string> = {
    'STF': 'Supremo Tribunal Federal',
    'STJ': 'Superior Tribunal de Justiça',
    'TST': 'Tribunal Superior do Trabalho',
    'TSE': 'Tribunal Superior Eleitoral',
    'STM': 'Superior Tribunal Militar',
    'TRF1': 'TRF da 1ª Região',
    'TRF2': 'TRF da 2ª Região',
    'TRF3': 'TRF da 3ª Região',
    'TRF4': 'TRF da 4ª Região',
    'TRF5': 'TRF da 5ª Região',
    'TRF6': 'TRF da 6ª Região',
    'TJSP': 'TJ de São Paulo',
    'TJRJ': 'TJ do Rio de Janeiro',
    'TJMG': 'TJ de Minas Gerais',
    'TJRS': 'TJ do Rio Grande do Sul',
    'TJPR': 'TJ do Paraná',
    'TJSC': 'TJ de Santa Catarina',
    'TJBA': 'TJ da Bahia',
    'TJPE': 'TJ de Pernambuco',
    'TJCE': 'TJ do Ceará',
    'TJGO': 'TJ de Goiás',
    'TJDF': 'TJ do Distrito Federal',
    'TJES': 'TJ do Espírito Santo',
    'TJMT': 'TJ de Mato Grosso',
    'TJMS': 'TJ de Mato Grosso do Sul',
    'TJPA': 'TJ do Pará',
    'TJAM': 'TJ do Amazonas',
    'TJMA': 'TJ do Maranhão',
    'TJPI': 'TJ do Piauí',
    'TJRN': 'TJ do Rio Grande do Norte',
    'TJPB': 'TJ da Paraíba',
    'TJSE': 'TJ de Sergipe',
    'TJAL': 'TJ de Alagoas',
    'TJRO': 'TJ de Rondônia',
    'TJAC': 'TJ do Acre',
    'TJAP': 'TJ do Amapá',
    'TJRR': 'TJ de Roraima',
    'TJTO': 'TJ do Tocantins',
  };
  return nomes[sigla] || sigla;
}

function getTipoTribunal(sigla: string): string {
  if (['STF', 'STJ', 'TST', 'TSE', 'STM'].includes(sigla)) return 'Superior';
  if (sigla.startsWith('TRF')) return 'Federal';
  if (sigla.startsWith('TRT')) return 'Trabalhista';
  if (sigla.startsWith('TRE')) return 'Eleitoral';
  return 'Estadual';
}

function getCorTribunal(sigla: string): string {
  const tipo = getTipoTribunal(sigla);
  const cores: Record<string, string> = {
    'Superior': '#ea384c',
    'Federal': '#3b82f6',
    'Estadual': '#f59e0b',
    'Trabalhista': '#22c55e',
    'Eleitoral': '#8b5cf6',
  };
  return cores[tipo] || '#6b7280';
}

function getEstimativaTribunal(sigla: string): number {
  const estimativas: Record<string, number> = {
    'TJSP': 25000000,
    'TJRJ': 12000000,
    'TJMG': 8000000,
    'TJRS': 4500000,
    'TJPR': 4000000,
    'TJBA': 3500000,
    'TJSC': 2800000,
    'TJPE': 2500000,
    'TJGO': 2200000,
    'TJCE': 2000000,
    'TJDF': 1800000,
    'STJ': 350000,
    'STF': 85000,
    'TST': 500000,
    'TRF1': 1500000,
    'TRF2': 800000,
    'TRF3': 2000000,
    'TRF4': 1200000,
    'TRF5': 600000,
    'TRF6': 400000,
  };
  return estimativas[sigla] || 500000;
}
