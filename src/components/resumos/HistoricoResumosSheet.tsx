import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Upload, Image, Trash2, ExternalLink, Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface HistoricoResumo {
  id: string;
  titulo: string;
  resumo: string;
  nivel: string;
  tipo_entrada: string;
  nome_arquivo: string | null;
  created_at: string;
}

interface HistoricoResumosSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const getIconByType = (tipo: string) => {
  switch (tipo) {
    case "texto": return <FileText className="w-4 h-4" />;
    case "pdf": return <Upload className="w-4 h-4" />;
    case "imagem": return <Image className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

const getLevelLabel = (nivel: string) => {
  switch (nivel) {
    case "super_resumido": return "Super Resumido";
    case "resumido": return "Resumido";
    case "detalhado": return "Detalhado";
    default: return nivel;
  }
};

const getLevelColor = (nivel: string) => {
  switch (nivel) {
    case "super_resumido": return "bg-blue-500/20 text-blue-400";
    case "resumido": return "bg-amber-500/20 text-amber-400";
    case "detalhado": return "bg-emerald-500/20 text-emerald-400";
    default: return "bg-muted text-muted-foreground";
  }
};

export const HistoricoResumosSheet = ({ isOpen, onClose }: HistoricoResumosSheetProps) => {
  const navigate = useNavigate();
  const [resumos, setResumos] = useState<HistoricoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistorico();
    }
  }, [isOpen]);

  const fetchHistorico = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Buscar resumos dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Usando any para contornar tipos ainda não regenerados
      const { data, error } = await (supabase as any)
        .from("resumos_personalizados_historico")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResumos(data || []);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await (supabase as any)
        .from("resumos_personalizados_historico")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setResumos((prev) => prev.filter((r) => r.id !== id));
      toast({
        title: "Resumo excluído",
        description: "O resumo foi removido do histórico.",
      });
    } catch (error) {
      console.error("Erro ao excluir resumo:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o resumo.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenResumo = (resumo: HistoricoResumo) => {
    onClose();
    navigate("/resumos-juridicos/resultado", {
      state: {
        resumo: resumo.resumo,
        titulo: resumo.titulo,
        nivel: resumo.nivel,
      },
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Histórico de Resumos
          </SheetTitle>
          <SheetDescription>
            Últimos 30 dias
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : resumos.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhum resumo encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Seus resumos aparecerão aqui
                </p>
              </div>
            ) : (
              resumos.map((resumo) => (
                <div
                  key={resumo.id}
                  className="bg-card border border-border/50 rounded-lg p-3 space-y-2 hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        {getIconByType(resumo.tipo_entrada)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm truncate">
                          {resumo.titulo || resumo.nome_arquivo || "Resumo sem título"}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getLevelColor(resumo.nivel)}`}>
                            {getLevelLabel(resumo.nivel)}
                          </span>
                          <span>•</span>
                          <span>
                            {format(new Date(resumo.created_at), "dd MMM", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenResumo(resumo)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(resumo.id)}
                        disabled={deletingId === resumo.id}
                      >
                        {deletingId === resumo.id ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {truncateText(resumo.resumo.replace(/[#*_`]/g, ""), 120)}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
