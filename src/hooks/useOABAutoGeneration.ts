import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Subtema {
  id: number;
  subtema: string;
  slides_json?: any;
  conteudo_gerado?: any;
  status?: string;
}

interface UseOABAutoGenerationProps {
  subtemas: Subtema[] | undefined;
  areaNome: string;
  temaNome: string;
  enabled?: boolean;
}

interface UseOABAutoGenerationReturn {
  isGenerating: boolean;
  currentGeneratingId: number | null;
  currentGeneratingTitle: string | null;
  totalSubtemas: number;
  concluidos: number;
  pendentes: number;
  percentualGeral: number;
  getSubtemaStatus: (subtemaId: number) => {
    status: "concluido" | "gerando" | "pendente" | "erro";
    hasContent: boolean;
  };
}

export const useOABAutoGeneration = ({
  subtemas,
  areaNome,
  temaNome,
  enabled = true,
}: UseOABAutoGenerationProps): UseOABAutoGenerationReturn => {
  const [currentGeneratingId, setCurrentGeneratingId] = useState<number | null>(null);
  const [generatingIds, setGeneratingIds] = useState<Set<number>>(new Set());
  const isGeneratingRef = useRef(false);
  const lastGeneratedRef = useRef<number | null>(null);

  // Verificar se tem conteúdo gerado
  const hasContent = (subtema: Subtema) => {
    return !!(subtema.slides_json || subtema.conteudo_gerado);
  };

  // Calcular estatísticas
  const totalSubtemas = subtemas?.length || 0;
  const concluidos = subtemas?.filter(s => hasContent(s)).length || 0;
  const pendentes = subtemas?.filter(s => !hasContent(s) && !generatingIds.has(s.id)).length || 0;
  const percentualGeral = totalSubtemas > 0 ? Math.round((concluidos / totalSubtemas) * 100) : 0;

  // Número de gerações simultâneas
  const CONCURRENT_GENERATIONS = 5;

  // Encontrar próximos subtemas pendentes (até 5)
  const findNextPendingBatch = useCallback(() => {
    if (!subtemas || !enabled) return [];
    
    // Quantos slots disponíveis
    const slotsAvailable = CONCURRENT_GENERATIONS - generatingIds.size;
    if (slotsAvailable <= 0) return [];
    
    // Encontrar os que não têm conteúdo e não estão gerando
    const pending = subtemas.filter(s => !hasContent(s) && !generatingIds.has(s.id));
    
    return pending.slice(0, slotsAvailable);
  }, [subtemas, enabled, generatingIds]);

  // Iniciar geração de múltiplos subtemas em paralelo
  const startBatchGeneration = useCallback(async () => {
    if (isGeneratingRef.current || !enabled) return;
    
    const pendingBatch = findNextPendingBatch();
    if (pendingBatch.length === 0) {
      console.log("[OAB AutoGen] Nenhum subtema pendente ou limite atingido");
      return;
    }

    isGeneratingRef.current = true;
    
    console.log(`[OAB AutoGen] Iniciando geração de ${pendingBatch.length} subtemas em paralelo`);
    toast.info(`Gerando ${pendingBatch.length} aulas simultaneamente...`, { duration: 3000 });

    // Marcar todos como gerando
    setGeneratingIds(prev => {
      const next = new Set(prev);
      pendingBatch.forEach(s => next.add(s.id));
      return next;
    });
    
    if (pendingBatch.length > 0) {
      setCurrentGeneratingId(pendingBatch[0].id);
    }

    // Iniciar todas as gerações em paralelo
    const promises = pendingBatch.map(async (subtema) => {
      console.log(`[OAB AutoGen] Iniciando: ${subtema.subtema} (ID: ${subtema.id})`);
      
      try {
        const { error } = await supabase.functions.invoke("gerar-conteudo-oab-trilhas", {
          body: { resumo_id: subtema.id },
        });

        if (error) {
          console.error(`[OAB AutoGen] Erro na geração de ${subtema.subtema}:`, error);
          toast.error(`Erro ao gerar: ${subtema.subtema}`);
          setGeneratingIds(prev => {
            const next = new Set(prev);
            next.delete(subtema.id);
            return next;
          });
        }
      } catch (err) {
        console.error(`[OAB AutoGen] Exceção em ${subtema.subtema}:`, err);
        setGeneratingIds(prev => {
          const next = new Set(prev);
          next.delete(subtema.id);
          return next;
        });
      }
    });

    await Promise.allSettled(promises);
    isGeneratingRef.current = false;
  }, [findNextPendingBatch, enabled]);

  // Polling para verificar se o conteúdo foi gerado
  useEffect(() => {
    if (!enabled || generatingIds.size === 0) return;

    const pollProgress = async () => {
      const ids = Array.from(generatingIds);
      
      for (const id of ids) {
        const { data } = await supabase
          .from("RESUMO")
          .select("id, slides_json, conteudo_gerado")
          .eq("id", id)
          .single();

        if (data && (data.slides_json || data.conteudo_gerado)) {
          console.log(`[OAB AutoGen] ✓ Concluído: ID ${id}`);
          toast.success(`Conteúdo gerado com sucesso!`, { duration: 2000 });
          
          setGeneratingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          
          if (currentGeneratingId === id) {
            setCurrentGeneratingId(null);
          }
        }
      }
    };

    const interval = setInterval(pollProgress, 5000);
    pollProgress();

    return () => clearInterval(interval);
  }, [enabled, generatingIds, currentGeneratingId]);

  // Auto-iniciar geração em lote quando há slots disponíveis
  useEffect(() => {
    if (!enabled || !subtemas || subtemas.length === 0) return;

    // Se há slots disponíveis e há pendentes, iniciar mais
    if (generatingIds.size < CONCURRENT_GENERATIONS && pendentes > 0) {
      const timer = setTimeout(() => {
        startBatchGeneration();
      }, 2000); // Delay para evitar múltiplas chamadas

      return () => clearTimeout(timer);
    }
  }, [enabled, subtemas, generatingIds.size, pendentes, startBatchGeneration]);

  // Função helper para obter status de um subtema específico
  const getSubtemaStatus = useCallback((subtemaId: number) => {
    const subtema = subtemas?.find(s => s.id === subtemaId);
    if (!subtema) return { status: "pendente" as const, hasContent: false };

    const content = hasContent(subtema);
    
    if (content) {
      return { status: "concluido" as const, hasContent: true };
    }
    if (generatingIds.has(subtemaId)) {
      return { status: "gerando" as const, hasContent: false };
    }
    return { status: "pendente" as const, hasContent: false };
  }, [subtemas, generatingIds]);

  return {
    isGenerating: generatingIds.size > 0,
    currentGeneratingId,
    currentGeneratingTitle: subtemas?.find(s => s.id === currentGeneratingId)?.subtema || null,
    totalSubtemas,
    concluidos,
    pendentes,
    percentualGeral,
    getSubtemaStatus,
  };
};
