import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageSquare, Send, LogIn } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DocumentarioComentariosProps {
  documentarioId: string;
}

interface Comentario {
  id: string;
  conteudo: string;
  user_id: string;
  created_at: string;
  parent_id: string | null;
  usuario?: {
    nome: string;
    avatar_url: string | null;
  };
  likes: number;
  liked: boolean;
  respostas?: Comentario[];
}

export function DocumentarioComentarios({ documentarioId }: DocumentarioComentariosProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [novoComentario, setNovoComentario] = useState('');
  const [respondendoA, setRespondendoA] = useState<string | null>(null);
  const [respostaTexto, setRespostaTexto] = useState('');

  // Buscar perfil do usuário
  const { data: perfil } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('nome, avatar_url')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Buscar comentários
  const { data: comentarios, isLoading } = useQuery({
    queryKey: ['documentario-comentarios', documentarioId],
    queryFn: async () => {
      // Buscar comentários
      const { data: comentariosData, error } = await supabase
        .from('politica_documentarios_comentarios')
        .select('*')
        .eq('documentario_id', documentarioId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!comentariosData) return [];

      // Buscar perfis
      const userIds = [...new Set(comentariosData.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      // Buscar likes
      const comentarioIds = comentariosData.map(c => c.id);
      const { data: allLikes } = await supabase
        .from('politica_documentarios_comentarios_likes')
        .select('comentario_id, user_id')
        .in('comentario_id', comentarioIds);

      // Montar estrutura
      const comentariosMap = new Map<string, Comentario>();
      
      comentariosData.forEach(c => {
        const profile = profileMap.get(c.user_id);
        const likesDoComentario = allLikes?.filter(l => l.comentario_id === c.id) || [];
        
        comentariosMap.set(c.id, {
          id: c.id,
          conteudo: c.conteudo,
          user_id: c.user_id,
          created_at: c.created_at,
          parent_id: c.parent_id,
          usuario: profile ? { nome: profile.nome || 'Usuário', avatar_url: profile.avatar_url } : undefined,
          likes: likesDoComentario.length,
          liked: likesDoComentario.some(l => l.user_id === user?.id),
          respostas: [],
        });
      });

      // Organizar em árvore
      const raiz: Comentario[] = [];
      comentariosMap.forEach(c => {
        if (c.parent_id && comentariosMap.has(c.parent_id)) {
          comentariosMap.get(c.parent_id)!.respostas!.push(c);
        } else {
          raiz.push(c);
        }
      });

      return raiz;
    },
  });

  // Mutation para adicionar comentário
  const addComentario = useMutation({
    mutationFn: async ({ conteudo, parentId }: { conteudo: string; parentId?: string }) => {
      if (!user?.id) throw new Error('Não autenticado');
      
      const { error } = await supabase
        .from('politica_documentarios_comentarios')
        .insert({
          documentario_id: documentarioId,
          user_id: user.id,
          conteudo,
          parent_id: parentId || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentario-comentarios', documentarioId] });
      setNovoComentario('');
      setRespondendoA(null);
      setRespostaTexto('');
      toast.success('Comentário adicionado!');
    },
    onError: () => {
      toast.error('Erro ao comentar');
    },
  });

  // Mutation para curtir
  const toggleLike = useMutation({
    mutationFn: async ({ comentarioId, liked }: { comentarioId: string; liked: boolean }) => {
      if (!user?.id) throw new Error('Não autenticado');
      
      if (liked) {
        await supabase
          .from('politica_documentarios_comentarios_likes')
          .delete()
          .eq('comentario_id', comentarioId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('politica_documentarios_comentarios_likes')
          .insert({
            comentario_id: comentarioId,
            user_id: user.id,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentario-comentarios', documentarioId] });
    },
  });

  const handleEnviar = () => {
    if (!novoComentario.trim()) return;
    addComentario.mutate({ conteudo: novoComentario.trim() });
  };

  const handleResponder = (parentId: string) => {
    if (!respostaTexto.trim()) return;
    addComentario.mutate({ conteudo: respostaTexto.trim(), parentId });
  };

  const handleLike = (comentarioId: string, liked: boolean) => {
    if (!user) {
      toast.error('Faça login para curtir');
      return;
    }
    toggleLike.mutate({ comentarioId, liked });
  };

  const totalComentarios = (comentarios?.length || 0) + 
    (comentarios?.reduce((acc, c) => acc + (c.respostas?.length || 0), 0) || 0);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <LogIn className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">Faça login para participar da discussão</p>
        <Button onClick={() => navigate('/auth')}>
          Entrar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Comentários</h3>
        <span className="text-sm text-muted-foreground">({totalComentarios})</span>
      </div>

      {/* Form para novo comentário */}
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={perfil?.avatar_url || undefined} />
          <AvatarFallback>{perfil?.nome?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            placeholder="Escreva um comentário..."
            className="min-h-[80px] bg-white/5 border-white/10"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleEnviar}
              disabled={!novoComentario.trim() || addComentario.isPending}
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de comentários */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-16" />
              </div>
            </div>
          ))}
        </div>
      ) : comentarios && comentarios.length > 0 ? (
        <div className="space-y-4">
          {comentarios.map((comentario) => (
            <ComentarioItem
              key={comentario.id}
              comentario={comentario}
              onLike={handleLike}
              onResponder={(id) => setRespondendoA(id === respondendoA ? null : id)}
              respondendoA={respondendoA}
              respostaTexto={respostaTexto}
              setRespostaTexto={setRespostaTexto}
              handleResponder={handleResponder}
              isPending={addComentario.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Seja o primeiro a comentar!</p>
        </div>
      )}
    </div>
  );
}

interface ComentarioItemProps {
  comentario: Comentario;
  onLike: (id: string, liked: boolean) => void;
  onResponder: (id: string) => void;
  respondendoA: string | null;
  respostaTexto: string;
  setRespostaTexto: (text: string) => void;
  handleResponder: (parentId: string) => void;
  isPending: boolean;
  isReply?: boolean;
}

function ComentarioItem({
  comentario,
  onLike,
  onResponder,
  respondendoA,
  respostaTexto,
  setRespostaTexto,
  handleResponder,
  isPending,
  isReply = false,
}: ComentarioItemProps) {
  return (
    <div className={`${isReply ? 'ml-12 mt-3' : ''}`}>
      <div className="flex gap-3">
        <Avatar className={isReply ? 'w-8 h-8' : 'w-10 h-10'}>
          <AvatarImage src={comentario.usuario?.avatar_url || undefined} />
          <AvatarFallback>{comentario.usuario?.nome?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comentario.usuario?.nome || 'Usuário'}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comentario.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
          <p className="text-sm text-neutral-300 mt-1 whitespace-pre-line">{comentario.conteudo}</p>
          
          {/* Ações */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => onLike(comentario.id, comentario.liked)}
              className={`flex items-center gap-1 text-xs transition-colors ${
                comentario.liked ? 'text-red-400' : 'text-muted-foreground hover:text-red-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${comentario.liked ? 'fill-current' : ''}`} />
              {comentario.likes > 0 && comentario.likes}
            </button>
            {!isReply && (
              <button
                onClick={() => onResponder(comentario.id)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Responder
              </button>
            )}
          </div>

          {/* Form de resposta */}
          {respondendoA === comentario.id && !isReply && (
            <div className="mt-3 flex gap-2">
              <Textarea
                value={respostaTexto}
                onChange={(e) => setRespostaTexto(e.target.value)}
                placeholder="Escreva uma resposta..."
                className="min-h-[60px] text-sm bg-white/5 border-white/10"
              />
              <Button
                size="sm"
                onClick={() => handleResponder(comentario.id)}
                disabled={!respostaTexto.trim() || isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Respostas */}
      {comentario.respostas && comentario.respostas.length > 0 && (
        <div className="space-y-3 mt-3">
          {comentario.respostas.map((resposta) => (
            <ComentarioItem
              key={resposta.id}
              comentario={resposta}
              onLike={onLike}
              onResponder={onResponder}
              respondendoA={respondendoA}
              respostaTexto={respostaTexto}
              setRespostaTexto={setRespostaTexto}
              handleResponder={handleResponder}
              isPending={isPending}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
