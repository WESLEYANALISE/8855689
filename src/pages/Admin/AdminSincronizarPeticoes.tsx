import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, FolderSync, FileText, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SyncLog {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  total_arquivos: number;
  novos_arquivos: number;
  atualizados: number;
  erros: number;
  detalhes: {
    categorias?: Record<string, number>;
    em_progresso?: string;
  };
}

interface CategoriaStats {
  categoria: string;
  count: number;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

const ESTIMATED_TOTAL = 30000; // Estimativa de arquivos para cálculo de porcentagem

const AdminSincronizarPeticoes = () => {
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncLog | null>(null);
  const [categorias, setCategorias] = useState<CategoriaStats[]>([]);
  const [totalArquivos, setTotalArquivos] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(true);
  const [showCategorias, setShowCategorias] = useState(true);
  const [elapsedTime, setElapsedTime] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => {
      // Evita duplicar a última mensagem
      if (prev.length > 0 && prev[prev.length - 1].message === message) return prev;
      return [...prev, { 
        timestamp: new Date().toLocaleTimeString('pt-BR'), 
        message, 
        type 
      }];
    });
  };

  // Timer para tempo decorrido
  useEffect(() => {
    if (isSyncing && lastSync) {
      timerRef.current = setInterval(() => {
        const start = new Date(lastSync.started_at).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - start) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        setElapsedTime(`${mins}m ${secs}s`);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSyncing, lastSync?.started_at]);

  // Realtime subscription para sync_log
  useEffect(() => {
    fetchStats();
    fetchLastSync();

    const channel = supabase
      .channel('sync-log-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'peticoes_sync_log'
        },
        (payload) => {
          console.log('Realtime update:', payload);
          if (payload.new) {
            const syncData = payload.new as SyncLog;
            setLastSync(syncData);
            
            if (syncData.status === "running") {
              setIsSyncing(true);
              if (syncData.detalhes?.em_progresso) {
                addLog(`📁 Processando: ${syncData.detalhes.em_progresso}`, 'info');
              }
              addLog(`${syncData.total_arquivos} processados (+${syncData.novos_arquivos} novos, ~${syncData.atualizados} atualizados)`, 'success');
            } else if (syncData.status === "completed") {
              setIsSyncing(false);
              addLog(`✅ Concluído! Total: ${syncData.total_arquivos} arquivos`, 'success');
              toast.success("Sincronização concluída!");
              fetchStats();
            } else if (syncData.status === "failed") {
              setIsSyncing(false);
              addLog(`❌ Falhou com ${syncData.erros} erros`, 'error');
              toast.error("Sincronização falhou");
            }
          }
        }
      )
      .subscribe();

    // Realtime para peticoes_modelos (atualiza categorias em tempo real)
    const modelosChannel = supabase
      .channel('modelos-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'peticoes_modelos'
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(modelosChannel);
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const fetchStats = async () => {
    // Buscar total real sem limite de 1000
    const { count: totalCount } = await supabase
      .from("peticoes_modelos")
      .select("*", { count: "exact", head: true });
    
    setTotalArquivos(totalCount || 0);

    // Buscar categorias únicas e contar cada uma
    const { data: categoriasData } = await supabase
      .from("peticoes_modelos")
      .select("categoria")
      .limit(50000); // Aumentar limite para pegar todas
    
    if (categoriasData) {
      const counts: Record<string, number> = {};
      categoriasData.forEach((item: any) => {
        counts[item.categoria] = (counts[item.categoria] || 0) + 1;
      });
      
      const stats = Object.entries(counts)
        .map(([categoria, count]) => ({ categoria, count }))
        .sort((a, b) => b.count - a.count);
      
      setCategorias(stats);
    }
  };

  const fetchLastSync = async () => {
    const { data, error } = await supabase
      .from("peticoes_sync_log")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();
    
    if (!error && data) {
      const syncData = data as SyncLog;
      setLastSync(syncData);
      if (syncData.status === "running") {
        setIsSyncing(true);
      }
    }
  };


  const handleSync = async () => {
    setIsSyncing(true);
    setLogs([]);
    addLog("🚀 Iniciando sincronização com Google Drive...", 'info');
    toast.info("Sincronização iniciada");
    
    try {
      const { data, error } = await supabase.functions.invoke("sincronizar-peticoes-drive");
      
      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || "Erro desconhecido");
      }
    } catch (error: any) {
      console.error("Erro na sincronização:", error);
      addLog(`❌ Erro: ${error.message}`, 'error');
      toast.error(`Erro: ${error.message}`);
      setIsSyncing(false);
    }
  };

  const handleStop = async () => {
    if (!lastSync) return;
    
    try {
      // Atualizar status para "stopped" no banco
      const { error } = await supabase
        .from("peticoes_sync_log")
        .update({ 
          status: "stopped",
          finished_at: new Date().toISOString()
        })
        .eq("id", lastSync.id);

      if (error) throw error;

      setIsSyncing(false);
      addLog("⏹️ Sincronização interrompida pelo usuário", 'info');
      toast.info("Sincronização interrompida");
      fetchStats();
    } catch (error: any) {
      console.error("Erro ao parar:", error);
      toast.error(`Erro: ${error.message}`);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("pt-BR");
  };

  const getProgressPercent = () => {
    if (!lastSync || lastSync.status !== "running") return 0;
    const percent = Math.min((lastSync.total_arquivos / ESTIMATED_TOTAL) * 100, 99);
    return Math.round(percent);
  };

  const getRemaining = () => {
    if (!lastSync) return ESTIMATED_TOTAL;
    return Math.max(ESTIMATED_TOTAL - lastSync.total_arquivos, 0);
  };

  return (
    <div className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Header compacto */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg md:text-xl font-bold">Sincronizar Petições</h1>
            <p className="text-xs text-muted-foreground">Google Drive → Supabase</p>
          </div>
        </div>

        {/* Card de Ação + Progresso */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              {/* Botão e info */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSync} 
                    disabled={isSyncing}
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "Sincronizando..." : "Sincronizar"}
                  </Button>
                  
                  {isSyncing && (
                    <Button 
                      onClick={handleStop} 
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Parar
                    </Button>
                  )}
                </div>
                
                {isSyncing && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{elapsedTime}</span>
                  </div>
                )}
              </div>

              {/* Barra de progresso durante sincronização */}
              {isSyncing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground truncate max-w-[60%]">
                      {lastSync?.detalhes?.em_progresso ? `📁 ${lastSync.detalhes.em_progresso}` : "Iniciando..."}
                    </span>
                    <span className="font-mono font-semibold text-primary">{getProgressPercent()}%</span>
                  </div>
                  <Progress value={getProgressPercent()} className="h-2" />
                  
                  {/* Stats em tempo real */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-muted/50 rounded p-1.5">
                      <p className="text-sm font-bold font-mono">{lastSync?.total_arquivos || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Processados</p>
                    </div>
                    <div className="bg-yellow-500/10 rounded p-1.5">
                      <p className="text-sm font-bold font-mono text-yellow-600">~{getRemaining().toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Restantes</p>
                    </div>
                    <div className="bg-green-500/10 rounded p-1.5">
                      <p className="text-sm font-bold font-mono text-green-600">+{lastSync?.novos_arquivos || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Novos</p>
                    </div>
                    <div className="bg-blue-500/10 rounded p-1.5">
                      <p className="text-sm font-bold font-mono text-blue-600">{lastSync?.atualizados || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Atualizados</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats da última sincronização (quando não está sincronizando) */}
              {!isSyncing && lastSync && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {lastSync.status === "completed" ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  ) : lastSync.status === "running" ? (
                    <Clock className="h-3.5 w-3.5 text-yellow-500" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className="text-muted-foreground">
                    Última: {formatDate(lastSync.started_at)}
                  </span>
                  <span className="font-mono">{lastSync.total_arquivos} arquivos</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Log em tempo real */}
        <Collapsible open={showLogs} onOpenChange={setShowLogs}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Log de Execução
                    {logs.length > 0 && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{logs.length}</span>
                    )}
                  </span>
                  {showLogs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-3 pt-0">
                <ScrollArea className="h-32 md:h-40 rounded border bg-muted/30 p-2">
                  {logs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Clique em "Sincronizar" para ver os logs
                    </p>
                  ) : (
                    <div className="space-y-1 font-mono text-[10px] md:text-xs">
                      {logs.map((log, i) => (
                        <div 
                          key={i} 
                          className={`flex gap-2 ${
                            log.type === 'error' ? 'text-red-500' : 
                            log.type === 'success' ? 'text-green-500' : 
                            'text-muted-foreground'
                          }`}
                        >
                          <span className="text-muted-foreground/60 shrink-0">[{log.timestamp}]</span>
                          <span className="break-all">{log.message}</span>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Estatísticas por Categoria - Colapsável */}
        <Collapsible open={showCategorias} onOpenChange={setShowCategorias}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Categorias
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {totalArquivos} arquivos
                    </span>
                  </span>
                  {showCategorias ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-3 pt-0">
                {categorias.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhum arquivo ainda
                  </p>
                ) : (
                  <ScrollArea className="max-h-48">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {categorias.map(({ categoria, count }) => (
                        <div 
                          key={categoria} 
                          className="flex items-center justify-between p-1.5 bg-muted/50 rounded text-xs"
                        >
                          <span className="truncate flex-1" title={categoria}>{categoria}</span>
                          <span className="font-mono font-bold ml-2 text-primary">{count}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
};

export default AdminSincronizarPeticoes;
