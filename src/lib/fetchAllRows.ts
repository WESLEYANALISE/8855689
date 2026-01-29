import { supabase } from "@/integrations/supabase/client";

interface FetchOptions {
  limit?: number;
  offset?: number;
}

/**
 * Retry com backoff exponencial para queries do Supabase
 */
async function fetchWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Tentativa ${attempt + 1}/${maxRetries} falhou:`, error);
      
      if (attempt < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
        console.log(`⏳ Aguardando ${delay}ms antes de retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

// Tabelas de leis que possuem coluna ordem_artigo
const TABELAS_COM_ORDEM_ARTIGO = new Set([
  'CC - Código Civil',
  'CPC – Código de Processo Civil',
  'CP - Código Penal',
  'CPP – Código de Processo Penal',
  'CF - Constituição Federal',
  'CLT - Consolidação das Leis do Trabalho',
  'CDC – Código de Defesa do Consumidor',
  'CE – Código Eleitoral',
  'CF - Código Florestal',
  'CC - Código de Caça',
  'CP - Código de Pesca',
  'CA - Código de Águas',
  'CDM – Código de Minas',
  'CBA Código Brasileiro de Aeronáutica',
  'CBT Código Brasileiro de Telecomunicações',
  'CCOM – Código Comercial',
  'CDUS - Código de Defesa do Usuário',
  'CPI - Código de Propriedade Industrial',
  'CPM – Código Penal Militar',
  'CPPM – Código de Processo Penal Militar',
  'CTB – Código de Trânsito Brasileiro',
  'CTN – Código Tributário Nacional',
  'ECA – Estatuto da Criança e do Adolescente',
  'EI – Estatuto do Idoso',
  'ED – Estatuto do Desarmamento',
  'EPD – Estatuto da Pessoa com Deficiência',
  'EOAB – Estatuto da Ordem dos Advogados do Brasil',
  'ETJ – Estatuto do Torcedor',
  'EREF – Estatuto do Refugiado',
  'EIG – Estatuto da Igualdade Racial',
  'EMID – Estatuto dos Militares',
  'ECID – Estatuto da Cidade',
  'ETERR – Estatuto da Terra',
  'LEP – Lei de Execuções Penais',
  'LIA – Lei de Improbidade Administrativa',
  'LAC – Lei Anticorrupção',
  'LAM – Lei de Abuso de Autoridade',
  'LCR – Lei de Crimes Ambientais',
  'LDA – Lei de Drogas',
  'LGT – Lei Geral de Telecomunicações',
  'LI – Lei de Interceptação Telefônica',
  'LDB – Lei de Diretrizes e Bases da Educação',
  'LINDB – Lei de Introdução às Normas do Direito Brasileiro',
  'LJ – Lei do Júri',
  'LMS – Lei Maria da Penha',
  'LEI 13869 - Abuso de Autoridade',
  'LEI 13709 - LGPD',
  'LEI 9455 - Lei de Tortura',
  'LEI 9613 - Lavagem de Dinheiro',
  'LEI 8072 - Crimes Hediondos',
  'LEI 8429 - Improbidade Administrativa',
  'LEI 12850 - Organização Criminosa',
  'LEI 10826 - Estatuto do Desarmamento',
  'LEI 8666 - Licitações',
  'LEI 14133 - Nova Lei de Licitações',
  'LEI 11343 - Lei de Drogas',
  'LEI 9784 - Processo Administrativo',
  'LEI 8078 - CDC',
  'LEI 9099 - Juizados Especiais',
  'LEI 8112 - Estatuto dos Servidores',
  'LEI 4737 - Código Eleitoral',
  'LEI 9504 - Lei das Eleições',
  'LEI 7716 - Racismo',
  'LEI 12037 - Identificação Criminal'
]);

/**
 * Retorna a coluna de ordenação correta para uma tabela
 */
function getOrderColumn(tableName: string, requestedOrder: string): string {
  if (TABELAS_COM_ORDEM_ARTIGO.has(tableName) && requestedOrder === 'id') {
    return 'ordem_artigo';
  }
  return requestedOrder;
}

/**
 * Estima o tamanho de uma tabela para decidir estratégia de carregamento
 */
async function estimateTableSize(tableName: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(tableName as any)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error(`Erro ao estimar tamanho da tabela ${tableName}:`, error);
    return 1000;
  }
}

/**
 * Busca direta para tabelas pequenas
 */
async function fetchDirect<T>(tableName: string, orderBy: string = "id"): Promise<T[]> {
  const orderColumn = getOrderColumn(tableName, orderBy);
  
  return fetchWithRetry(async () => {
    const { data, error } = await supabase
      .from(tableName as any)
      .select("*")
      .order(orderColumn as any, { ascending: true });

    if (error) {
      console.error(`Erro ao buscar tabela ${tableName}:`, error);
      throw error;
    }

    return (data || []) as T[];
  });
}

/**
 * Busca paginada para tabelas grandes
 */
async function fetchPaginated<T>(
  tableName: string,
  orderBy: string = "id",
  estimatedSize: number
): Promise<T[]> {
  const orderColumn = getOrderColumn(tableName, orderBy);
  const pageSize = 1000;
  const maxPages = Math.ceil(estimatedSize / pageSize) + 1;
  let from = 0;
  let all: T[] = [];

  for (let i = 0; i < Math.min(maxPages, 50); i++) {
    const batch = await fetchWithRetry(async () => {
      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .order(orderColumn as any, { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error(`Erro ao paginar tabela ${tableName}:`, error);
        throw error;
      }

      return (data || []) as T[];
    });

    all = all.concat(batch);

    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

/**
 * Busca todos os registros com estratégia otimizada
 * - Tabelas pequenas (< 300): busca direta
 * - Tabelas grandes: busca paginada
 */
export async function fetchAllRows<T>(
  tableName: string, 
  orderBy: string = "id",
  options?: FetchOptions
): Promise<T[]> {
  const orderColumn = getOrderColumn(tableName, orderBy);
  
  // Se tem limite específico, busca apenas o necessário
  if (options?.limit) {
    const from = options.offset || 0;
    const to = from + options.limit - 1;

    const { data, error } = await supabase
      .from(tableName as any)
      .select("*")
      .order(orderColumn as any, { ascending: true })
      .range(from, to);

    if (error) {
      console.error(`Erro ao buscar tabela ${tableName}:`, error);
      throw error;
    }

    return (data || []) as T[];
  }

  // Estima tamanho da tabela para decidir estratégia
  const estimatedSize = await estimateTableSize(tableName);

  // Tabelas pequenas: busca direta (mais rápido)
  if (estimatedSize < 300) {
    return fetchDirect<T>(tableName, orderBy);
  }

  // Tabelas grandes: busca paginada
  return fetchPaginated<T>(tableName, orderBy, estimatedSize);
}

// Nova função otimizada para carregamento inicial rápido
export async function fetchInitialRows<T>(
  tableName: string,
  limit: number = 50,
  orderBy: string = "id"
): Promise<T[]> {
  return fetchAllRows<T>(tableName, orderBy, { limit, offset: 0 });
}
