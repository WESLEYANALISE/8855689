import { supabase } from "@/integrations/supabase/client";

export interface ImageQueueItem {
  id: string;
  questaoId: number;
  exemploTexto: string;
  area: string;
  tema: string;
  tabela: string;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
  priority?: number;
}

interface QueueStatus {
  isProcessing: boolean;
  queueLength: number;
  currentItem: ImageQueueItem | null;
}

type StatusListener = (status: QueueStatus) => void;
type ItemProcessedListener = (item: ImageQueueItem, success: boolean, error?: string) => void;

class ImageQueueService {
  private static instance: ImageQueueService;
  private queue: ImageQueueItem[] = [];
  private isProcessing = false;
  private isPaused = false;
  private currentBatch: ImageQueueItem[] = [];
  private processedCount = 0;
  private statusListeners: Set<StatusListener> = new Set();
  private itemProcessedListeners: Set<ItemProcessedListener> = new Set();
  
  // Contador de itens por área para priorização
  private areaItemCounts: Map<string, number> = new Map();
  
  // Processar 4 imagens de uma vez
  private readonly CONCURRENCY = 4;
  // Intervalo entre lotes (2 segundos)
  private readonly DELAY_MS = 2000;

  private constructor() {}

  static getInstance(): ImageQueueService {
    if (!ImageQueueService.instance) {
      ImageQueueService.instance = new ImageQueueService();
    }
    return ImageQueueService.instance;
  }

  // Calcular prioridade baseada na quantidade de itens da área
  // Áreas com MENOS itens têm prioridade MAIOR (número menor)
  private calculatePriority(area: string): number {
    const count = this.areaItemCounts.get(area) || 0;
    // Prioridade: áreas com menos itens vão primeiro
    // 1-10 itens = prioridade 1, 11-50 = prioridade 2, 51-100 = prioridade 3, etc
    if (count <= 10) return 1;
    if (count <= 50) return 2;
    if (count <= 100) return 3;
    if (count <= 200) return 4;
    if (count <= 500) return 5;
    return 6;
  }

  // Reordenar fila por prioridade
  private reorderQueue(): void {
    // Recalcular contagem de itens por área
    this.areaItemCounts.clear();
    for (const item of this.queue) {
      const count = this.areaItemCounts.get(item.area) || 0;
      this.areaItemCounts.set(item.area, count + 1);
    }
    
    // Atualizar prioridade de cada item baseado na contagem da área
    for (const item of this.queue) {
      item.priority = this.calculatePriority(item.area);
    }
    
    // Ordenar: menor prioridade primeiro
    this.queue.sort((a, b) => (a.priority || 100) - (b.priority || 100));
  }

  // Adicionar item à fila
  addToQueue(item: ImageQueueItem): void {
    // Evitar duplicatas
    const exists = this.queue.some(q => q.questaoId === item.questaoId);
    if (exists) {
      console.log(`[ImageQueue] Questão ${item.questaoId} já está na fila`);
      return;
    }

    this.queue.push(item);
    
    // Reordenar por prioridade (áreas com menos itens primeiro)
    this.reorderQueue();
    
    console.log(`[ImageQueue] Adicionado à fila: questão ${item.questaoId} (${item.area}). Tamanho: ${this.queue.length}. Prioridade: ${item.priority}`);
    this.notifyListeners();
    
    // Iniciar processamento se não estiver rodando
    if (!this.isProcessing && !this.isPaused) {
      this.processQueue();
    }
  }

  // Remover item da fila
  removeFromQueue(id: string): void {
    this.queue = this.queue.filter(item => item.id !== id);
    console.log(`[ImageQueue] Removido da fila: ${id}. Tamanho: ${this.queue.length}`);
    this.notifyListeners();
  }

  // Pausar processamento
  pauseQueue(): void {
    this.isPaused = true;
    console.log('[ImageQueue] Fila pausada');
    this.notifyListeners();
  }

  // Retomar processamento
  resumeQueue(): void {
    this.isPaused = false;
    console.log('[ImageQueue] Fila retomada');
    this.notifyListeners();
    
    if (!this.isProcessing && this.queue.length > 0) {
      this.processQueue();
    }
  }

