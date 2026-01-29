import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LivroSemCapa {
  id: number;
  tema: string;
}

interface UseCapasAutoGenerationProps {
  area: string | null;
  enabled: boolean;
}

export const useBibliotecaCapasAutoGeneration = ({ area, enabled }: UseCapasAutoGenerationProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentLivro, setCurrentLivro] = useState<string | null>(null);
  const [processados, setProcessados] = useState(0);
  const [total, setTotal] = useState(0);
  const [livrosSemCapa, setLivrosSemCapa] = useState<LivroSemCapa[]>([]);
  const generationStarted = useRef(false);
  const abortRef = useRef(false);

  // Verificar livros sem capa na área
  const verificarLivrosSemCapa = useCallback(async () => {
    if (!area) return;

    try {
      const { data, error } = await supabase.functions.invoke('gerar-capas-biblioteca-estudos', {
        body: { area }
      });

      if (error) throw error;

      setTotal(data.total || 0);
      setLivrosSemCapa(data.livrosSemCapa || []);
      setProcessados(data.total - data.semCapa);

      return data.livrosSemCapa || [];
    } catch (error) {
      console.error('Erro ao verificar livros sem capa:', error);
      return [];
    }
  }, [area]);

  // Gerar capa para um livro específico
  const gerarCapaLivro = useCallback(async (livroId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('gerar-capas-biblioteca-estudos', {
        body: { livroId }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao gerar capa:', error);
      throw error;
    }
  }, []);

  // Processo de geração automática sequencial
  const iniciarGeracaoAutomatica = useCallback(async () => {
    if (!area || generationStarted.current || isGenerating) return;

    generationStarted.current = true;
    abortRef.current = false;

    const livros = await verificarLivrosSemCapa();
    
    if (!livros || livros.length === 0) {
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);

    for (const livro of livros) {
      if (abortRef.current) break;

      setCurrentLivro(livro.tema);

      try {
        await gerarCapaLivro(livro.id);
        setProcessados(prev => prev + 1);
        
        // Delay entre gerações para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Erro ao gerar capa para ${livro.tema}:`, error);
        // Continua para o próximo livro
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    setIsGenerating(false);
    setCurrentLivro(null);
    toast.success('Geração de capas concluída!');
  }, [area, verificarLivrosSemCapa, gerarCapaLivro, isGenerating]);

  // Iniciar verificação e geração quando área muda
  useEffect(() => {
    if (area && enabled) {
      generationStarted.current = false;
      verificarLivrosSemCapa().then(livros => {
        if (livros && livros.length > 0) {
          iniciarGeracaoAutomatica();
        }
      });
    }

    return () => {
      abortRef.current = true;
    };
  }, [area, enabled]);

  const cancelar = useCallback(() => {
    abortRef.current = true;
    setIsGenerating(false);
    setCurrentLivro(null);
    toast.info('Geração cancelada');
  }, []);

  return {
    isGenerating,
    currentLivro,
    processados,
    total,
    livrosSemCapa: livrosSemCapa.length,
    cancelar,
    verificarLivrosSemCapa
  };
};
