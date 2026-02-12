import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, BookOpen, MessageSquare, Trash2, ChevronRight, Loader2, Plus, Search, X, ArrowLeft, Star, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BibliotecaBottomNav } from "@/components/biblioteca/BibliotecaBottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type StatusType = "quero_ler" | "lendo" | "concluido";

const STATUS_LABELS: Record<StatusType, string> = {
  quero_ler: "Quero Ler",
  lendo: "Lendo",
  concluido: "Concluído",
};

const STATUS_EMOJI: Record<StatusType, string> = {
  quero_ler: "📋",
  lendo: "📖",
  concluido: "✅",
};

const BIBLIOTECAS = [
  { key: "BIBLIOTECA-CLASSICOS", label: "Clássicos", fields: { titulo: "livro", autor: "autor", capa: "imagem" } },
  { key: "BIBLIOTECA-LIDERANÇA", label: "Liderança", fields: { titulo: "livro", autor: "autor", capa: "imagem" } },
  { key: "BIBLIOTECA-ORATORIA", label: "Oratória", fields: { titulo: "livro", autor: "autor", capa: "imagem" } },
  { key: "BIBLIOTECA-POLITICA", label: "Política", fields: { titulo: "livro", autor: "autor", capa: "imagem" } },
  { key: "BIBLIOTECA-PORTUGUES", label: "Português", fields: { titulo: "livro", autor: "autor", capa: "imagem" } },
  { key: "BIBLIOTECA-PESQUISA-CIENTIFICA", label: "Pesquisa Científica", fields: { titulo: "livro", autor: "autor", capa: "imagem" } },
  { key: "BIBLIOTECA-FORA-DA-TOGA", label: "Fora da Toga", fields: { titulo: "livro", autor: "autor", capa: "capa-livro" } },
  { key: "BIBILIOTECA-OAB", label: "OAB", fields: { titulo: "Tema", autor: null, capa: "Capa-livro" } },
  { key: "BIBLIOTECA-ESTUDOS", label: "Estudos", fields: { titulo: "Tema", autor: null, capa: "url_capa_gerada" } },
];

