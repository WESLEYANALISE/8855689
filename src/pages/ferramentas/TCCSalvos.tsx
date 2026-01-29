import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bookmark, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TCCSalvo {
  id: string;
  tcc_id: string;
  notas: string | null;
  created_at: string;
  tcc: {
    id: string;
    titulo: string;
    autor: string | null;
    ano: number | null;
    area_direito: string | null;
  };
}

const TCCSalvos = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salvos, setSalvos] = useState<TCCSalvo[]>([]);

  useEffect(() => {
    carregarSalvos();
  }, []);

  const carregarSalvos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Faça login para ver seus TCCs salvos");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tcc_salvos")
        .select(`
          id,
          tcc_id,
          notas,
          created_at,
          tcc:tcc_pesquisas(id, titulo, autor, ano, area_direito)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSalvos(data as unknown as TCCSalvo[]);
    } catch (error) {
      console.error("Erro ao carregar TCCs salvos:", error);
      toast.error("Erro ao carregar TCCs salvos");
    } finally {
      setLoading(false);
    }
  };

  const removerSalvo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("tcc_salvos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSalvos((prev) => prev.filter((s) => s.id !== id));
      toast.success("TCC removido dos salvos");
    } catch (error) {
      console.error("Erro ao remover TCC:", error);
      toast.error("Erro ao remover TCC");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/ferramentas/tcc")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-purple-500" />
              Meus TCCs Salvos
            </h1>
            <p className="text-xs text-muted-foreground">
              {salvos.length} trabalho{salvos.length !== 1 ? "s" : ""} salvo{salvos.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : salvos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Nenhum TCC salvo ainda</p>
              <p className="text-xs text-muted-foreground mt-1">
                Salve TCCs para acessá-los rapidamente depois
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/ferramentas/tcc/buscar")}
              >
                Buscar TCCs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {salvos.map((salvo) => (
              <Card
                key={salvo.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/ferramentas/tcc/${salvo.tcc.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      {salvo.tcc.area_direito && (
                        <Badge variant="outline" className="text-xs">
                          {salvo.tcc.area_direito}
                        </Badge>
                      )}
                      <h3 className="font-medium text-foreground line-clamp-2">
                        {salvo.tcc.titulo}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {salvo.tcc.autor && <span>{salvo.tcc.autor}</span>}
                        {salvo.tcc.ano && <span>• {salvo.tcc.ano}</span>}
                      </div>
                      {salvo.notas && (
                        <p className="text-xs text-muted-foreground italic mt-2">
                          "{salvo.notas}"
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => removerSalvo(salvo.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TCCSalvos;
