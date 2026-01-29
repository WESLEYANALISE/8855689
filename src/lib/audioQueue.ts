import { supabase } from "@/integrations/supabase/client";

export interface AudioQueueItem {
  id: string;
  questaoId: number;
  tipo: 'enunciado' | 'comentario' | 'exemplo';
  texto: string;
  tabela: string;
  area?: string;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
  priority?: number;
}

interface QueueStatus {
  isProcessing: boolean;
  queueLength: number;
  currentBatch: AudioQueueItem[];
  processedCount: number;
}

type StatusListener = (status: QueueStatus) => void;
type ItemProcessedListener = (item: AudioQueueItem, success: boolean, error?: string) => void;

// ============================================
// ÁUDIO DESATIVADO TEMPORARIAMENTE
// ============================================
// O processamento de áudio foi desativado.
// Para reativar, remova os returns no início das funções.

class AudioQueueService {
  private static instance: AudioQueueService;
  private statusListeners: Set<StatusListener> = new Set();
  private itemProcessedListeners: Set<ItemProcessedListener> = new Set();

  private constructor() {}

  static getInstance(): AudioQueueService {
    if (!AudioQueueService.instance) {
      AudioQueueService.instance = new AudioQueueService();
    }
    return AudioQueueService.instance;
  }

  // DESATIVADO: Não adiciona mais à fila
  addToQueue(item: AudioQueueItem): void {
    console.log('[AudioQueue] ⏸️ Áudio desativado - ignorando item:', item.tipo);
    return;
  }

  // DESATIVADO: Não adiciona mais à fila
  addBatchToQueue(items: AudioQueueItem[]): void {
    console.log('[AudioQueue] ⏸️ Áudio desativado - ignorando batch de', items.length, 'itens');
    return;
  }

  removeFromQueue(id: string): void {
    // Não faz nada - fila desativada
  }

  pauseQueue(): void {
    // Não faz nada - fila desativada
  }

  resumeQueue(): void {
    // Não faz nada - fila desativada
  }

  clearQueue(): void {
    // Não faz nada - fila desativada
  }

  resetProcessedCount(): void {
    // Não faz nada - fila desativada
  }

  getStatus(): QueueStatus {
    return {
      isProcessing: false,
      queueLength: 0,
      currentBatch: [],
      processedCount: 0,
    };
  }

  addStatusListener(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  addItemProcessedListener(listener: ItemProcessedListener): () => void {
    this.itemProcessedListeners.add(listener);
    return () => this.itemProcessedListeners.delete(listener);
  }
}

export const audioQueue = AudioQueueService.getInstance();

// Hook para usar em componentes React
import { useState, useEffect } from "react";

export function useAudioQueue(onItemProcessed?: ItemProcessedListener) {
  const [status, setStatus] = useState<QueueStatus>(audioQueue.getStatus());

  useEffect(() => {
    const cleanup = audioQueue.addStatusListener(setStatus);
    return cleanup;
  }, []);

  useEffect(() => {
    if (onItemProcessed) {
      const cleanup = audioQueue.addItemProcessedListener(onItemProcessed);
      return cleanup;
    }
  }, [onItemProcessed]);

  return {
    ...status,
    addToQueue: (item: AudioQueueItem) => audioQueue.addToQueue(item),
    addBatchToQueue: (items: AudioQueueItem[]) => audioQueue.addBatchToQueue(items),
    removeFromQueue: (id: string) => audioQueue.removeFromQueue(id),
    pauseQueue: () => audioQueue.pauseQueue(),
    resumeQueue: () => audioQueue.resumeQueue(),
    clearQueue: () => audioQueue.clearQueue(),
    resetProcessedCount: () => audioQueue.resetProcessedCount(),
  };
}