const BibliotecaPlanoLeitura = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState<StatusType>("lendo");
  const [editItem, setEditItem] = useState<any>(null);
  const [comentario, setComentario] = useState("");
  const [progresso, setProgresso] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedBiblioteca, setSelectedBiblioteca] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Buscar livros da biblioteca selecionada
  const { data: livrosBiblioteca, isLoading: isLoadingLivros } = useQuery({
    queryKey: ["biblioteca-livros-selector", selectedBiblioteca],
    queryFn: async () => {
      if (!selectedBiblioteca) return [];
      const { data, error } = await (supabase as any)
        .from(selectedBiblioteca)
        .select("*")
        .order("id");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!selectedBiblioteca,
  });

  const bibConfig = useMemo(() => 
    BIBLIOTECAS.find(b => b.key === selectedBiblioteca),
    [selectedBiblioteca]
  );

  const livrosFiltrados = useMemo(() => {
    if (!livrosBiblioteca || !bibConfig) return [];
    return livrosBiblioteca.filter((l: any) => {
      const titulo = l[bibConfig.fields.titulo] || "";
      const autor = bibConfig.fields.autor ? (l[bibConfig.fields.autor] || "") : "";
      const term = searchTerm.toLowerCase();
      return titulo.toLowerCase().includes(term) || autor.toLowerCase().includes(term);
    });
  }, [livrosBiblioteca, bibConfig, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    if (!items) return { total: 0, lendo: 0, concluido: 0, quero_ler: 0, progressoGeral: 0 };
    const total = items.length;
    const lendo = items.filter((i: any) => i.status === "lendo").length;
    const concluido = items.filter((i: any) => i.status === "concluido").length;
    const quero_ler = items.filter((i: any) => i.status === "quero_ler").length;
    const progressoGeral = total > 0 ? Math.round((concluido / total) * 100) : 0;
    return { total, lendo, concluido, quero_ler, progressoGeral };
  }, [items]);

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

  const addMutation = useMutation({
    mutationFn: async (livro: any) => {
      if (!user || !bibConfig || !selectedBiblioteca) return;
      const titulo = livro[bibConfig.fields.titulo] || "Sem título";
      const capaUrl = bibConfig.fields.capa ? (livro[bibConfig.fields.capa] || null) : null;
      
      const { data: existing } = await supabase
        .from("biblioteca_plano_leitura" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("biblioteca_tabela", selectedBiblioteca)
        .eq("item_id", livro.id)
        .maybeSingle();
      
      if (existing) {
        toast.info("Este livro já está no seu plano!");
        return;
      }

      const { error } = await (supabase as any)
        .from("biblioteca_plano_leitura")
        .insert({
          user_id: user.id,
          item_id: livro.id,
          titulo,
          biblioteca_tabela: selectedBiblioteca,
          capa_url: capaUrl,
          status: "quero_ler",
          progresso: 0,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biblioteca-plano-leitura"] });
      toast.success("Adicionado ao plano de leitura!");
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Plano de Leitura</h1>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 
                  ? `${stats.concluido} de ${stats.total} concluídos`
                  : "Organize suas leituras jurídicas"
                }
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setShowAddDialog(true);
              setSelectedBiblioteca(null);
              setSearchTerm("");
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>

        {/* Progress bar geral */}
        {stats.total > 0 && (
          <div className="mb-3 px-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>Progresso geral</span>
              <span>{stats.progressoGeral}%</span>
            </div>
            <Progress value={stats.progressoGeral} className="h-2" />
          </div>
        )}

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
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {STATUS_EMOJI[status]} {STATUS_LABELS[status]} ({count})
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
            <p className="text-muted-foreground/60 text-xs mt-1">Toque em "Adicionar" para incluir livros ao plano</p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30 cursor-pointer hover:border-amber-500/30 transition-colors"
              onClick={() => {
                setEditItem(item);
                setComentario(item.comentario || "");
                setProgresso(item.progresso || 0);
              }}
            >
              {item.capa_url ? (
                <img src={item.capa_url} alt={item.titulo} className="w-14 h-20 rounded-lg object-cover flex-shrink-0 shadow-md" />
              ) : (
                <div className="w-14 h-20 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-amber-500/50" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-2">{item.titulo}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {item.biblioteca_tabela?.replace("BIBLIOTECA-", "").replace("BIBILIOTECA-", "")}
                </p>
                {item.created_at && (
                  <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    Adicionado em {format(parseISO(item.created_at), "dd/MM/yy", { locale: ptBR })}
                  </p>
                )}
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
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base line-clamp-2">{editItem?.titulo}</DialogTitle>
            {editItem?.created_at && (
              <p className="text-[11px] text-muted-foreground">
                Adicionado em {format(parseISO(editItem.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}
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
                        ? "bg-amber-600 text-white"
                        : "bg-card border border-border text-muted-foreground"
                    }`}
                  >
                    {STATUS_EMOJI[s]} {STATUS_LABELS[s]}
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
                  className="w-full accent-amber-600"
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
              className="bg-amber-600 hover:bg-amber-700"
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

      {/* Add Book Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col overflow-hidden">
          {!selectedBiblioteca ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Escolha a biblioteca
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-1 -mx-2">
                <div className="space-y-1 px-2">
                  {BIBLIOTECAS.map((bib) => (
                    <button
                      key={bib.key}
                      onClick={() => {
                        setSelectedBiblioteca(bib.key);
                        setSearchTerm("");
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{bib.label}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <>
              {/* Back button header - destacado */}
              <div className="flex items-center gap-3 pb-3 border-b border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBiblioteca(null)}
                  className="border-amber-600/30 text-amber-600 hover:bg-amber-600/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <div>
                  <p className="text-sm font-semibold text-foreground">{bibConfig?.label}</p>
                  <p className="text-[10px] text-muted-foreground">Selecione um livro para adicionar</p>
                </div>
              </div>
              
              <div className="relative my-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar livro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <ScrollArea className="h-[60vh] -mx-2">
                {isLoadingLivros ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  </div>
                ) : livrosFiltrados.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">Nenhum livro encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-1 px-2">
                    {livrosFiltrados.map((livro: any) => {
                      const titulo = bibConfig ? livro[bibConfig.fields.titulo] : "";
                      const autor = bibConfig?.fields.autor ? livro[bibConfig.fields.autor] : null;
                      const capaUrl = bibConfig?.fields.capa ? livro[bibConfig.fields.capa] : null;
                      const alreadyAdded = items?.some(
                        (i: any) => i.biblioteca_tabela === selectedBiblioteca && i.item_id === livro.id
                      );

                      return (
                        <button
                          key={livro.id}
                          onClick={() => {
                            if (!alreadyAdded) addMutation.mutate(livro);
                          }}
                          disabled={alreadyAdded || addMutation.isPending}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                            alreadyAdded
                              ? "opacity-50 cursor-not-allowed bg-accent/30"
                              : "hover:bg-accent"
                          }`}
                        >
                          {capaUrl ? (
                            <img src={capaUrl} alt={titulo} className="w-10 h-14 rounded-md object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-14 rounded-md bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-4 h-4 text-amber-500/50" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">{titulo || "Sem título"}</p>
                            {autor && <p className="text-xs text-muted-foreground line-clamp-1">{autor}</p>}
                            {alreadyAdded && (
                              <p className="text-[10px] text-amber-600 font-medium mt-0.5">✓ Já adicionado</p>
                            )}
                          </div>
                          {!alreadyAdded && (
                            <Plus className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BibliotecaBottomNav activeTab="plano" />
    </div>
  );
};

export default BibliotecaPlanoLeitura;
