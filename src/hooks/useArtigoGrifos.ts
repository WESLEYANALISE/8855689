import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export interface Highlight {
  id: string;
  start: number;
  end: number;
  color: string;
  text?: string;
}

interface UseArtigoGrifosProps {
  tabelaCodigo: string;
  numeroArtigo: string;
  artigoId: number;
}

interface GrifosData {
  id: string;
  user_id: string;
  tabela_codigo: string;
  numero_artigo: string;
  artigo_id: number;
  highlights: Highlight[];
  updated_at: string;
  created_at: string;
}

export const useArtigoGrifos = ({
  tabelaCodigo,
  numeroArtigo,
  artigoId
}: UseArtigoGrifosProps) => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#FEF08A'); // Amarelo padrão

  // Query para buscar grifos existentes
  const { data: grifosData, isLoading } = useQuery({
    queryKey: ['artigo-grifos', user?.id, tabelaCodigo, numeroArtigo],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('artigos_grifos')
        .select('*')
        .eq('user_id', user.id)
        .eq('tabela_codigo', tabelaCodigo)
        .eq('numero_artigo', numeroArtigo)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        const parsedHighlights = Array.isArray(data.highlights) 
          ? (data.highlights as unknown as Highlight[])
          : [];
        return {
          ...data,
          highlights: parsedHighlights
        } as GrifosData;
      }
      return null;
    },
    enabled: !!user?.id && !!tabelaCodigo && !!numeroArtigo
  });

  const highlights = grifosData?.highlights || [];

  // Mutation para salvar grifos
  const saveMutation = useMutation({
    mutationFn: async (newHighlights: Highlight[]) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      // Upsert - inserir ou atualizar
      const { data, error } = await supabase
        .from('artigos_grifos')
        .upsert({
          user_id: user.id,
          tabela_codigo: tabelaCodigo,
          numero_artigo: numeroArtigo,
          artigo_id: artigoId,
          highlights: newHighlights as any,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,tabela_codigo,numero_artigo'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artigo-grifos', user?.id, tabelaCodigo, numeroArtigo] });
    },
    onError: (error) => {
      console.error('Erro ao salvar grifos:', error);
      toast.error('Erro ao salvar destaque');
    }
  });

  // Adicionar novo highlight - verificar Premium
  const addHighlight = useCallback((start: number, end: number, text: string) => {
    if (!user?.id) {
      toast.error('Faça login para destacar texto');
      return;
    }
    
    // Verificar Premium antes de adicionar novos grifos
    if (!isPremium) {
      toast.error('Grifos são exclusivos para assinantes Premium', {
        description: 'Assine agora e tenha acesso a todos os recursos!',
        action: {
          label: 'Ver planos',
          onClick: () => navigate('/assinatura')
        },
        duration: 5000
      });
      return;
    }
    
    const newHighlight: Highlight = {
      id: `hl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      start,
      end,
      color: selectedColor,
      text
    };
    
    const updatedHighlights = [...highlights, newHighlight];
    saveMutation.mutate(updatedHighlights);
  }, [user?.id, isPremium, navigate, selectedColor, highlights, saveMutation]);

  // Remover highlight por ID (sempre permitido)
  const removeHighlight = useCallback((highlightId: string) => {
    const updatedHighlights = highlights.filter(h => h.id !== highlightId);
    saveMutation.mutate(updatedHighlights);
  }, [highlights, saveMutation]);

  // Remover highlight por posição (para borracha - sempre permitido)
  const removeHighlightAtPosition = useCallback((position: number) => {
    const updatedHighlights = highlights.filter(
      h => !(position >= h.start && position <= h.end)
    );
    
    if (updatedHighlights.length !== highlights.length) {
      saveMutation.mutate(updatedHighlights);
    }
  }, [highlights, saveMutation]);

  // Limpar todos os highlights (sempre permitido)
  const clearHighlights = useCallback(() => {
    if (highlights.length > 0) {
      saveMutation.mutate([]);
      toast.success('Todos os destaques foram removidos');
    }
  }, [highlights, saveMutation]);

  return {
    highlights,
    isLoading,
    isEditing,
    setIsEditing,
    selectedColor,
    setSelectedColor,
    addHighlight,
    removeHighlight,
    removeHighlightAtPosition,
    clearHighlights,
    isSaving: saveMutation.isPending,
    isPremium
  };
};

// Cores disponíveis para grifos
export const HIGHLIGHT_COLORS = [
  { name: 'Amarelo', color: '#FEF08A', className: 'bg-yellow-200' },
  { name: 'Verde', color: '#BBF7D0', className: 'bg-green-200' },
  { name: 'Azul', color: '#BAE6FD', className: 'bg-sky-200' },
  { name: 'Rosa', color: '#FBCFE8', className: 'bg-pink-200' },
  { name: 'Laranja', color: '#FED7AA', className: 'bg-orange-200' },
];
