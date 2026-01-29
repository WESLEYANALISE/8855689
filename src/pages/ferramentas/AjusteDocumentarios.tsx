import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings2, 
  Image, 
  FileText, 
  MessageSquare, 
  HelpCircle,
  Play,
  Check,
  X,
  RefreshCw,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Square,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Documentario {
  id: string;
  video_id: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  capa_webp: string | null;
  duracao: string | null;
  transcricao_texto: string | null;
  sobre_texto: string | null;
  analise_ia: string | null;
  questoes: any | null;
}

type ActionType = "capa" | "transcricao" | "analise" | "conteudo";

interface ProcessingState {
  isProcessing: boolean;
  action: ActionType | null;
  current: number;
  total: number;
  logs: string[];
  cancelRequested: boolean;
}

const AjusteDocumentarios = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    action: null,
    current: 0,
    total: 0,
    logs: [],
    cancelRequested: false
  });
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "missing_capa" | "missing_transcricao" | "missing_analise" | "missing_sobre" | "missing_questoes">("all");

  const { data: documentarios = [], isLoading, refetch } = useQuery({
    queryKey: ["ajuste-documentarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentarios_juridicos")
        .select("id, video_id, titulo, descricao, thumbnail, capa_webp, duracao, transcricao_texto, sobre_texto, analise_ia, questoes")
        .order("titulo");
      
      if (error) throw error;
      return data as Documentario[];
    }
  });

  // Estatísticas
  const stats = useMemo(() => {
    const total = documentarios.length;
    // Sem capa conta apenas os que podem gerar (Audiodescrição)
    const semCapa = documentarios.filter(d => 
      !d.capa_webp && d.titulo.toLowerCase().startsWith('audiodescrição')
    ).length;
    const semTranscricao = documentarios.filter(d => !d.transcricao_texto).length;
    const semAnalise = documentarios.filter(d => !d.analise_ia).length;
    const semSobre = documentarios.filter(d => !d.sobre_texto).length;
    const semQuestoes = documentarios.filter(d => !d.questoes).length;
    
    return { total, semCapa, semTranscricao, semAnalise, semSobre, semQuestoes };
  }, [documentarios]);

  // Documentários filtrados
  const filteredDocs = useMemo(() => {
    switch (filter) {
      case "missing_capa": return documentarios.filter(d => !d.capa_webp);
      case "missing_transcricao": return documentarios.filter(d => !d.transcricao_texto);
      case "missing_analise": return documentarios.filter(d => !d.analise_ia);
      case "missing_sobre": return documentarios.filter(d => !d.sobre_texto);
      case "missing_questoes": return documentarios.filter(d => !d.questoes);
      default: return documentarios;
    }
  }, [documentarios, filter]);

  const addLog = useCallback((message: string) => {
    setProcessing(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-50), `[${new Date().toLocaleTimeString()}] ${message}`]
    }));
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Gerar capa individual
  const gerarCapa = async (doc: Documentario) => {
    const { error } = await supabase.functions.invoke("gerar-capa-documentario", {
      body: { documentarioId: doc.id }
    });
    if (error) throw error;
  };

  // Gerar transcrição individual
  const gerarTranscricao = async (doc: Documentario) => {
    const { error } = await supabase.functions.invoke("transcrever-video-youtube", {
      body: { videoId: doc.video_id, documentarioId: doc.id, titulo: doc.titulo }
    });
    if (error) throw error;
  };

  // Gerar análise individual
  const gerarAnalise = async (doc: Documentario) => {
    const { error } = await supabase.functions.invoke("analisar-documentario", {
      body: { documentarioId: doc.id, titulo: doc.titulo, descricao: doc.descricao }
    });
    if (error) throw error;
  };

  // Gerar conteúdo completo (sobre + questões)
  const gerarConteudo = async (doc: Documentario) => {
    const { error } = await supabase.functions.invoke("gerar-conteudo-documentario", {
      body: { 
        documentarioId: doc.id, 
        transcricao: doc.transcricao_texto, 
        titulo: doc.titulo,
        duracao: doc.duracao 
      }
    });
    if (error) throw error;
  };

  // Processamento em lote (10 em paralelo para transcrições)
  const processarLote = async (action: ActionType) => {
    let docsToProcess: Documentario[] = [];
    let actionFn: (doc: Documentario) => Promise<void>;
    let actionName: string;
    let delayMs: number;
    let batchSize: number;

    switch (action) {
      case "capa":
        // Apenas documentários com título começando em "Audiodescrição" podem gerar capa
        docsToProcess = documentarios.filter(d => 
          !d.capa_webp && d.titulo.toLowerCase().startsWith('audiodescrição')
        );
        actionFn = gerarCapa;
        actionName = "Gerando capa";
        delayMs = 2000;
        batchSize = 5;
        break;
      case "transcricao":
        docsToProcess = documentarios.filter(d => !d.transcricao_texto);
        actionFn = gerarTranscricao;
        actionName = "Gerando transcrição";
        delayMs = 3000;
        batchSize = 10; // 10 transcrições por vez
        break;
      case "analise":
        docsToProcess = documentarios.filter(d => !d.analise_ia);
        actionFn = gerarAnalise;
        actionName = "Gerando análise";
        delayMs = 2000;
        batchSize = 5;
        break;
      case "conteudo":
        docsToProcess = documentarios.filter(d => d.transcricao_texto && (!d.sobre_texto || !d.questoes));
        actionFn = gerarConteudo;
        actionName = "Gerando conteúdo";
        delayMs = 3000;
        batchSize = 5;
        break;
    }

    if (docsToProcess.length === 0) {
      toast.info("Nenhum documentário precisa desta ação");
      return;
    }

    setProcessing({
      isProcessing: true,
      action,
      current: 0,
      total: docsToProcess.length,
      logs: [],
      cancelRequested: false
    });

    let successCount = 0;
    let errorCount = 0;
    let cancelFlag = false;

    // Processar em lotes paralelos
    for (let i = 0; i < docsToProcess.length; i += batchSize) {
      // Verificar cancelamento via ref
      if (cancelFlag) {
        addLog("⚠️ Processamento cancelado pelo usuário");
        break;
      }

      const batch = docsToProcess.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(docsToProcess.length / batchSize);
      
      addLog(`📦 Processando lote ${batchNum}/${totalBatches} (${batch.length} itens em paralelo)`);

      // Executar batch em paralelo
      const results = await Promise.allSettled(
        batch.map(async (doc) => {
          addLog(`${actionName} para: ${doc.titulo.substring(0, 50)}...`);
          await actionFn(doc);
          return doc;
        })
      );

      // Processar resultados do batch
      results.forEach((result, idx) => {
        const doc = batch[idx];
        if (result.status === "fulfilled") {
          successCount++;
          addLog(`✅ Sucesso: ${doc.titulo.substring(0, 40)}...`);
        } else {
          errorCount++;
          const errorMsg = result.reason?.message || "Erro desconhecido";
          addLog(`❌ Erro: ${doc.titulo.substring(0, 40)} - ${errorMsg}`);
          
          // Se for rate limit, marcar para pausar mais
          if (errorMsg.includes("429") || errorMsg.includes("rate")) {
            addLog("⏳ Rate limit detectado, aguardando mais tempo...");
          }
        }
      });

      setProcessing(prev => ({ 
        ...prev, 
        current: Math.min(i + batchSize, docsToProcess.length),
        cancelRequested: prev.cancelRequested ? (cancelFlag = true, true) : false
      }));

      // Delay entre lotes
      if (i + batchSize < docsToProcess.length) {
        addLog(`⏳ Aguardando ${delayMs / 1000}s antes do próximo lote...`);
        await delay(delayMs);
      }
    }

    setProcessing(prev => ({ ...prev, isProcessing: false }));
    toast.success(`Processamento concluído: ${successCount} sucesso, ${errorCount} erros`);
    refetch();
    queryClient.invalidateQueries({ queryKey: ["documentarios-juridicos"] });
  };

  const cancelarProcessamento = () => {
    setProcessing(prev => ({ ...prev, cancelRequested: true }));
    addLog("🛑 Cancelamento solicitado...");
  };

  // Iniciar transcrições em background (servidor)
  const iniciarTranscricaoBackground = async () => {
    toast.loading("Iniciando processamento em background...", { id: "bg-start" });
    
    try {
      const { data, error } = await supabase.functions.invoke("processar-transcricoes-background", {
        body: { limite: 100 }
      });
      
      if (error) throw error;
      
      toast.success(`${data.message}. Pode sair da página!`, { id: "bg-start", duration: 5000 });
      addLog(`🚀 Background iniciado: ${data.pendentes} pendentes`);
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`, { id: "bg-start" });
    }
  };

  // Ação individual
  const executarAcaoIndividual = async (doc: Documentario, action: ActionType) => {
    const actionNames: Record<ActionType, string> = {
      capa: "capa",
      transcricao: "transcrição",
      analise: "análise",
      conteudo: "conteúdo"
    };

    toast.loading(`Gerando ${actionNames[action]}...`, { id: `action-${doc.id}` });

    try {
      switch (action) {
        case "capa": await gerarCapa(doc); break;
        case "transcricao": await gerarTranscricao(doc); break;
        case "analise": await gerarAnalise(doc); break;
        case "conteudo": await gerarConteudo(doc); break;
      }
      toast.success(`${actionNames[action]} gerada com sucesso!`, { id: `action-${doc.id}` });
      refetch();
    } catch (error: any) {
      toast.error(`Erro ao gerar ${actionNames[action]}: ${error.message}`, { id: `action-${doc.id}` });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocs.map(d => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const StatusIcon = ({ has }: { has: boolean }) => (
    has ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-destructive" />
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-primary" />
            Ajuste Documentário
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie e complete os dados dos documentários jurídicos
          </p>
        </div>
      </div>

      {/* Dashboard de Status */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setFilter("all")}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        
        <Card className={`cursor-pointer hover:bg-accent/50 transition-colors ${filter === "missing_capa" ? "ring-2 ring-primary" : ""}`} onClick={() => setFilter("missing_capa")}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Image className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold text-orange-500">{stats.semCapa}</span>
            </div>
            <div className="text-xs text-muted-foreground">Sem Capa</div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer hover:bg-accent/50 transition-colors ${filter === "missing_transcricao" ? "ring-2 ring-primary" : ""}`} onClick={() => setFilter("missing_transcricao")}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold text-blue-500">{stats.semTranscricao}</span>
            </div>
            <div className="text-xs text-muted-foreground">Sem Transcrição</div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer hover:bg-accent/50 transition-colors ${filter === "missing_analise" ? "ring-2 ring-primary" : ""}`} onClick={() => setFilter("missing_analise")}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              <span className="text-2xl font-bold text-purple-500">{stats.semAnalise}</span>
            </div>
            <div className="text-xs text-muted-foreground">Sem Análise</div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer hover:bg-accent/50 transition-colors ${filter === "missing_sobre" ? "ring-2 ring-primary" : ""}`} onClick={() => setFilter("missing_sobre")}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">{stats.semSobre}</span>
            </div>
            <div className="text-xs text-muted-foreground">Sem Sobre</div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer hover:bg-accent/50 transition-colors ${filter === "missing_questoes" ? "ring-2 ring-primary" : ""}`} onClick={() => setFilter("missing_questoes")}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <HelpCircle className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold text-red-500">{stats.semQuestoes}</span>
            </div>
            <div className="text-xs text-muted-foreground">Sem Questões</div>
          </CardContent>
        </Card>
      </div>

      {/* Ações em Lote */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Play className="h-5 w-5" />
          Ações em Lote
        </h2>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => processarLote("transcricao")} 
            disabled={processing.isProcessing || stats.semTranscricao === 0}
            variant="outline"
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Transcrições Lote ({stats.semTranscricao})
          </Button>

          {processing.isProcessing && (
            <Button variant="destructive" onClick={cancelarProcessamento} className="gap-2">
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          )}

          <Button variant="ghost" onClick={() => refetch()} className="gap-2 ml-auto">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Progresso */}
        {processing.isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Processando {processing.action}: {processing.current}/{processing.total}
              </span>
              <span className="font-medium">
                {Math.round((processing.current / processing.total) * 100)}%
              </span>
            </div>
            <Progress value={(processing.current / processing.total) * 100} />
          </div>
        )}

        {/* Logs */}
        {processing.logs.length > 0 && (
          <ScrollArea className="h-32 rounded-md border border-border p-3">
            <div className="space-y-1 font-mono text-xs">
              {processing.logs.map((log, i) => (
                <div key={i} className="text-muted-foreground">{log}</div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Tabela de Documentários */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Documentários ({filteredDocs.length})
              {filter !== "all" && (
                <Badge variant="secondary" className="ml-2">Filtrado</Badge>
              )}
            </CardTitle>
            {filter !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setFilter("all")}>
                Limpar filtro
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Button variant="ghost" size="icon" onClick={toggleSelectAll} className="h-6 w-6">
                      {selectedIds.size === filteredDocs.length && filteredDocs.length > 0 ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="text-center w-16">Capa</TableHead>
                  <TableHead className="text-center w-16">Trans.</TableHead>
                  <TableHead className="text-center w-16">Análise</TableHead>
                  <TableHead className="text-center w-16">Sobre</TableHead>
                  <TableHead className="text-center w-16">Quest.</TableHead>
                  <TableHead className="text-right w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => toggleSelect(doc.id)}
                        className="h-6 w-6"
                      >
                        {selectedIds.has(doc.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate font-medium">
                      {doc.titulo}
                    </TableCell>
                    <TableCell className="text-center">
                      {doc.capa_webp ? (
                        <StatusIcon has={true} />
                      ) : doc.titulo.toLowerCase().startsWith('audiodescrição') ? (
                        <Button
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => executarAcaoIndividual(doc, "capa")}
                          disabled={processing.isProcessing}
                        >
                          <Image className="h-3 w-3 text-muted-foreground hover:text-primary" />
                        </Button>
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {doc.transcricao_texto ? (
                        <StatusIcon has={true} />
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => executarAcaoIndividual(doc, "transcricao")}
                          disabled={processing.isProcessing}
                        >
                          <FileText className="h-3 w-3 text-muted-foreground hover:text-primary" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {doc.analise_ia ? (
                        <StatusIcon has={true} />
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => executarAcaoIndividual(doc, "analise")}
                          disabled={processing.isProcessing}
                        >
                          <MessageSquare className="h-3 w-3 text-muted-foreground hover:text-primary" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {doc.sobre_texto ? (
                        <StatusIcon has={true} />
                      ) : doc.transcricao_texto ? (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => executarAcaoIndividual(doc, "conteudo")}
                          disabled={processing.isProcessing}
                        >
                          <AlertCircle className="h-3 w-3 text-muted-foreground hover:text-primary" />
                        </Button>
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {doc.questoes ? (
                        <StatusIcon has={true} />
                      ) : doc.transcricao_texto ? (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => executarAcaoIndividual(doc, "conteudo")}
                          disabled={processing.isProcessing}
                        >
                          <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-primary" />
                        </Button>
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/ferramentas/documentarios-juridicos/${doc.id}`)}
                        className="text-xs"
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AjusteDocumentarios;
