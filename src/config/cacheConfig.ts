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
  'votacoes_camara': CACHE_STALE_TIMES.FREQUENT,
  'votacoes_senado': CACHE_STALE_TIMES.FREQUENT,
  'eventos_camara': CACHE_STALE_TIMES.FREQUENT,
  'materias_senado': CACHE_STALE_TIMES.FREQUENT,
  'agenda_senado': CACHE_STALE_TIMES.FREQUENT,
  
  // Cursos e aulas - cache longo (conteúdo raramente muda)
  'cursos': CACHE_STALE_TIMES.STATIC,
  'cursos_aulas': CACHE_STALE_TIMES.STATIC,
  'cursos_modulos': CACHE_STALE_TIMES.STATIC,
  'audioaulas': CACHE_STALE_TIMES.STATIC,
  'videoaulas': CACHE_STALE_TIMES.STATIC,
  'aulas_interativas': CACHE_STALE_TIMES.STATIC,
  
  // Conteúdo editorial - cache longo
  'blogger_juridico': CACHE_STALE_TIMES.STATIC,
  'blogger_politico': CACHE_STALE_TIMES.STATIC,
  'bibliotecas': CACHE_STALE_TIMES.STATIC,
  
  // Legislação - praticamente estática (cache 24h)
  'artigos': CACHE_STALE_TIMES.STATIC,
  'artigos_lei': CACHE_STALE_TIMES.STATIC,
  'constituicao': CACHE_STALE_TIMES.STATIC,
  'codigos': CACHE_STALE_TIMES.STATIC,
  'sumulas': CACHE_STALE_TIMES.STATIC,
  'sumulas_vinculantes': CACHE_STALE_TIMES.STATIC,
  'sumulas_stf': CACHE_STALE_TIMES.STATIC,
  'sumulas_stj': CACHE_STALE_TIMES.STATIC,
  'leis': CACHE_STALE_TIMES.STATIC,
  'estatutos': CACHE_STALE_TIMES.STATIC,
  'vade_mecum': CACHE_STALE_TIMES.STATIC,
  
  // Deputados e senadores - muda muito raramente
  'deputados': CACHE_STALE_TIMES.STATIC,
  'deputados_detalhes': CACHE_STALE_TIMES.INFREQUENT,
  'senadores': CACHE_STALE_TIMES.STATIC,
  'senadores_detalhes': CACHE_STALE_TIMES.INFREQUENT,
  'partidos': CACHE_STALE_TIMES.STATIC,
  
  // Flashcards e estudo - cache infinito
  'flashcards': CACHE_STALE_TIMES.STATIC,
  'flashcards_temas': CACHE_STALE_TIMES.STATIC,
  'flashcards_areas': CACHE_STALE_TIMES.STATIC,
  
  // Meu Brasil - conteúdo histórico estático
  'juristas': CACHE_STALE_TIMES.STATIC,
  'historia': CACHE_STALE_TIMES.STATIC,
  'instituicoes': CACHE_STALE_TIMES.STATIC,
  
  // Carreiras - raramente muda
  'carreiras': CACHE_STALE_TIMES.STATIC,
  'carreiras_capas': CACHE_STALE_TIMES.STATIC,
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
