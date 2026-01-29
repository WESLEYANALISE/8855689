import { useMemo } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';

// Limites de conteúdo gratuito por tipo
const LIMITS: Record<string, number> = {
  'estudos': 0.20,      // 20%
  'classicos': 0.20,    // 20%
  'oab': 0.20,          // 20%
  'oratoria': 0.20,     // 20%
  'lideranca': 0.20,    // 20%
  'fora-da-toga': 0.10, // 10%
  'flashcards': 0.20,   // 20%
  'flashcards-temas': 0.10, // 10% - Temas de flashcards de direito
  'questoes': 0.20,     // 20%
  // Novas categorias com 20%
  'resumos-juridicos': 0.20,  // 20%
  'cursos': 0.20,             // 20%
  'mapa-mental': 0.20,        // 20%
  'audioaulas': 0.20,         // 20%
  // Blog Jurídico - 30% por categoria
  'blog-juridico': 0.30, // 30%
  'iniciando': 0.30,
  'carreiras': 0.30,
  'advogado': 0.30,
  'juiz': 0.30,
  'delegado': 0.30,
  'prf': 0.30,
  'pf': 0.30,
  'historia': 0.30,
  'filosofos': 0.30,
  'curiosidades': 0.30,
  'termos': 0.30,
  'casos': 0.30,
  'areas': 0.30,
  'principios': 0.30,
  'codigos_historicos': 0.30,
  'civilizacoes': 0.30,
  'juristas_brasileiros': 0.30,
  'julgamentos_mundiais': 0.30,
  'tribunais_brasil': 0.30,
  'orgaos_juridicos': 0.30,
  'sistemas_juridicos': 0.30,
  'direitos_humanos': 0.30,
  'constituicoes_brasil': 0.30,
  'direito_comparado': 0.30,
  'crimes_famosos': 0.30,
  'prisoes_historicas': 0.30,
  // Política - apenas 2 artigos grátis (calculado diferente)
  'politica-artigos': 2, // Número absoluto, não percentual
};

export interface ContentLimitResult<T> {
  visibleItems: T[];
  lockedItems: T[];
  totalCount: number;
  visibleCount: number;
  lockedCount: number;
  isPremiumRequired: boolean;
  limitPercentage: number;
}

export function useContentLimit<T>(
  items: T[] | undefined,
  type: keyof typeof LIMITS
): ContentLimitResult<T> {
  const { isPremium, loading } = useSubscription();

  return useMemo(() => {
    const allItems = items || [];
    const totalCount = allItems.length;
    
    // Premium ou carregando = acesso total
    if (isPremium || loading) {
      return {
        visibleItems: allItems,
        lockedItems: [],
        totalCount,
        visibleCount: totalCount,
        lockedCount: 0,
        isPremiumRequired: false,
        limitPercentage: 100,
      };
    }

    // Calcular limite
    const limit = LIMITS[type] || 0.20;
    const visibleCount = Math.max(1, Math.ceil(totalCount * limit));
    
    return {
      visibleItems: allItems.slice(0, visibleCount),
      lockedItems: allItems.slice(visibleCount),
      totalCount,
      visibleCount,
      lockedCount: totalCount - visibleCount,
      isPremiumRequired: totalCount > visibleCount,
      limitPercentage: Math.round(limit * 100),
    };
  }, [items, type, isPremium, loading]);
}

// Hook simplificado para verificar se um índice está bloqueado
export function useIsItemLocked(
  index: number,
  totalItems: number,
  type: keyof typeof LIMITS
): boolean {
  const { isPremium, loading } = useSubscription();

  return useMemo(() => {
    if (isPremium || loading) return false;
    
    const limit = LIMITS[type] || 0.20;
    const visibleCount = Math.max(1, Math.ceil(totalItems * limit));
    
    return index >= visibleCount;
  }, [index, totalItems, type, isPremium, loading]);
}

export default useContentLimit;
