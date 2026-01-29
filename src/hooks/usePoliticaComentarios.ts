import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Comentario {
  id: string;
  artigo_id: number;
  user_id: string;
  parent_id: string | null;
  conteudo: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    nome: string | null;
    avatar_url: string | null;
  };
  respostas?: Comentario[];
  user_liked?: boolean;
}

// Buscar comentários de um artigo
export const useComentarios = (artigoId: number | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['politica-comentarios', artigoId],
    queryFn: async () => {
      if (!artigoId) return [];

      // Buscar comentários
      const { data: comentarios, error } = await supabase
        .from('politica_comentarios')
        .select('*')
        .eq('artigo_id', artigoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!comentarios || comentarios.length === 0) return [];

      // Buscar perfis dos usuários
      const userIds = [...new Set(comentarios.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Buscar likes do usuário atual
      let userLikesSet = new Set<string>();
      if (user) {
        const { data: userLikes } = await supabase
          .from('politica_comentarios_likes')
          .select('comentario_id')
          .eq('user_id', user.id);
        
        userLikesSet = new Set(userLikes?.map(l => l.comentario_id) || []);
      }

      // Montar estrutura com respostas aninhadas
      const comentariosMap = new Map<string, Comentario>();
      const rootComentarios: Comentario[] = [];

      comentarios.forEach(c => {
        const comentario: Comentario = {
          ...c,
          user: profilesMap.get(c.user_id) || { nome: 'Usuário', avatar_url: null },
          respostas: [],
          user_liked: userLikesSet.has(c.id)
        };
        comentariosMap.set(c.id, comentario);
      });

      comentarios.forEach(c => {
        const comentario = comentariosMap.get(c.id)!;
        if (c.parent_id && comentariosMap.has(c.parent_id)) {
          comentariosMap.get(c.parent_id)!.respostas!.push(comentario);
        } else if (!c.parent_id) {
          rootComentarios.push(comentario);
        }
      });

      // Ordenar respostas por data
      rootComentarios.forEach(c => {
        c.respostas?.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      return rootComentarios;
    },
    enabled: !!artigoId
  });
};

// Adicionar comentário
export const useAddComentario = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      artigoId, 
      conteudo, 
      parentId 
    }: { 
      artigoId: number; 
      conteudo: string; 
      parentId?: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('politica_comentarios')
        .insert({
          artigo_id: artigoId,
          user_id: user.id,
          conteudo,
          parent_id: parentId || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['politica-comentarios', variables.artigoId] });
      toast.success('Comentário adicionado!');
    },
    onError: () => {
      toast.error('Erro ao adicionar comentário');
    }
  });
};

// Editar comentário
export const useEditComentario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      comentarioId, 
      conteudo,
      artigoId
    }: { 
      comentarioId: string; 
      conteudo: string;
      artigoId: number;
    }) => {
      const { error } = await supabase
        .from('politica_comentarios')
        .update({ conteudo, updated_at: new Date().toISOString() })
        .eq('id', comentarioId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['politica-comentarios', variables.artigoId] });
      toast.success('Comentário editado!');
    },
    onError: () => {
      toast.error('Erro ao editar comentário');
    }
  });
};

// Deletar comentário
export const useDeleteComentario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      comentarioId,
      artigoId 
    }: { 
      comentarioId: string;
      artigoId: number;
    }) => {
      const { error } = await supabase
        .from('politica_comentarios')
        .delete()
        .eq('id', comentarioId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['politica-comentarios', variables.artigoId] });
      toast.success('Comentário removido');
    },
    onError: () => {
      toast.error('Erro ao remover comentário');
    }
  });
};

// Toggle like
export const useLikeComentario = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      comentarioId, 
      isLiked,
      artigoId
    }: { 
      comentarioId: string; 
      isLiked: boolean;
      artigoId: number;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      if (isLiked) {
        // Remover like
        const { error } = await supabase
          .from('politica_comentarios_likes')
          .delete()
          .eq('comentario_id', comentarioId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Adicionar like
        const { error } = await supabase
          .from('politica_comentarios_likes')
          .insert({
            comentario_id: comentarioId,
            user_id: user.id
          });
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['politica-comentarios', variables.artigoId] });
    }
  });
};
