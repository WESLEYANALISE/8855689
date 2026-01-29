import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TUTORIAL_CATEGORIES, TutorialFuncionalidade } from '@/config/tutorialCategories';

export interface TutorialCacheItem {
  id: string;
  categoria: string;
  funcionalidade_id: string;
  titulo: string;
  descricao_curta: string;
  funcionalidades: Array<{
    nome: string;
    descricao: string;
    exemplo: string;
  }>;
  steps: any[];
  icone: string;
  rota: string;
  ordem: number;
}

export function useTutoriaisCache(categoria?: string) {
  const [tutoriais, setTutoriais] = useState<TutorialCacheItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

  // Buscar tutoriais do cache
  const fetchTutoriais = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('tutoriais_cache')
        .select('*')
        .order('ordem');

      if (categoria) {
        query = query.eq('categoria', categoria);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar tutoriais:', error);
        return;
      }

      // Type assertion for the data
      const typedData = (data || []) as unknown as TutorialCacheItem[];
      setTutoriais(typedData);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setIsLoading(false);
    }
  }, [categoria]);

  // Gerar tutorial via Edge Function
  const gerarTutorial = useCallback(async (func: TutorialFuncionalidade, categoriaId: string) => {
    if (generatingIds.has(func.id)) return;

    setGeneratingIds(prev => new Set(prev).add(func.id));

    try {
      const { data, error } = await supabase.functions.invoke('gerar-tutorial', {
        body: {
          funcionalidade_id: func.id,
          titulo: func.titulo,
          contexto: func.contexto,
          categoria: categoriaId,
          rota: func.rota,
          icone: func.icone,
          ordem: func.ordem,
        },
      });

      if (error) throw error;

      // Adicionar ao estado local
      if (data) {
        setTutoriais(prev => {
          const exists = prev.some(t => t.funcionalidade_id === func.id);
          if (exists) return prev;
          return [...prev, data as TutorialCacheItem].sort((a, b) => a.ordem - b.ordem);
        });
      }

      return data;
    } catch (error) {
      console.error('Erro ao gerar tutorial:', error);
    } finally {
      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(func.id);
        return next;
      });
    }
  }, [generatingIds]);

  // Verificar e gerar tutoriais faltantes para uma categoria
  const gerarTutoriaisFaltantes = useCallback(async (categoriaId: string) => {
    const cat = TUTORIAL_CATEGORIES.find(c => c.id === categoriaId);
    if (!cat) return;

    const existingIds = new Set(tutoriais.map(t => t.funcionalidade_id));
    const faltantes = cat.funcionalidades.filter(f => !existingIds.has(f.id));

    // Gerar em paralelo (máximo 3 por vez)
    const batchSize = 3;
    for (let i = 0; i < faltantes.length; i += batchSize) {
      const batch = faltantes.slice(i, i + batchSize);
      await Promise.all(batch.map(f => gerarTutorial(f, categoriaId)));
    }
  }, [tutoriais, gerarTutorial]);

  // Buscar tutorial específico
  const getTutorialByFuncionalidadeId = useCallback((funcId: string): TutorialCacheItem | undefined => {
    return tutoriais.find(t => t.funcionalidade_id === funcId);
  }, [tutoriais]);

  useEffect(() => {
    fetchTutoriais();
  }, [fetchTutoriais]);

  return {
    tutoriais,
    isLoading,
    generatingIds,
    fetchTutoriais,
    gerarTutorial,
    gerarTutoriaisFaltantes,
    getTutorialByFuncionalidadeId,
    isGenerating: (id: string) => generatingIds.has(id),
  };
}
