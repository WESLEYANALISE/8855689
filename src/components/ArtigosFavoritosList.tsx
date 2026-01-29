import { Card, CardContent } from "@/components/ui/card";
import { Star, Scale, Trash2, Loader2 } from "lucide-react";
import { useArtigosFavoritos } from "@/hooks/useArtigoFavorito";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ArtigosFavoritosListProps {
  tabelaCodigo: string;
  onArtigoClick?: (artigoId: number, numeroArtigo: string) => void;
}

export const ArtigosFavoritosList = ({
  tabelaCodigo,
  onArtigoClick
}: ArtigosFavoritosListProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: favoritos, isLoading } = useArtigosFavoritos(tabelaCodigo);

  // Mutation para remover favorito
  const removeMutation = useMutation({
    mutationFn: async (favoritoId: string) => {
      const { error } = await supabase
        .from('artigos_favoritos')
        .delete()
        .eq('id', favoritoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artigos-favoritos', user?.id] });
      toast.success('Artigo removido dos favoritos');
    },
    onError: (error) => {
      console.error('Erro ao remover favorito:', error);
      toast.error('Erro ao remover favorito');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!favoritos || favoritos.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="font-medium text-foreground mb-2">
          Nenhum artigo favorito
        </h3>
        <p className="text-sm text-muted-foreground">
          Toque na estrela ⭐ ao visualizar um artigo para adicioná-lo aos favoritos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center gap-2 px-1 mb-3">
        <Star className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-foreground">
          {favoritos.length} artigo{favoritos.length !== 1 ? 's' : ''} favorito{favoritos.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {favoritos.map((favorito) => (
        <Card
          key={favorito.id}
          className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4 group"
          style={{ borderLeftColor: "hsl(45, 93%, 50%)" }}
          onClick={() => onArtigoClick?.(favorito.artigo_id, favorito.numero_artigo)}
        >
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex-shrink-0">
              <Scale className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">
                Art. {favorito.numero_artigo}
              </h3>
              {favorito.conteudo_preview && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {favorito.conteudo_preview}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeMutation.mutate(favorito.id);
                }}
                className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-all"
                disabled={removeMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
