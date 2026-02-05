import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TemaStatus {
  tema: string;
  temFlashcards: boolean;
  parcial: boolean;
  totalSubtemas: number;
  subtemasGerados: number;
}

interface UseFlashcardsAutoGenerationProps {
  area: string;
  temas: TemaStatus[] | undefined;
  enabled: boolean;
  onProgress?: () => void;
}

export function useFlashcardsAutoGeneration({
  area,
  temas,
  enabled,
  onProgress
}: UseFlashcardsAutoGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTema, setCurrentTema] = useState<string | null>(null);
  const [geradosCount, setGeradosCount] = useState(0);
  const abortRef = useRef(false);
  const isRunningRef = useRef(false);

  // Encontrar próximo tema sem flashcards completos
  const findNextPendingTema = useCallback(() => {
    if (!temas) return null;
    return temas.find(t => !t.temFlashcards);
  }, [temas]);

  // Gerar flashcards para um tema
  const generateForTema = useCallback(async (tema: string) => {
    if (abortRef.current) return false;
    
    try {
      console.log(`🔄 [AutoGen] Iniciando geração para: ${tema}`);
      setCurrentTema(tema);

      // Buscar resumos do tema
      const { data: resumos, error: resumosError } = await supabase
        .from('RESUMO')
        .select('id, tema, subtema, conteudo')
        .eq('area', area)
        .eq('tema', tema);

      if (resumosError || !resumos || resumos.length === 0) {
        console.error(`❌ [AutoGen] Sem resumos para ${tema}`);
        return false;
      }

      // Chamar edge function para gerar flashcards
      const { data, error } = await supabase.functions.invoke('gerar-flashcards-tema', {
        body: { area, tema, resumos }
      });

      if (error) {
        console.error(`❌ [AutoGen] Erro na geração:`, error);
        return false;
      }

      console.log(`✅ [AutoGen] Gerados ${data?.flashcards_gerados || 0} flashcards para ${tema}`);
      setGeradosCount(prev => prev + (data?.flashcards_gerados || 0));
      
      // Notificar progresso para refresh dos dados
      onProgress?.();
      
      return !data?.geracao_completa; // Retorna true se ainda tem mais subtemas
    } catch (err) {
      console.error(`❌ [AutoGen] Exceção:`, err);
      return false;
    }
  }, [area, onProgress]);

  // Loop principal de geração
  const startGeneration = useCallback(async () => {
    if (isRunningRef.current || !enabled || !area || !temas) return;
    
    isRunningRef.current = true;
    setIsGenerating(true);
    abortRef.current = false;
    
    console.log(`🚀 [AutoGen] Iniciando geração automática para área: ${area}`);
    
    let processedTemas = new Set<string>();
    let consecutiveErrors = 0;
    const MAX_ERRORS = 3;
    
    while (!abortRef.current && consecutiveErrors < MAX_ERRORS) {
      const nextTema = findNextPendingTema();
      
      // Se não encontrar tema pendente, verificar se já processamos todos
      if (!nextTema || processedTemas.has(nextTema.tema)) {
        console.log(`🎉 [AutoGen] Todos os temas foram processados!`);
        break;
      }
      
      // Se o tema já tem flashcards completos, pular
      if (nextTema.temFlashcards) {
        processedTemas.add(nextTema.tema);
        continue;
      }
      
      const needsMoreCalls = await generateForTema(nextTema.tema);
      
      if (needsMoreCalls) {
        // Ainda tem subtemas pendentes, continuar no mesmo tema
        consecutiveErrors = 0;
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // Tema completo ou erro, marcar como processado
        processedTemas.add(nextTema.tema);
        consecutiveErrors = 0;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    setIsGenerating(false);
    setCurrentTema(null);
    isRunningRef.current = false;
    
    if (geradosCount > 0) {
      toast.success(`${geradosCount} flashcards gerados automaticamente!`);
    }
  }, [enabled, area, temas, findNextPendingTema, generateForTema, geradosCount]);

  // Parar geração
  const stopGeneration = useCallback(() => {
    console.log(`⏹️ [AutoGen] Parando geração...`);
    abortRef.current = true;
  }, []);

  // Iniciar automaticamente quando há temas pendentes
  useEffect(() => {
    if (!enabled || !temas || isRunningRef.current) return;
    
    const hasPending = temas.some(t => !t.temFlashcards);
    if (hasPending) {
      // Delay para não iniciar imediatamente
      const timer = setTimeout(() => {
        startGeneration();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [enabled, temas, startGeneration]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  return {
    isGenerating,
    currentTema,
    geradosCount,
    stopGeneration,
    startGeneration
  };
}
