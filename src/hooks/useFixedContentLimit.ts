 import { useMemo } from 'react';
 import { useSubscription } from '@/contexts/SubscriptionContext';
 
 // Limites absolutos por tipo de conteúdo
 const FIXED_LIMITS: Record<string, number> = {
   'oab-trilhas-areas': 9,      // 9 áreas na página principal
   'oab-trilhas-materias': 2,   // 2 matérias por área
   'conceitos-materias': 9,     // 9 matérias em conceitos
 };
 
 export interface FixedContentLimitResult<T> {
   visibleItems: T[];
   lockedItems: T[];
   totalCount: number;
   visibleCount: number;
   lockedCount: number;
   isPremiumRequired: boolean;
   limit: number;
 }
 
 export function useFixedContentLimit<T>(
   items: T[] | undefined,
   type: keyof typeof FIXED_LIMITS
 ): FixedContentLimitResult<T> {
   const { isPremium, loading } = useSubscription();
 
   return useMemo(() => {
     const allItems = items || [];
     const totalCount = allItems.length;
     const limit = FIXED_LIMITS[type] || 9;
     
     // Premium ou carregando = acesso total (evita flash)
     if (isPremium || loading) {
       return {
         visibleItems: allItems,
         lockedItems: [],
         totalCount,
         visibleCount: totalCount,
         lockedCount: 0,
         isPremiumRequired: false,
         limit,
       };
     }
 
     // Usuário gratuito: aplicar limite
     const visibleCount = Math.min(limit, totalCount);
     
     return {
       visibleItems: allItems.slice(0, visibleCount),
       lockedItems: allItems.slice(visibleCount),
       totalCount,
       visibleCount,
       lockedCount: totalCount - visibleCount,
       isPremiumRequired: totalCount > limit,
       limit,
     };
   }, [items, type, isPremium, loading]);
 }
 
 export default useFixedContentLimit;