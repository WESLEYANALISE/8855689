import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseArticleTrackingProps {
  tableName: string;
  articleId: number;
  numeroArtigo: string;
  enabled?: boolean;
}

export const useArticleTracking = ({ 
  tableName, 
  articleId, 
  numeroArtigo,
  enabled = true 
}: UseArticleTrackingProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!enabled || !elementRef.current || hasTracked.current) return;

    const trackView = async () => {
      try {
        // Primeiro, buscar visualização atual
        const { data: currentData } = await supabase
          .from(tableName as any)
          .select('visualizacoes')
          .eq('id', articleId)
          .single();

        const currentViews = (currentData as any)?.visualizacoes || 0;

        // Incrementar contador de visualizações
        const { error } = await supabase
          .from(tableName as any)
          .update({ 
            visualizacoes: currentViews + 1,
            ultima_visualizacao: new Date().toISOString()
          })
          .eq('id', articleId);

        if (error) {
          console.error('Erro ao registrar visualização:', error);
        } else {
          console.log(`✅ Visualização registrada: Art. ${numeroArtigo}`);
          hasTracked.current = true;
        }
      } catch (error) {
        console.error('Erro ao rastrear artigo:', error);
      }
    };

    // Usar Intersection Observer para detectar quando artigo está visível
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            // Aguardar 3 segundos de visualização antes de registrar
            const timeout = setTimeout(() => {
              if (entry.isIntersecting) {
                trackView();
              }
            }, 3000);

            // Limpar timeout se elemento sair do viewport antes dos 3s
            const cleanup = () => {
              clearTimeout(timeout);
              observer.disconnect();
            };

            return cleanup;
          }
        });
      },
      {
        threshold: 0.5, // 50% do elemento visível
        rootMargin: '0px'
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [tableName, articleId, numeroArtigo, enabled]);

  return { elementRef };
};
