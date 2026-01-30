import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Upload, Image, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StandardPageHeader } from "@/components/StandardPageHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type InputType = "texto" | "pdf" | "imagem";

interface StepSelectTypeProps {
  onSelect: (type: InputType) => void;
  onOpenHistory?: () => void;
}

interface HistoricoResumo {
  id: string;
  titulo: string;
  resumo: string;
  nivel: string;
  tipo_entrada: string;
  nome_arquivo: string | null;
  created_at: string;
}

const getTypeLabel = (tipo: string) => {
  switch (tipo) {
    case "texto": return "Texto";
    case "pdf": return "PDF";
    case "imagem": return "Imagem";
    default: return tipo;
  }
};

const getTypeColor = (tipo: string) => {
  switch (tipo) {
    case "texto": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "pdf": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "imagem": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    default: return "bg-muted text-muted-foreground";
  }
};

const getTypeIcon = (tipo: string) => {
  switch (tipo) {
    case "texto": return <FileText className="w-3.5 h-3.5" />;
    case "pdf": return <Upload className="w-3.5 h-3.5" />;
    case "imagem": return <Image className="w-3.5 h-3.5" />;
    default: return <FileText className="w-3.5 h-3.5" />;
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

export const StepSelectType = ({ onSelect }: StepSelectTypeProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("resumos");
  const [resumos, setResumos] = useState<HistoricoResumo[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "historico") {
      fetchHistorico();
    }
  }, [activeTab]);

  const fetchHistorico = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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
      toast({ title: "Resumo excluído" });
    } catch (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenResumo = (resumo: HistoricoResumo) => {
    navigate("/resumos-juridicos/resultado", {
      state: {
        resumo: resumo.resumo,
        titulo: resumo.titulo,
        nivel: resumo.nivel,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StandardPageHeader
        title="Resumo Personalizado"
        subtitle="Crie resumos de qualquer conteúdo"
        backPath="/resumos-juridicos"
      />

      <div className="flex-1 px-4 py-6">
        <div className="w-full max-w-lg mx-auto animate-fade-in">
          {/* Tabs de alternância */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6 h-11">
              <TabsTrigger value="resumos" className="text-sm font-medium">
                Resumos
              </TabsTrigger>
              <TabsTrigger value="historico" className="text-sm font-medium">
                Histórico
              </TabsTrigger>
            </TabsList>

            {/* Tab: Criar Resumo */}
            <TabsContent value="resumos" className="mt-0">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/20 mb-4">
                  <span className="text-3xl">📚</span>
                </div>
                <h2 className="text-xl font-bold mb-2">
                  Criar Resumo
                </h2>
                <p className="text-muted-foreground text-sm">
                  Escolha o formato do conteúdo
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Card
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-accent group active:scale-[0.97] border-border/50"
                  onClick={() => onSelect("texto")}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <FileText className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-0.5">Texto</h3>
                      <p className="text-xs text-muted-foreground">
                        Cole ou digite
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-accent group active:scale-[0.97] border-border/50"
                  onClick={() => onSelect("pdf")}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Upload className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-0.5">PDF</h3>
                      <p className="text-xs text-muted-foreground">
                        Upload arquivo
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-accent group active:scale-[0.97] border-border/50"
                  onClick={() => onSelect("imagem")}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Image className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-0.5">Imagem</h3>
                      <p className="text-xs text-muted-foreground">
                        Envie foto
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Histórico */}
            <TabsContent value="historico" className="mt-0">
              <div className="text-center mb-4">
                <p className="text-muted-foreground text-sm">
                  Últimos 30 dias
                </p>
              </div>

              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-3 pr-2">
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
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {/* Etiqueta de tipo */}
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTypeColor(resumo.tipo_entrada)}`}>
                                {getTypeIcon(resumo.tipo_entrada)}
                                {getTypeLabel(resumo.tipo_entrada)}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {getLevelLabel(resumo.nivel)}
                              </span>
                            </div>
                            <h4 className="font-medium text-sm truncate">
                              {resumo.titulo || resumo.nome_arquivo || "Resumo sem título"}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(resumo.created_at), "dd 'de' MMMM", { locale: ptBR })}
                            </p>
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
                          {resumo.resumo.replace(/[#*_`]/g, "").substring(0, 120)}...
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
