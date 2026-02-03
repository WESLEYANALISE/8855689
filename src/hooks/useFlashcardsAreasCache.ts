import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FlashcardAreaStats {
  area: string;
  totalFlashcards: number;
  totalTemas: number;
  urlCapa?: string;
}

// Áreas a excluir (Português, Revisão OAB, Pesquisa Científica, Formação Complementar)
const AREAS_EXCLUIDAS = [
  'portugues',
  'revisao oab',
  'pesquisa cientifica',
  'formacao complementar'
];

// Função para normalizar strings para comparação
const normalizar = (str: string) => 
  str.trim()
     .toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '')
     .replace(/\s+/g, ' ');

export const useFlashcardsAreasCache = () => {
  const [areas, setAreas] = useState<FlashcardAreaStats[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      console.log('🔍 useFlashcardsAreasCache - Iniciando carregamento da BIBLIOTECA-ESTUDOS...');
      
      try {
        // 1. Buscar áreas únicas da BIBLIOTECA-ESTUDOS
        const { data: bibliotecaData, error: bibliotecaError } = await supabase
          .from('BIBLIOTECA-ESTUDOS')
          .select('"Área", url_capa_gerada, "Capa-area"')
          .not('Área', 'is', null);

        if (bibliotecaError) {
          console.error('❌ Erro ao buscar BIBLIOTECA-ESTUDOS:', bibliotecaError);
          throw bibliotecaError;
        }

        console.log('📚 BIBLIOTECA-ESTUDOS - Total registros:', bibliotecaData?.length);

        // 2. Agrupar por área e pegar primeira capa disponível
        const areasMap = new Map<string, { capa: string | null; count: number; nomeOriginal: string }>();
        
        (bibliotecaData as { Área: string | null; url_capa_gerada: string | null; "Capa-area": string | null }[] | null)?.forEach(item => {
          if (item.Área) {
            const areaNorm = normalizar(item.Área);
            
            // Verificar se área está na lista de exclusão
            if (AREAS_EXCLUIDAS.includes(areaNorm)) {
              return;
            }
            
            const existing = areasMap.get(areaNorm);
            if (!existing) {
              areasMap.set(areaNorm, { 
                capa: item.url_capa_gerada || item["Capa-area"] || null, 
                count: 1,
                nomeOriginal: item.Área.trim()
              });
            } else {
              existing.count++;
              // Se ainda não tem capa, tenta pegar dessa entrada
              if (!existing.capa) {
                existing.capa = item.url_capa_gerada || item["Capa-area"] || null;
              }
            }
          }
        });

        console.log('📊 Áreas únicas encontradas (excluindo proibidas):', areasMap.size);

        // 3. Buscar contagem de flashcards por área via RPC
        const { data: flashcardsCount, error: flashcardsError } = await supabase
          .rpc('get_flashcard_areas_from_gerados');

        if (flashcardsError) {
          console.warn('⚠️ Erro ao buscar contagem de flashcards:', flashcardsError);
        }

        console.log('🃏 Flashcards por área:', flashcardsCount);

        // 4. Combinar dados
        const result: FlashcardAreaStats[] = Array.from(areasMap.entries()).map(([areaNorm, data]) => {
          // Buscar contagem de flashcards correspondente
          const fcData = flashcardsCount?.find((f: { area: string; total_flashcards: number }) => 
            normalizar(f.area) === areaNorm
          );
          
          return {
            area: data.nomeOriginal,
            totalFlashcards: fcData?.total_flashcards || 0,
            totalTemas: data.count,
            urlCapa: data.capa || undefined
          };
        }).sort((a, b) => a.area.localeCompare(b.area, 'pt-BR'));

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
  const totalAreas = areas?.length || 0;

  return {
    areas,
    isLoading,
    totalFlashcards,
    totalAreas,
  };
};
