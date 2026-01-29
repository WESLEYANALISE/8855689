import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  BookOpen, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  Eye,
  Loader2,
  Database,
  Sparkles
} from "lucide-react";

interface AreaConhecimento {
  id: string;
  area: string;
  pdf_url: string | null;
  status: string;
  total_paginas: number;
  total_chunks: number;
  total_tokens: number;
  created_at: string;
  updated_at: string;
}

const AdminBaseConhecimentoOAB = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewArea, setPreviewArea] = useState<string | null>(null);

  // Buscar áreas
  const { data: areas, isLoading } = useQuery({
    queryKey: ["oab-base-conhecimento-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oab_base_conhecimento_areas")
        .select("*")
        .order("area");
      if (error) throw error;
      return data as AreaConhecimento[];
    },
  });

  // Buscar conteúdo para preview
  const { data: previewContent } = useQuery({
    queryKey: ["oab-base-conhecimento-preview", previewArea],
    queryFn: async () => {
      if (!previewArea) return null;
      const { data, error } = await supabase
        .from("oab_base_conhecimento")
        .select("pagina, conteudo")
        .eq("area", previewArea)
        .order("pagina")
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!previewArea,
  });

  // Mutation para processar PDF
  const processarMutation = useMutation({
    mutationFn: async ({ area, pdfUrl }: { area: string; pdfUrl: string }) => {
      const { data, error } = await supabase.functions.invoke("processar-base-conhecimento-oab", {
        body: { area, pdfUrl },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Extração iniciada! Aguarde o processamento.");
      setDialogOpen(false);
      setPdfUrl("");
      setSelectedArea(null);
      queryClient.invalidateQueries({ queryKey: ["oab-base-conhecimento-areas"] });
    },
    onError: (error) => {
      toast.error(`Erro ao processar: ${error.message}`);
    },
  });

  const handleUpload = () => {
    if (!selectedArea || !pdfUrl) {
      toast.error("Selecione uma área e informe a URL do PDF");
      return;
    }
    processarMutation.mutate({ area: selectedArea, pdfUrl });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluido":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "extraindo":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "erro":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "concluido":
        return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Concluído</Badge>;
      case "extraindo":
        return <Badge variant="default" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Extraindo...</Badge>;
      case "erro":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  // Estatísticas gerais
  const stats = areas?.reduce(
    (acc, area) => ({
      totalAreas: acc.totalAreas + (area.status === "concluido" ? 1 : 0),
      totalPaginas: acc.totalPaginas + (area.total_paginas || 0),
      totalTokens: acc.totalTokens + (area.total_tokens || 0),
    }),
    { totalAreas: 0, totalPaginas: 0, totalTokens: 0 }
  ) || { totalAreas: 0, totalPaginas: 0, totalTokens: 0 };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              Base de Conhecimento OAB
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie os PDFs que servem como referência para a IA gerar conteúdo
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <div className="text-2xl font-bold text-primary">{stats.totalAreas}</div>
            <div className="text-xs text-muted-foreground">Áreas Processadas</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <div className="text-2xl font-bold text-blue-400">{stats.totalPaginas.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Páginas Extraídas</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
            <div className="text-2xl font-bold text-amber-400">{(stats.totalTokens / 1000).toFixed(0)}k</div>
            <div className="text-xs text-muted-foreground">Tokens</div>
          </Card>
        </div>

        {/* Info */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Como funciona?</p>
              <p className="text-muted-foreground mt-1">
                Faça upload de PDFs com material de estudo de cada área do Direito. 
                O conteúdo será extraído via OCR e armazenado como base de conhecimento. 
                A Gemini usará esse conteúdo como referência ao gerar flashcards, questões e resumos.
              </p>
            </div>
          </div>
        </Card>

        {/* Lista de Áreas */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas?.map((area) => (
              <Card key={area.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(area.status)}
                    <h3 className="font-semibold text-foreground">{area.area}</h3>
                  </div>
                  {getStatusBadge(area.status)}
                </div>

                {area.status === "concluido" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Páginas</span>
                      <span className="font-medium">{area.total_paginas}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tokens</span>
                      <span className="font-medium">{area.total_tokens?.toLocaleString()}</span>
                    </div>
                    <Progress value={100} className="h-1" />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Dialog open={dialogOpen && selectedArea === area.area} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                      setSelectedArea(null);
                      setPdfUrl("");
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant={area.status === "concluido" ? "outline" : "default"}
                        className="flex-1"
                        onClick={() => setSelectedArea(area.area)}
                        disabled={area.status === "extraindo"}
                      >
                        {area.status === "extraindo" ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Processando...
                          </>
                        ) : area.status === "concluido" ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Reprocessar
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-1" />
                            Upload PDF
                          </>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload PDF - {area.area}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <label className="text-sm font-medium">URL do Google Drive</label>
                          <Input
                            placeholder="https://drive.google.com/file/d/..."
                            value={pdfUrl}
                            onChange={(e) => setPdfUrl(e.target.value)}
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Cole o link de compartilhamento do Google Drive
                          </p>
                        </div>
                        <Button 
                          onClick={handleUpload} 
                          disabled={processarMutation.isPending || !pdfUrl}
                          className="w-full"
                        >
                          {processarMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Iniciar Extração
                            </>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {area.status === "concluido" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setPreviewArea(area.area)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Preview - {area.area}
                          </DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh] mt-4">
                          {previewContent?.map((p) => (
                            <div key={p.pagina} className="mb-6 pb-4 border-b border-border">
                              <Badge variant="outline" className="mb-2">Página {p.pagina}</Badge>
                              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {p.conteudo.slice(0, 500)}
                                {p.conteudo.length > 500 && "..."}
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBaseConhecimentoOAB;
