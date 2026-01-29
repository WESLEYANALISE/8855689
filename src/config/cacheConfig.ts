/**
 * Configuração de Cache por Tipo de Dado
 * Stale times otimizados para cada categoria de conteúdo
 */

export const CACHE_STALE_TIMES = {
  // Dados que mudam frequentemente (5 minutos)
  REALTIME: 1000 * 60 * 5,
  
  // Dados que mudam algumas vezes ao dia (30 minutos)
  FREQUENT: 1000 * 60 * 30,
  
  // Dados que mudam diariamente (1 hora)
  HOURLY: 1000 * 60 * 60,
  
  // Dados que mudam raramente (6 horas)
  INFREQUENT: 1000 * 60 * 60 * 6,
  
  // Dados praticamente estáticos (24 horas)
  STATIC: 1000 * 60 * 60 * 24,
} as const;

/**
 * Mapeamento de queries para seus stale times apropriados
 */
export const QUERY_STALE_CONFIG: Record<string, number> = {
  // Notícias - mudam frequentemente
  'noticias': CACHE_STALE_TIMES.REALTIME,
  'noticias_juridicas': CACHE_STALE_TIMES.REALTIME,
  'noticias_politicas': CACHE_STALE_TIMES.REALTIME,
  
  // Proposições e votações - mudam algumas vezes ao dia
  'proposicoes': CACHE_STALE_TIMES.FREQUENT,
  'votacoes': CACHE_STALE_TIMES.FREQUENT,
  'eventos_camara': CACHE_STALE_TIMES.FREQUENT,
  
  // Cursos e aulas - mudam diariamente
  'cursos': CACHE_STALE_TIMES.HOURLY,
  'audioaulas': CACHE_STALE_TIMES.HOURLY,
  'videoaulas': CACHE_STALE_TIMES.HOURLY,
  'aulas_interativas': CACHE_STALE_TIMES.HOURLY,
  
  // Conteúdo editorial - muda raramente
  'blogger_juridico': CACHE_STALE_TIMES.INFREQUENT,
  'blogger_politico': CACHE_STALE_TIMES.INFREQUENT,
  'bibliotecas': CACHE_STALE_TIMES.INFREQUENT,
  
  // Legislação - praticamente estática
  'artigos': CACHE_STALE_TIMES.STATIC,
  'constituicao': CACHE_STALE_TIMES.STATIC,
  'codigos': CACHE_STALE_TIMES.STATIC,
  'sumulas': CACHE_STALE_TIMES.STATIC,
  'leis': CACHE_STALE_TIMES.STATIC,
  
  // Deputados e senadores - muda muito raramente
  'deputados': CACHE_STALE_TIMES.STATIC,
  'senadores': CACHE_STALE_TIMES.STATIC,
  'partidos': CACHE_STALE_TIMES.STATIC,
};

/**
 * Obtém o stale time para uma query específica
 * Retorna o default de 10 minutos se não encontrado
 */
export function getStaleTimeForQuery(queryKey: string | string[]): number {
  const key = Array.isArray(queryKey) ? queryKey[0] : queryKey;
  
  // Busca exata
  if (QUERY_STALE_CONFIG[key]) {
    return QUERY_STALE_CONFIG[key];
  }
  
  // Busca por prefixo
  for (const [configKey, staleTime] of Object.entries(QUERY_STALE_CONFIG)) {
    if (key.toLowerCase().includes(configKey.toLowerCase())) {
      return staleTime;
    }
  }
  
  // Default: 10 minutos
  return 1000 * 60 * 10;
}

/**
 * Configuração de cache duration (tempo até considerar stale)
 * vs stale duration (tempo até invalidar completamente)
 */
export const CACHE_DURATION = {
  // Cache válido (fresh)
  FRESH: 1000 * 60 * 60 * 12, // 12 horas
  
  // Cache usável mas precisa revalidar (stale)
  STALE: 1000 * 60 * 60 * 24, // 24 horas
  
  // Cache expirado (deve buscar novo)
  EXPIRED: 1000 * 60 * 60 * 48, // 48 horas
} as const;
