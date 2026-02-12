import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, BookOpen, Loader2, Trash2, ChevronRight, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { BibliotecaBottomNav } from "@/components/biblioteca/BibliotecaBottomNav";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const BIBLIOTECA_ROUTE_MAP: Record<string, string> = {
  "BIBLIOTECA-ESTUDOS": "/biblioteca-estudos",
  "BIBILIOTECA-OAB": "/biblioteca-oab",
  "BIBLIOTECA-CLASSICOS": "/biblioteca-classicos",
  "BIBLIOTECA-FORA-DA-TOGA": "/biblioteca-fora-da-toga",
  "BIBLIOTECA-LIDERANÇA": "/biblioteca-lideranca",
  "BIBLIOTECA-ORATORIA": "/biblioteca-oratoria",
  "BIBLIOTECA-PORTUGUES": "/biblioteca-portugues",
  "BIBLIOTECA-PESQUISA-CIENTIFICA": "/biblioteca-pesquisa-cientifica",
  "BIBLIOTECA-POLITICA": "/biblioteca-politica",
};

const BIBLIOTECA_LABEL_MAP: Record<string, string> = {
  "BIBLIOTECA-ESTUDOS": "📚 Estudos Jurídicos",
  "BIBILIOTECA-OAB": "⚖️ OAB",
  "BIBLIOTECA-CLASSICOS": "📖 Clássicos",
  "BIBLIOTECA-FORA-DA-TOGA": "🌎 Fora da Toga",
  "BIBLIOTECA-LIDERANÇA": "🏆 Liderança",
  "BIBLIOTECA-ORATORIA": "🎤 Oratória",
  "BIBLIOTECA-PORTUGUES": "🇧🇷 Português",
  "BIBLIOTECA-PESQUISA-CIENTIFICA": "🔬 Pesquisa Científica",
  "BIBLIOTECA-POLITICA": "🏛️ Política",
};

// Mapa de campos de capa por tabela
const CAPA_FIELD_MAP: Record<string, string> = {
  "BIBLIOTECA-ESTUDOS": "url_capa_gerada",
  "BIBILIOTECA-OAB": "Capa-livro",
  "BIBLIOTECA-CLASSICOS": "imagem",
  "BIBLIOTECA-FORA-DA-TOGA": "capa-livro",
  "BIBLIOTECA-LIDERANÇA": "imagem",
  "BIBLIOTECA-ORATORIA": "imagem",
  "BIBLIOTECA-PORTUGUES": "imagem",
  "BIBLIOTECA-PESQUISA-CIENTIFICA": "imagem",
  "BIBLIOTECA-POLITICA": "imagem",
};

const BibliotecaFavoritos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  // Buscar capas faltantes
  const favoritosSemCapa = favoritos?.filter((f: any) => !f.capa_url) || [];
  const { data: capasExtras } = useQuery({
    queryKey: ["biblioteca-favoritos-capas", favoritosSemCapa.map((f: any) => f.id).join(",")],
    queryFn: async () => {
      const results: Record<string, string> = {};
      // Agrupar por tabela
      const porTabela: Record<string, any[]> = {};
      favoritosSemCapa.forEach((f: any) => {
        if (!porTabela[f.biblioteca_tabela]) porTabela[f.biblioteca_tabela] = [];
        porTabela[f.biblioteca_tabela].push(f);
      });

      for (const [tabela, favs] of Object.entries(porTabela)) {
        const capaField = CAPA_FIELD_MAP[tabela];
        if (!capaField) continue;
        const ids = favs.map((f: any) => f.item_id);
        try {
          const { data } = await (supabase as any)
            .from(tabela)
            .select(`id, "${capaField}"`)
            .in("id", ids);
          if (data) {
            data.forEach((d: any) => {
              const url = d[capaField];
              if (url) {
                const fav = favs.find((f: any) => f.item_id === d.id);
                if (fav) results[fav.id] = url;
              }
            });
          }
        } catch { /* silently fail */ }
      }
      return results;
    },
    enabled: favoritosSemCapa.length > 0,
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

  const handleNavigate = (item: any) => {
    const baseRoute = BIBLIOTECA_ROUTE_MAP[item.biblioteca_tabela];
    if (baseRoute) {
      navigate(`${baseRoute}/${item.item_id}`);
    }
  };

  const getCapaUrl = (item: any) => {
    if (item.capa_url) return item.capa_url;
    if (capasExtras && capasExtras[item.id]) return capasExtras[item.id];
    return null;
  };

  // Agrupar por biblioteca
  const grouped = (favoritos || []).reduce((acc: Record<string, any[]>, item: any) => {
    const key = item.biblioteca_tabela || "OUTROS";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

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
            <p className="text-xs text-muted-foreground">
              {favoritos?.length || 0} livros salvos
              {Object.keys(grouped).length > 0 && ` em ${Object.keys(grouped).length} categorias`}
            </p>
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

        {Object.entries(grouped).map(([tabela, items]) => (
          <div key={tabela} className="mb-6">
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {BIBLIOTECA_LABEL_MAP[tabela] || tabela.replace("BIBLIOTECA-", "")}
              </h2>
              <span className="text-[10px] text-muted-foreground/60 bg-card px-2 py-0.5 rounded-full border border-border/30">
                {(items as any[]).length} {(items as any[]).length === 1 ? "livro" : "livros"}
              </span>
            </div>
            <div className="space-y-2">
              {(items as any[]).map((item: any) => {
                const capa = getCapaUrl(item);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30 cursor-pointer hover:border-amber-500/30 transition-colors group"
                    onClick={() => handleNavigate(item)}
                  >
                    {capa ? (
                      <img
                        src={capa}
                        alt={item.titulo}
                        className="w-14 h-20 rounded-lg object-cover flex-shrink-0 shadow-md"
                      />
                    ) : (
                      <div className="w-14 h-20 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-amber-500/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{item.titulo}</p>
                      {item.created_at && (
                        <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          Favoritado em {format(parseISO(item.created_at), "dd/MM/yy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMutation.mutate(item.id);
                        }}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <BibliotecaBottomNav activeTab="favoritos" />
    </div>
  );
};

export default BibliotecaFavoritos;