  // Limpar fila
  clearQueue(): void {
    this.queue = [];
    this.isProcessing = false;
    this.isPaused = false;
    this.currentBatch = [];
    console.log('[ImageQueue] Fila limpa e estado resetado');
    this.notifyListeners();
  }

  // Forçar reinício do processamento (para casos de fila travada)
  forceRestart(): void {
    console.log('[ImageQueue] Forçando reinício do processamento');
    this.isProcessing = false;
    this.isPaused = false;
    if (this.queue.length > 0) {
      this.processQueue();
    }
    this.notifyListeners();
  }

  resetProcessedCount(): void {
    this.processedCount = 0;
  }

  getStatus(): QueueStatus {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.queue.length,
      currentItem: this.currentBatch[0] || null,
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

  private notifyListeners(): void {
    const status = this.getStatus();
    this.statusListeners.forEach(listener => listener(status));
  }

  private notifyItemProcessed(item: ImageQueueItem, success: boolean, error?: string): void {
    this.itemProcessedListeners.forEach(listener => listener(item, success, error));
  }

  private async processItem(item: ImageQueueItem): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke("gerar-imagem-exemplo", {
        body: {
          questaoId: item.questaoId,
          exemploTexto: item.exemploTexto,
          area: item.area,
          tema: item.tema,
          tabela: item.tabela,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const imageUrl = data?.url || data?.url_imagem;
      
      if (imageUrl) {
        console.log(`[ImageQueue] ✅ Imagem gerada para questão ${item.questaoId}`);
        item.onSuccess?.(imageUrl);
        this.notifyItemProcessed(item, true);
      } else {
        throw new Error("URL da imagem não retornada");
      }
    } catch (error) {
      console.error(`[ImageQueue] ❌ Erro na questão ${item.questaoId}:`, error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      item.onError?.(error instanceof Error ? error : new Error(errorMsg));
      this.notifyItemProcessed(item, false, errorMsg);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.isPaused || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.notifyListeners();

    console.log(`[ImageQueue] Iniciando processamento. Total na fila: ${this.queue.length}`);

    while (this.queue.length > 0 && !this.isPaused) {
      // Pegar lote de CONCURRENCY itens
      const batch = this.queue.splice(0, this.CONCURRENCY);
      this.currentBatch = batch;
      this.notifyListeners();

      console.log(`[ImageQueue] Processando lote de ${batch.length} imagens. Restantes: ${this.queue.length}`);

      // Processar lote em paralelo
      await Promise.all(batch.map(item => this.processItem(item)));
      
      this.processedCount += batch.length;
      this.currentBatch = [];
      this.notifyListeners();

      // Delay entre lotes
      if (this.queue.length > 0 && !this.isPaused) {
        console.log(`[ImageQueue] Aguardando ${this.DELAY_MS / 1000}s antes do próximo lote...`);
        await this.delay(this.DELAY_MS);
      }
    }

    this.isProcessing = false;
    this.currentBatch = [];
    this.notifyListeners();
    console.log(`[ImageQueue] Processamento concluído. Total processado: ${this.processedCount}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exportar instância singleton
export const imageQueue = ImageQueueService.getInstance();

// Hook para usar em componentes React
import { useState, useEffect } from "react";

export function useImageQueue(onItemProcessed?: ItemProcessedListener) {
  const [status, setStatus] = useState<QueueStatus>(imageQueue.getStatus());

  useEffect(() => {
    const cleanup = imageQueue.addStatusListener(setStatus);
    return cleanup;
  }, []);

  useEffect(() => {
    if (onItemProcessed) {
      const cleanup = imageQueue.addItemProcessedListener(onItemProcessed);
      return cleanup;
    }
  }, [onItemProcessed]);

  return {
    ...status,
    addToQueue: (item: ImageQueueItem) => imageQueue.addToQueue(item),
    removeFromQueue: (id: string) => imageQueue.removeFromQueue(id),
    pauseQueue: () => imageQueue.pauseQueue(),
    resumeQueue: () => imageQueue.resumeQueue(),
    clearQueue: () => imageQueue.clearQueue(),
  };
}
