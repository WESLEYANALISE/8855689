import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface VideoProgress {
  tempo_atual: number;
  duracao_total: number;
  percentual: number;
  assistido: boolean;
}

interface UseVideoProgressOptions {
  tabela: string;
  registroId: string;
  videoId: string;
  enabled?: boolean;
}

export const useVideoProgress = ({ 
  tabela, 
  registroId, 
  videoId,
  enabled = true 
}: UseVideoProgressOptions) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const lastSaveTime = useRef<number>(0);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Buscar progresso salvo
  const fetchProgress = useCallback(async () => {
    if (!user || !enabled) {
      setIsLoading(false);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("videoaulas_progresso")
        .select("*")
        .eq("user_id", user.id)
        .eq("tabela", tabela)
        .eq("registro_id", registroId)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar progresso:", error);
        return null;
      }

      if (data) {
        const progressData: VideoProgress = {
          tempo_atual: data.tempo_atual || 0,
          duracao_total: data.duracao_total || 0,
          percentual: Number(data.percentual) || 0,
          assistido: data.assistido || false,
        };
        setProgress(progressData);

        // Mostrar modal se tiver progresso > 30s e < 90%
        if (progressData.tempo_atual > 30 && progressData.percentual < 90) {
          setShowContinueModal(true);
        }

        return progressData;
      }

      return null;
    } catch (error) {
      console.error("Erro ao buscar progresso:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, tabela, registroId, enabled]);

  // Salvar progresso
  const saveProgress = useCallback(async (
    tempoAtual: number,
    duracaoTotal: number,
    forceUpdate = false
  ) => {
    if (!user || !enabled) return;

    // Evitar salvar muito frequentemente (mínimo 5s entre saves)
    const now = Date.now();
    if (!forceUpdate && now - lastSaveTime.current < 5000) {
      return;
    }
    lastSaveTime.current = now;

    const percentual = duracaoTotal > 0 
      ? Math.round((tempoAtual / duracaoTotal) * 100) 
      : 0;
    const assistido = percentual >= 90;

    try {
      const { error } = await supabase
        .from("videoaulas_progresso")
        .upsert({
          user_id: user.id,
          video_id: videoId,
          tabela,
          registro_id: registroId,
          tempo_atual: Math.round(tempoAtual),
          duracao_total: Math.round(duracaoTotal),
          percentual,
          assistido,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,tabela,registro_id"
        });

      if (error) {
        console.error("Erro ao salvar progresso:", error);
      } else {
        setProgress({
          tempo_atual: Math.round(tempoAtual),
          duracao_total: Math.round(duracaoTotal),
          percentual,
          assistido,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar progresso:", error);
    }
  }, [user, videoId, tabela, registroId, enabled]);

  // Marcar como assistido
  const markAsWatched = useCallback(async () => {
    if (!user || !enabled) return;

    try {
      const { error } = await supabase
        .from("videoaulas_progresso")
        .upsert({
          user_id: user.id,
          video_id: videoId,
          tabela,
          registro_id: registroId,
          percentual: 100,
          assistido: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,tabela,registro_id"
        });

      if (error) {
        console.error("Erro ao marcar como assistido:", error);
      } else {
        setProgress(prev => prev ? { ...prev, percentual: 100, assistido: true } : null);
      }
    } catch (error) {
      console.error("Erro ao marcar como assistido:", error);
    }
  }, [user, videoId, tabela, registroId, enabled]);

  // Fechar modal
  const dismissContinueModal = useCallback(() => {
    setShowContinueModal(false);
  }, []);

  // Iniciar interval de salvamento automático
  const startAutoSave = useCallback((getTimeCallback: () => { current: number; duration: number } | null) => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }

    saveIntervalRef.current = setInterval(() => {
      const time = getTimeCallback();
      if (time && time.current > 0 && time.duration > 0) {
        saveProgress(time.current, time.duration);
      }
    }, 10000); // A cada 10 segundos
  }, [saveProgress]);

  // Parar interval
  const stopAutoSave = useCallback(() => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
  }, []);

  // Buscar progresso inicial
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopAutoSave();
    };
  }, [stopAutoSave]);

  return {
    progress,
    isLoading,
    showContinueModal,
    dismissContinueModal,
    saveProgress,
    markAsWatched,
    startAutoSave,
    stopAutoSave,
    refetch: fetchProgress,
  };
};

// Hook para buscar progresso de múltiplos vídeos (para lista)
export const useMultipleVideoProgress = (tabela: string, registroIds: string[]) => {
  const { user } = useAuth();
  const [progressMap, setProgressMap] = useState<Record<string, VideoProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      if (!user || registroIds.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("videoaulas_progresso")
          .select("*")
          .eq("user_id", user.id)
          .eq("tabela", tabela)
          .in("registro_id", registroIds);

        if (error) {
          console.error("Erro ao buscar progresso múltiplo:", error);
          return;
        }

        const map: Record<string, VideoProgress> = {};
        data?.forEach(item => {
          map[item.registro_id] = {
            tempo_atual: item.tempo_atual || 0,
            duracao_total: item.duracao_total || 0,
            percentual: Number(item.percentual) || 0,
            assistido: item.assistido || false,
          };
        });
        setProgressMap(map);
      } catch (error) {
        console.error("Erro ao buscar progresso múltiplo:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [user, tabela, registroIds.join(",")]);

  return { progressMap, isLoading };
};

// Formatar segundos para mm:ss ou hh:mm:ss
export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
};
