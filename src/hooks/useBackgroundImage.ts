import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseBackgroundImageReturn {
  backgroundUrl: string | null;
  opacity: number;
  isLoading: boolean;
  isGenerating: boolean;
  generateNew: () => Promise<void>;
  deleteImage: () => Promise<void>;
  setOpacity: (value: number) => void;
}

const STORAGE_KEY_PREFIX = 'legislacao-background-';
const OPACITY_KEY_PREFIX = 'legislacao-opacity-';

export function useBackgroundImage(pageKey: string): UseBackgroundImageReturn {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [opacity, setOpacityState] = useState<number>(0.3);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load from localStorage and check Supabase Storage on mount
  useEffect(() => {
    const loadBackground = async () => {
      setIsLoading(true);
      
      // First, try localStorage for instant display
      const cachedUrl = localStorage.getItem(`${STORAGE_KEY_PREFIX}${pageKey}`);
      const cachedOpacity = localStorage.getItem(`${OPACITY_KEY_PREFIX}${pageKey}`);
      
      if (cachedOpacity) {
        setOpacityState(parseFloat(cachedOpacity));
      }
      
      if (cachedUrl) {
        setBackgroundUrl(cachedUrl);
        setIsLoading(false);
        return;
      }
      
      // Then check Supabase Storage
      try {
        const fileName = `background-${pageKey}.png`;
        const { data } = supabase.storage
          .from('backgrounds')
          .getPublicUrl(fileName);
        
        if (data?.publicUrl) {
          // Verify the image exists by trying to load it
          const testUrl = `${data.publicUrl}?t=${Date.now()}`;
          const response = await fetch(testUrl, { method: 'HEAD' });
          
          if (response.ok) {
            setBackgroundUrl(testUrl);
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${pageKey}`, testUrl);
          }
        }
      } catch (error) {
        console.log('[useBackgroundImage] No existing background found');
      }
      
      setIsLoading(false);
    };

    loadBackground();
  }, [pageKey]);

  // Preload image for instant display
  useEffect(() => {
    if (backgroundUrl) {
      const img = new Image();
      img.src = backgroundUrl;
    }
  }, [backgroundUrl]);

  const generateNew = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      toast.info('Gerando nova imagem de fundo...', { duration: 10000 });
      
      const { data, error } = await supabase.functions.invoke('gerar-background-legislacao', {
        body: { pageKey, action: 'generate' }
      });

      if (error) throw error;
      
      if (data?.imageUrl) {
        setBackgroundUrl(data.imageUrl);
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${pageKey}`, data.imageUrl);
        toast.success('Imagem de fundo gerada com sucesso!');
      } else {
        throw new Error('Nenhuma imagem retornada');
      }
    } catch (error: any) {
      console.error('[useBackgroundImage] Error generating:', error);
      toast.error('Erro ao gerar imagem: ' + (error.message || 'Tente novamente'));
    } finally {
      setIsGenerating(false);
    }
  }, [pageKey]);

  const deleteImage = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('gerar-background-legislacao', {
        body: { pageKey, action: 'delete' }
      });

      if (error) throw error;
      
      setBackgroundUrl(null);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${pageKey}`);
      toast.success('Imagem de fundo removida');
    } catch (error: any) {
      console.error('[useBackgroundImage] Error deleting:', error);
      toast.error('Erro ao remover imagem');
    }
  }, [pageKey]);

  const setOpacity = useCallback((value: number) => {
    setOpacityState(value);
    localStorage.setItem(`${OPACITY_KEY_PREFIX}${pageKey}`, value.toString());
  }, [pageKey]);

  return {
    backgroundUrl,
    opacity,
    isLoading,
    isGenerating,
    generateNew,
    deleteImage,
    setOpacity
  };
}
