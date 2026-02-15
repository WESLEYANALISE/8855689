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

interface UseOABTrilhasAutoGenerationProps {
  materiaId: number | null;
  topicos: Topico[] | undefined;
  enabled?: boolean;
}

interface UseOABTrilhasAutoGenerationReturn {
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

export const useOABTrilhasAutoGeneration = ({
  materiaId,
  topicos,
  enabled = true,
}: UseOABTrilhasAutoGenerationProps): UseOABTrilhasAutoGenerationReturn => {
  const [currentGeneratingId, setCurrentGeneratingId] = useState<number | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const isGeneratingRef = useRef(false);
  const lastGeneratedRef = useRef<number | null>(null);

  // Calcular estatísticas
  const totalTopicos = topicos?.length || 0;
  const concluidos = topicos?.filter(t => t.status === "concluido").length || 0;
  const pendentes = topicos?.filter(t => t.status === "pendente" || t.status === "erro" || !t.status).length || 0;
  const naFila = topicos?.filter(t => t.status === "na_fila").length || 0;
  const gerando = topicos?.filter(t => t.status === "gerando").length || 0;
  const percentualGeral = totalTopicos > 0 ? Math.round((concluidos / totalTopicos) * 100) : 0;

  // Número de gerações simultâneas
  const CONCURRENT_GENERATIONS = 10;

  // Encontrar próximos tópicos pendentes (ordenados do menor para o maior)
  // Retorna até 5 tópicos para geração simultânea
  const findNextPendingBatch = useCallback(() => {
    if (!topicos) return [];
    
    // Contar quantos já estão gerando
    const currentlyGeneratingCount = topicos.filter(t => t.status === "gerando" || t.status === "na_fila").length;
    
    // Se já atingiu o limite, não iniciar mais
    if (currentlyGeneratingCount >= CONCURRENT_GENERATIONS) return [];
    
    // Quantos podemos iniciar
    const slotsAvailable = CONCURRENT_GENERATIONS - currentlyGeneratingCount;
    
    // Ordenar por ordem ASCENDENTE (1, 2, 3...) e encontrar os pendentes ou com erro
    const sorted = [...topicos].sort((a, b) => a.ordem - b.ordem);
    const pending = sorted.filter(t => t.status === "pendente" || t.status === "erro" || !t.status);
    
    // Retornar até o número de slots disponíveis
    return pending.slice(0, slotsAvailable);
  }, [topicos]);

  // Verificar se há um tópico em geração
  const currentlyGenerating = topicos?.find(t => t.status === "gerando");

  // Iniciar geração de múltiplos tópicos em paralelo
  const startBatchGeneration = useCallback(async () => {
    if (isGeneratingRef.current) return;
    
    const pendingBatch = findNextPendingBatch();
    if (pendingBatch.length === 0) {
      console.log("[AutoGen] Nenhum tópico pendente encontrado ou limite atingido");
      return;
    }

    isGeneratingRef.current = true;
    
    console.log(`[AutoGen] Iniciando geração de ${pendingBatch.length} tópicos em paralelo`);
    
    // Iniciar todas as gerações em paralelo
    const promises = pendingBatch.map(async (topico) => {
      console.log(`[AutoGen] Iniciando: ${topico.titulo} (ID: ${topico.id})`);
      
      try {
        const { error } = await supabase.functions.invoke("gerar-conteudo-oab-trilhas", {
          body: { topico_id: topico.id },
        });

        if (error) {
          console.error(`[AutoGen] Erro na geração de ${topico.titulo}:`, error);
          toast.error(`Erro ao gerar: ${topico.titulo}`);
        }
      } catch (err) {
        console.error(`[AutoGen] Exceção em ${topico.titulo}:`, err);
      }
    });

    // Aguardar todas as chamadas serem disparadas (não a conclusão)
    await Promise.allSettled(promises);
    
    isGeneratingRef.current = false;
  }, [findNextPendingBatch]);

  // Monitorar progresso via polling - INTERVALO AUMENTADO para 5s
  useEffect(() => {
    if (!enabled || !materiaId || !currentlyGenerating) return;

    const pollProgress = async () => {
      const { data } = await supabase
        .from("oab_trilhas_topicos")
        .select("progresso")
        .eq("id", currentlyGenerating.id)
        .single();

      if (data?.progresso !== undefined && data.progresso !== null) {
        setCurrentProgress(data.progresso);
      }
    };

    // Poll a cada 5 segundos (reduzido de 2s para menos requisições)
    const interval = setInterval(pollProgress, 5000);
    pollProgress(); // Primeira chamada imediata

    return () => clearInterval(interval);
  }, [enabled, materiaId, currentlyGenerating?.id]);

  // Auto-iniciar geração em lote quando há slots disponíveis
  useEffect(() => {
    if (!enabled || !materiaId || !topicos) return;

    // Contar quantos estão gerando atualmente
    const currentlyGeneratingCount = topicos.filter(t => t.status === "gerando" || t.status === "na_fila").length;
    
    // Se há slots disponíveis e há pendentes, iniciar mais
    if (currentlyGeneratingCount < CONCURRENT_GENERATIONS && pendentes > 0) {
      const timer = setTimeout(() => {
        startBatchGeneration();
      }, 1000); // Pequeno delay para evitar múltiplas chamadas

      return () => clearTimeout(timer);
    }
  }, [enabled, materiaId, topicos, pendentes, startBatchGeneration]);

  // Atualizar estado quando um tópico termina
  useEffect(() => {
    if (currentlyGenerating) {
      setCurrentGeneratingId(currentlyGenerating.id);
      setCurrentProgress(currentlyGenerating.progresso || 0);
    } else {
      setCurrentGeneratingId(null);
      setCurrentProgress(0);
      isGeneratingRef.current = false;
    }
  }, [currentlyGenerating]);

  // Função helper para obter status de um tópico específico
  const getTopicoStatus = useCallback((topicoId: number) => {
    const topico = topicos?.find(t => t.id === topicoId);
    if (!topico) return { status: "pendente" as const, progresso: 0 };

    if (topico.status === "concluido") {
      return { status: "concluido" as const, progresso: 100 };
    }
    if (topico.status === "gerando") {
      return { status: "gerando" as const, progresso: topico.progresso || 0 };
    }
    if (topico.status === "na_fila") {
      return { status: "na_fila" as const, progresso: 0, posicaoFila: topico.posicao_fila || undefined };
    }
    if (topico.status === "erro") {
      return { status: "erro" as const, progresso: 0 };
    }
    return { status: "pendente" as const, progresso: 0 };
  }, [topicos]);

  return {
    isGenerating: !!currentlyGenerating || gerando > 0,
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
