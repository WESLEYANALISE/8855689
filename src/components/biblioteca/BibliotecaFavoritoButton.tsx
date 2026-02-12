import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface BibliotecaFavoritoButtonProps {
  itemId: number;
  titulo: string;
  bibliotecaTabela: string;
  capaUrl?: string | null;
}

const BibliotecaFavoritoButton = ({ itemId, titulo, bibliotecaTabela, capaUrl }: BibliotecaFavoritoButtonProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorito } = useQuery({
    queryKey: ["biblioteca-favorito-check", user?.id, bibliotecaTabela, itemId],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("biblioteca_favoritos" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("biblioteca_tabela", bibliotecaTabela)
        .eq("item_id", itemId)
        .maybeSingle();
      return data as any;
    },
    enabled: !!user,
  });

  const isFavorited = !!favorito;

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Faça login para favoritar");
        return;
      }
      if (isFavorited) {
        const { error } = await supabase
          .from("biblioteca_favoritos" as any)
          .delete()
          .eq("id", favorito.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("biblioteca_favoritos")
          .insert({
            user_id: user.id,
            item_id: itemId,
            titulo,
            biblioteca_tabela: bibliotecaTabela,
            capa_url: capaUrl || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biblioteca-favorito-check", user?.id, bibliotecaTabela, itemId] });
      queryClient.invalidateQueries({ queryKey: ["biblioteca-favoritos"] });
      toast.success(isFavorited ? "Removido dos favoritos" : "Adicionado aos favoritos");
    },
    onError: () => {
      toast.error("Erro ao atualizar favorito");
    },
  });

  return (
    <Button
      onClick={() => toggleMutation.mutate()}
      size="lg"
      variant="outline"
      className={`shadow-lg transition-all ${isFavorited ? "border-red-500/50 text-red-500" : "border-border/50 text-muted-foreground"}`}
      disabled={toggleMutation.isPending}
    >
      <Heart className={`w-5 h-5 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
    </Button>
  );
};

export default BibliotecaFavoritoButton;
