import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Comentario, 
  useDeleteComentario, 
  useEditComentario, 
  useLikeComentario 
} from "@/hooks/usePoliticaComentarios";
import { ComentarioForm } from "./ComentarioForm";
import { Heart, MessageCircle, MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

interface ComentarioItemProps {
  comentario: Comentario;
  artigoId: number;
  isReply?: boolean;
}

export const ComentarioItem = ({ comentario, artigoId, isReply = false }: ComentarioItemProps) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comentario.conteudo);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteComentario = useDeleteComentario();
  const editComentario = useEditComentario();
  const likeComentario = useLikeComentario();

  const isOwner = user?.id === comentario.user_id;
  const timeAgo = formatDistanceToNow(new Date(comentario.created_at), {
    addSuffix: true,
    locale: ptBR
  });

  const handleLike = () => {
    if (!user) return;
    likeComentario.mutate({
      comentarioId: comentario.id,
      isLiked: comentario.user_liked || false,
      artigoId
    });
  };

  const handleEdit = async () => {
    if (editContent.trim().length < 3) return;
    
    await editComentario.mutateAsync({
      comentarioId: comentario.id,
      conteudo: editContent.trim(),
      artigoId
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteComentario.mutateAsync({
      comentarioId: comentario.id,
      artigoId
    });
    setShowDeleteDialog(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isReply ? 'ml-10 mt-3' : ''}`}
    >
      <div className="flex gap-3">
        <Avatar className={`${isReply ? 'w-7 h-7' : 'w-9 h-9'} shrink-0`}>
          <AvatarImage src={comentario.user?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {comentario.user?.nome?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">
              {comentario.user?.nome || 'Usuário'}
            </span>
            <span className="text-xs text-muted-foreground">
              {timeAgo}
            </span>
            {comentario.updated_at !== comentario.created_at && (
              <span className="text-xs text-muted-foreground">(editado)</span>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px] resize-none"
                maxLength={500}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={editComentario.isPending || editContent.trim().length < 3}
                >
                  {editComentario.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : 'Salvar'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comentario.conteudo);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1 text-foreground/90 whitespace-pre-wrap break-words">
              {comentario.conteudo}
            </p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-1 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 gap-1 text-xs ${comentario.user_liked ? 'text-red-500' : ''}`}
                onClick={handleLike}
                disabled={!user || likeComentario.isPending}
              >
                <Heart 
                  className={`w-3.5 h-3.5 ${comentario.user_liked ? 'fill-current' : ''}`} 
                />
                {comentario.likes_count > 0 && comentario.likes_count}
              </Button>

              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 gap-1 text-xs"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Responder
                </Button>
              )}

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil className="w-3.5 h-3.5 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-3">
              <ComentarioForm
                artigoId={artigoId}
                parentId={comentario.id}
                replyingTo={comentario.user?.nome || 'Usuário'}
                onCancel={() => setShowReplyForm(false)}
                onSuccess={() => setShowReplyForm(false)}
              />
            </div>
          )}

          {/* Replies */}
          {comentario.respostas && comentario.respostas.length > 0 && (
            <div className="mt-3 space-y-3 border-l-2 border-border/50 pl-3">
              {comentario.respostas.map((resposta) => (
                <ComentarioItem
                  key={resposta.id}
                  comentario={resposta}
                  artigoId={artigoId}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O comentário será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteComentario.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};
