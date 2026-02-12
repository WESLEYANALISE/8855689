import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, BookOpen, MessageSquare, Trash2, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BibliotecaBottomNav } from "@/components/biblioteca/BibliotecaBottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

type StatusType = "quero_ler" | "lendo" | "concluido";

const STATUS_LABELS: Record<StatusType, string> = {
  quero_ler: "Quero Ler",
  lendo: "Lendo",
  concluido: "Concluído",
};

const BibliotecaPlanoLeitura = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState<StatusType>("lendo");
  const [editItem, setEditItem] = useState<any>(null);
  const [comentario, setComentario] = useState("");
  const [progresso, setProgresso] = useState(0);

  const { data: items, isLoading } = useQuery({
    queryKey: ["biblioteca-plano-leitura", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("biblioteca_plano_leitura" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from("biblioteca_plano_leitura" as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biblioteca-plano-leitura"] });
      toast.success("Atualizado!");
      setEditItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("biblioteca_plano_leitura" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biblioteca-plano-leitura"] });
      toast.success("Removido do plano!");
    },
  });

  const filtered = items?.filter((i: any) => i.status === activeStatus) || [];

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <div className="text-center px-6">
          <Target className="w-12 h-12 text-amber-500/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Faça login para acessar seu plano de leitura</p>
        </div>
        <BibliotecaBottomNav activeTab="plano" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-b from-amber-950/30 to-background px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Plano de Leitura</h1>
            <p className="text-xs text-muted-foreground">Organize suas leituras jurídicas</p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 bg-card rounded-xl p-1 border border-border/30">
          {(Object.keys(STATUS_LABELS) as StatusType[]).map((status) => {
            const count = items?.filter((i: any) => i.status === status).length || 0;
            return (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  activeStatus === status
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {STATUS_LABELS[status]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 mt-2">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum livro em "{STATUS_LABELS[activeStatus]}"</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Adicione livros ao seu plano nas páginas das bibliotecas</p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30"
            >
              {item.capa_url ? (
                <img src={item.capa_url} alt={item.titulo} className="w-12 h-16 rounded-md object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-16 rounded-md bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-amber-500/50" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">{item.titulo}</p>
                {item.comentario && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {item.comentario}
                  </p>
                )}
                {activeStatus === "lendo" && (
                  <div className="mt-1.5">
                    <Progress value={item.progresso} className="h-1.5" />
                    <span className="text-[10px] text-muted-foreground">{item.progresso}%</span>
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditItem(item);
                    setComentario(item.comentario || "");
                    setProgresso(item.progresso || 0);
                  }}
                  className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{editItem?.titulo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <div className="flex gap-1">
                {(Object.keys(STATUS_LABELS) as StatusType[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      updateMutation.mutate({ id: editItem.id, updates: { status: s } });
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      editItem?.status === s
                        ? "bg-amber-500 text-white"
                        : "bg-card border border-border text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {editItem?.status === "lendo" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Progresso: {progresso}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progresso}
                  onChange={(e) => setProgresso(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Anotação</label>
              <Textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Suas anotações sobre este livro..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                deleteMutation.mutate(editItem.id);
                setEditItem(null);
              }}
            >
              <Trash2 className="w-3 h-3 mr-1" /> Remover
            </Button>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600"
              onClick={() => {
                updateMutation.mutate({
                  id: editItem.id,
                  updates: { comentario, progresso },
                });
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BibliotecaBottomNav activeTab="plano" />
    </div>
  );
};

export default BibliotecaPlanoLeitura;
