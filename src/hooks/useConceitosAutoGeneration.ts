import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Topico {
  id: number;
  titulo: string;
  status: string | null;
  progresso: number | null;
  ordem: number;
  posicao_fila?: number | null;
}

interface UseConceitosAutoGenerationProps {
  materiaId: number | null;
  topicos: Topico[] | undefined;
  enabled?: boolean;
}

interface UseConceitosAutoGenerationReturn {
  isGenerating: boolean;
  currentGeneratingId: number | null;
  currentGeneratingTitle: string | null;
  currentProgress: number;
  totalTopicos: number;
  concluidos: number;
  pendentes: number;
  percentualGeral: number;
  getTopicoStatus: (topicoId: number) => {
    status: "concluido" | "gerando" | "pendente" | "erro" | "na_fila";
    progresso: number;
    posicaoFila?: number;
  };
}

export const useConceitosAutoGeneration = ({
  materiaId,
  topicos,
  enabled = true,
}: UseConceitosAutoGenerationProps): UseConceitosAutoGenerationReturn => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const isGeneratingRef = useRef(false);
  const CONCURRENT_GENERATIONS = 5;

  const totalTopicos = topicos?.length || 0;
  const concluidos = topicos?.filter(t => t.status === "concluido").length || 0;
  const pendentes = topicos?.filter(t => t.status === "pendente" || t.status === "erro" || !t.status).length || 0;
  const percentualGeral = totalTopicos > 0 ? Math.round((concluidos / totalTopicos) * 100) : 0;
  const currentlyGenerating = topicos?.find(t => t.status === "gerando");

  const findNextPendingBatch = useCallback(() => {
    if (!topicos) return [];
    const currentlyGeneratingCount = topicos.filter(t => t.status === "gerando" || t.status === "na_fila").length;
    if (currentlyGeneratingCount >= CONCURRENT_GENERATIONS) return [];
    const slotsAvailable = CONCURRENT_GENERATIONS - currentlyGeneratingCount;
    const sorted = [...topicos].sort((a, b) => a.ordem - b.ordem);
    const pending = sorted.filter(t => t.status === "pendente" || t.status === "erro" || !t.status);
    return pending.slice(0, slotsAvailable);
  }, [topicos]);

  const startBatchGeneration = useCallback(async () => {
    if (isGeneratingRef.current) return;
    const pendingBatch = findNextPendingBatch();
    if (pendingBatch.length === 0) return;

    isGeneratingRef.current = true;
    console.log(`[Conceitos AutoGen] Iniciando geração de ${pendingBatch.length} tópicos em paralelo`);

    const promises = pendingBatch.map(async (topico) => {
      console.log(`[Conceitos AutoGen] Iniciando: ${topico.titulo} (ID: ${topico.id})`);
      try {
        const { error } = await supabase.functions.invoke("gerar-conteudo-conceitos", {
          body: { topico_id: topico.id },
        });
        if (error) {
          console.error(`[Conceitos AutoGen] Erro:`, error);
          toast.error(`Erro ao gerar: ${topico.titulo}`);
        }
      } catch (err) {
        console.error(`[Conceitos AutoGen] Exceção:`, err);
      }
    });

    await Promise.allSettled(promises);
    isGeneratingRef.current = false;
  }, [findNextPendingBatch]);

  // Poll progress
  useEffect(() => {
    if (!enabled || !materiaId || !currentlyGenerating) return;
    const pollProgress = async () => {
      const { data } = await supabase
        .from("conceitos_topicos")
        .select("progresso")
        .eq("id", currentlyGenerating.id)
        .single();
      if (data?.progresso !== undefined && data.progresso !== null) {
        setCurrentProgress(data.progresso);
      }
    };
    const interval = setInterval(pollProgress, 5000);
    pollProgress();
    return () => clearInterval(interval);
  }, [enabled, materiaId, currentlyGenerating?.id]);

  // Auto-start batch
  useEffect(() => {
    if (!enabled || !materiaId || !topicos) return;
    const currentlyGeneratingCount = topicos.filter(t => t.status === "gerando" || t.status === "na_fila").length;
    if (currentlyGeneratingCount < CONCURRENT_GENERATIONS && pendentes > 0) {
      const timer = setTimeout(() => startBatchGeneration(), 1000);
      return () => clearTimeout(timer);
    }
  }, [enabled, materiaId, topicos, pendentes, startBatchGeneration]);

  useEffect(() => {
    if (currentlyGenerating) {
      setCurrentProgress(currentlyGenerating.progresso || 0);
    } else {
      setCurrentProgress(0);
      isGeneratingRef.current = false;
    }
  }, [currentlyGenerating]);

  const getTopicoStatus = useCallback((topicoId: number) => {
    const topico = topicos?.find(t => t.id === topicoId);
    if (!topico) return { status: "pendente" as const, progresso: 0 };
    if (topico.status === "concluido") return { status: "concluido" as const, progresso: 100 };
    if (topico.status === "gerando") return { status: "gerando" as const, progresso: topico.progresso || 0 };
    if (topico.status === "na_fila") return { status: "na_fila" as const, progresso: 0, posicaoFila: topico.posicao_fila || undefined };
    if (topico.status === "erro") return { status: "erro" as const, progresso: 0 };
    return { status: "pendente" as const, progresso: 0 };
  }, [topicos]);

  return {
    isGenerating: !!currentlyGenerating || (topicos?.some(t => t.status === "gerando") || false),
    currentGeneratingId: currentlyGenerating?.id || null,
    currentGeneratingTitle: currentlyGenerating?.titulo || null,
    currentProgress,
    totalTopicos,
    concluidos,
    pendentes,
    percentualGeral,
    getTopicoStatus,
  };
};
