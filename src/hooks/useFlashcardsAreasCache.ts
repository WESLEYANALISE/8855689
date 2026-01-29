import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FlashcardAreaStats {
  area: string;
  totalFlashcards: number;
  totalTemas: number;
  urlCapa?: string;
}

export const useFlashcardsAreasCache = () => {
  const [areas, setAreas] = useState<FlashcardAreaStats[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      console.log('🔍 useFlashcardsAreasCache - Iniciando carregamento...');
      
      try {
        // Buscar diretamente usando RPC
        console.log('🔍 useFlashcardsAreasCache - Chamando RPC...');
        const { data: areasData, error } = await supabase
          .rpc('get_flashcard_areas_from_gerados');

        console.log('🔍 useFlashcardsAreasCache - RPC resultado:', areasData, 'erro:', error);
        
        if (error) {
          console.error('❌ useFlashcardsAreasCache - Erro RPC:', error);
          throw error;
        }

        // Buscar capas
        const { data: capasData } = await supabase
          .from('flashcards_areas')
          .select('area, url_capa');

        const capasMap: Record<string, string> = {};
        (capasData || []).forEach(item => {
          if (item.area && item.url_capa) {
            capasMap[item.area] = item.url_capa;
          }
        });

        const result: FlashcardAreaStats[] = (areasData || []).map((item: { area: string; total_flashcards: number }) => ({
          area: item.area,
          totalFlashcards: Number(item.total_flashcards),
          totalTemas: 0,
          urlCapa: capasMap[item.area],
        }));

        console.log('✅ useFlashcardsAreasCache - Resultado final:', result.length, 'áreas');

        if (mounted) {
          setAreas(result);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ useFlashcardsAreasCache - Erro ao carregar áreas:', error);
        if (mounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, []);

  const totalFlashcards = areas?.reduce((acc, item) => acc + item.totalFlashcards, 0) || 0;

  return {
    areas,
    isLoading,
    totalFlashcards,
  };
};
