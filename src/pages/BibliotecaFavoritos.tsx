import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, BookOpen, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BibliotecaBottomNav } from "@/components/biblioteca/BibliotecaBottomNav";
import { toast } from "sonner";

const BibliotecaFavoritos = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favoritos, isLoading } = useQuery({
    queryKey: ["biblioteca-favoritos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("biblioteca_favoritos" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("biblioteca_favoritos" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biblioteca-favoritos"] });
      toast.success("Removido dos favoritos");
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <div className="text-center px-6">
          <Heart className="w-12 h-12 text-amber-500/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Faça login para ver seus favoritos</p>
        </div>
        <BibliotecaBottomNav activeTab="favoritos" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-b from-amber-950/30 to-background px-4 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Favoritos</h1>
            <p className="text-xs text-muted-foreground">Seus livros salvos</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-2">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        )}

        {!isLoading && (!favoritos || favoritos.length === 0) && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum favorito ainda</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Favorite livros nas páginas das bibliotecas</p>
          </div>
        )}

        <div className="space-y-2">
          {favoritos?.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30"
            >
              {item.capa_url ? (
                <img src={item.capa_url} alt={item.titulo} className="w-10 h-14 rounded-md object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-14 rounded-md bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-amber-500/50" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">{item.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {item.biblioteca_tabela?.replace("BIBLIOTECA-", "").replace("BIBILIOTECA-", "")}
                </p>
              </div>
              <button
                onClick={() => removeMutation.mutate(item.id)}
                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <BibliotecaBottomNav activeTab="favoritos" />
    </div>
  );
};

export default BibliotecaFavoritos;
