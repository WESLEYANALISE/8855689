import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";
import { toast } from "sonner";

export interface LeiInfo {
  lei_id: string;
  titulo: string;
  sigla?: string;
  cor?: string;
  route: string;
}

export type CategoriaLei = 
  | 'codigos' 
  | 'estatutos' 
  | 'legislacao_penal' 
  | 'previdenciario' 
  | 'sumulas' 
  | 'leis_ordinarias';

// Hook para buscar leis favoritas de uma categoria
export function useLeisFavoritas(categoria: CategoriaLei) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leis-favoritas', user?.id, categoria],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('leis_favoritas')
        .select('*')
        .eq('user_id', user.id)
        .eq('categoria', categoria)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

// Hook para buscar leis recentes de uma categoria
export function useLeisRecentes(categoria: CategoriaLei) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leis-recentes', user?.id, categoria],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('leis_recentes')
        .select('*')
        .eq('user_id', user.id)
        .eq('categoria', categoria)
        .order('accessed_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

// Hook para verificar se uma lei é favorita
export function useIsLeiFavorita(categoria: CategoriaLei, leiId: string) {
  const { data: favoritas } = useLeisFavoritas(categoria);
  return favoritas?.some(f => f.lei_id === leiId) ?? false;
}

// Hook para toggle de favorito
export function useToggleFavorita(categoria: CategoriaLei) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (lei: LeiInfo) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('leis_favoritas')
        .insert({
          user_id: user.id,
          categoria,
          lei_id: lei.lei_id,
          titulo: lei.titulo,
          sigla: lei.sigla,
          cor: lei.cor,
          route: lei.route,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leis-favoritas', user?.id, categoria] });
      toast.success('Adicionado aos favoritos');
    },
    onError: () => {
      toast.error('Erro ao adicionar favorito');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (leiId: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('leis_favoritas')
        .delete()
        .eq('user_id', user.id)
        .eq('categoria', categoria)
        .eq('lei_id', leiId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leis-favoritas', user?.id, categoria] });
      toast.success('Removido dos favoritos');
    },
    onError: () => {
      toast.error('Erro ao remover favorito');
    },
  });

  const toggle = useCallback((lei: LeiInfo, isFavorita: boolean) => {
    if (isFavorita) {
      removeMutation.mutate(lei.lei_id);
    } else {
      addMutation.mutate(lei);
    }
  }, [addMutation, removeMutation]);

  return {
    toggle,
    isLoading: addMutation.isPending || removeMutation.isPending,
  };
}

// Hook para registrar acesso a uma lei (recentes)
export function useRegistrarAcesso(categoria: CategoriaLei) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lei: LeiInfo) => {
      if (!user) return;
      
      // Upsert - atualiza accessed_at se já existe, ou insere novo
      const { error } = await supabase
        .from('leis_recentes')
        .upsert({
          user_id: user.id,
          categoria,
          lei_id: lei.lei_id,
          titulo: lei.titulo,
          sigla: lei.sigla,
          cor: lei.cor,
          route: lei.route,
          accessed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,categoria,lei_id',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leis-recentes', user?.id, categoria] });
    },
  });
}
