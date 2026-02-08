import { usePageTracking } from '@/hooks/usePageTracking';

/**
 * Componente wrapper para rastrear navegação de páginas
 * Deve ser usado dentro do BrowserRouter
 */
export const PageTracker = () => {
  usePageTracking();
  return null;
};
