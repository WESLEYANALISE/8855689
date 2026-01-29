import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Topico {
  id: number;
  titulo: string;
  status: string | null;
  progresso: number | null;
  ordem: number;
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

  // Encontrar próximo tópico pendente (ordenado do menor para o maior)
  // IMPORTANTE: Não iniciar se já houver algum gerando OU na fila (o sistema de fila cuida disso)
  const findNextPending = useCallback(() => {
    if (!topicos) return null;
    
    // Se já houver geração ativa ou items na fila, a edge function cuida do sequenciamento
    const hasActiveGeneration = topicos.some(t => t.status === "gerando" || t.status === "na_fila");
    if (hasActiveGeneration) return null;
    
    // Ordenar por ordem ASCENDENTE (1, 2, 3...) e encontrar o primeiro pendente ou com erro
    const sorted = [...topicos].sort((a, b) => a.ordem - b.ordem);
    // Incluir status "erro" para retry automático
    return sorted.find(t => t.status === "pendente" || t.status === "erro" || !t.status);
  }, [topicos]);

  // Verificar se há um tópico em geração
  const currentlyGenerating = topicos?.find(t => t.status === "gerando");

  // Iniciar geração do próximo tópico
  const startNextGeneration = useCallback(async () => {
    if (isGeneratingRef.current) return;
    
    const nextPending = findNextPending();
    if (!nextPending) {
      console.log("[Conceitos AutoGen] Nenhum tópico pendente encontrado");
      return;
    }

    // Evitar reprocessar o mesmo tópico
    if (nextPending.id === lastGeneratedRef.current) {
      console.log("[Conceitos AutoGen] Tópico já foi iniciado recentemente, aguardando...");
      return;
    }

    isGeneratingRef.current = true;
    lastGeneratedRef.current = nextPending.id;
    setCurrentGeneratingId(nextPending.id);
    setCurrentProgress(5);

    console.log(`[Conceitos AutoGen] Iniciando geração: ${nextPending.titulo} (ID: ${nextPending.id})`);

    try {
      const { error } = await supabase.functions.invoke("gerar-conteudo-conceitos", {
        body: { topico_id: nextPending.id },
      });

      if (error) {
        console.error("[Conceitos AutoGen] Erro na geração:", error);
        toast.error(`Erro ao gerar: ${nextPending.titulo}`);
      }
    } catch (err) {
      console.error("[Conceitos AutoGen] Exceção:", err);
    } finally {
      isGeneratingRef.current = false;
    }
  }, [findNextPending]);

  // Monitorar progresso via polling
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

    // Poll a cada 2 segundos enquanto estiver gerando
    const interval = setInterval(pollProgress, 2000);
    pollProgress(); // Primeira chamada imediata

    return () => clearInterval(interval);
  }, [enabled, materiaId, currentlyGenerating?.id]);

  // Auto-iniciar geração quando não há nenhum em andamento
  useEffect(() => {
    if (!enabled || !materiaId || !topicos) return;

    // Se não há nenhum gerando e há pendentes, iniciar
    if (!currentlyGenerating && pendentes > 0) {
      const timer = setTimeout(() => {
        startNextGeneration();
      }, 1000); // Pequeno delay para evitar múltiplas chamadas

      return () => clearTimeout(timer);
    }
  }, [enabled, materiaId, topicos, currentlyGenerating, pendentes, startNextGeneration]);

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
      return { status: "na_fila" as const, progresso: 0 };
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
