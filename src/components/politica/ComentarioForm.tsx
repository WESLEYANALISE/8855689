import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useAddComentario } from "@/hooks/usePoliticaComentarios";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ComentarioFormProps {
  artigoId: number;
  parentId?: string;
  replyingTo?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export const ComentarioForm = ({
  artigoId,
  parentId,
  replyingTo,
  onCancel,
  onSuccess
}: ComentarioFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conteudo, setConteudo] = useState("");

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('nome, avatar_url')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });
  const addComentario = useAddComentario();

  const maxLength = 500;
  const isValid = conteudo.trim().length >= 3 && conteudo.length <= maxLength;

  const handleSubmit = async () => {
    if (!isValid) return;

    await addComentario.mutateAsync({
      artigoId,
      conteudo: conteudo.trim(),
      parentId
    });

    setConteudo("");
    onSuccess?.();
  };

  if (!user) {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/50">
        <p className="text-sm text-muted-foreground flex-1">
          Faça login para participar da discussão
        </p>
        <Button 
          size="sm" 
          onClick={() => navigate('/auth')}
          className="shrink-0"
        >
          Entrar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {replyingTo && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Respondendo a <strong>@{replyingTo}</strong></span>
          {onCancel && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={onCancel}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {profile?.nome?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <Textarea
            placeholder={replyingTo ? "Escreva sua resposta..." : "Adicione um comentário..."}
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            className="min-h-[80px] resize-none bg-background/50"
            maxLength={maxLength}
          />

          <div className="flex items-center justify-between">
            <span className={`text-xs ${conteudo.length > maxLength * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {conteudo.length}/{maxLength}
            </span>

            <div className="flex gap-2">
              {onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                >
                  Cancelar
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!isValid || addComentario.isPending}
                className="gap-1.5"
              >
                {addComentario.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {parentId ? 'Responder' : 'Comentar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
