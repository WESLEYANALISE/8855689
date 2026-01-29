import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  FileText
} from "lucide-react";

interface AreaStats {
  area: string;
  total: number;
  gerados: number;
  pendentes: number;
  percentual: number;
}

interface LogEntry {
  timestamp: Date;
  area: string;
  tema: string;
  subtema: string;
  status: 'success' | 'error' | 'processing';
  message?: string;
}

export const ResumosMateriaBatchTab = () => {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>("todas");
  const [limite, setLimite] = useState(50);
  const [delaySeconds, setDelaySeconds] = useState(3);
  const [currentProgress, setCurrentProgress] = useState({ current: 0, total: 0, area: '' });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Buscar estatísticas por área
  const { data: areasStats, isLoading, refetch: refetchStats } = useQuery({
    queryKey: ["resumos-materia-stats"],
    queryFn: async () => {
      // Buscar todos os resumos (paginando para evitar limite de 1000)
      let allResumos: { area: string; conteudo_gerado: unknown }[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("RESUMO")
          .select("area, conteudo_gerado")
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        allResumos = [...allResumos, ...(data || [])];
        hasMore = (data?.length || 0) === pageSize;
        page++;
      }

      // Agrupar por área
      const statsMap = new Map<string, { total: number; gerados: number }>();
      
      allResumos.forEach(resumo => {
        const area = resumo.area || "Sem área";
        const stats = statsMap.get(area) || { total: 0, gerados: 0 };
        stats.total++;
        if (resumo.conteudo_gerado && typeof resumo.conteudo_gerado === 'object' && 'markdown' in (resumo.conteudo_gerado as object)) {
          stats.gerados++;
        }
        statsMap.set(area, stats);
      });

      // Converter para array e ordenar por pendentes (descendente)
      const result: AreaStats[] = Array.from(statsMap.entries())
        .map(([area, stats]) => ({
          area,
          total: stats.total,
          gerados: stats.gerados,
          pendentes: stats.total - stats.gerados,
          percentual: stats.total > 0 ? Math.round((stats.gerados / stats.total) * 100) : 100
        }))
        .sort((a, b) => b.pendentes - a.pendentes);

      return result;
    },
    refetchInterval: isProcessing ? 10000 : false
  });

  // Calcular totais globais
  const totais = areasStats?.reduce(
    (acc, area) => ({
      total: acc.total + area.total,
      gerados: acc.gerados + area.gerados,
      pendentes: acc.pendentes + area.pendentes
    }),
    { total: 0, gerados: 0, pendentes: 0 }
  ) || { total: 0, gerados: 0, pendentes: 0 };

  const percentualGlobal = totais.total > 0 ? Math.round((totais.gerados / totais.total) * 100) : 0;

  // Função para processar um único resumo
  const processarResumo = async (resumo: { id: number; area: string; tema: string; subtema: string; conteudo: string }) => {
    const response = await supabase.functions.invoke('gerar-resumo-pronto', {
      body: {
        resumoId: resumo.id,
        area: resumo.area,
        tema: resumo.tema,
        subtema: resumo.subtema,
        conteudo: resumo.conteudo
      }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  };

  // Função principal de processamento em lote
  const processarLote = async () => {
    setIsProcessing(true);
    setIsPaused(false);
    abortControllerRef.current = new AbortController();
    
    try {
      // Buscar resumos pendentes
      let query = supabase
        .from("RESUMO")
        .select("id, area, tema, subtema, conteudo")
        .is("conteudo_gerado", null)
        .limit(limite);

      if (selectedArea !== "todas") {
        query = query.eq("area", selectedArea);
      }

      const { data: pendentes, error } = await query;

      if (error) throw error;

      if (!pendentes || pendentes.length === 0) {
        toast.info("Nenhum resumo pendente encontrado!");
        setIsProcessing(false);
        return;
      }

      setCurrentProgress({ current: 0, total: pendentes.length, area: selectedArea === "todas" ? "Todas as áreas" : selectedArea });

      let sucessos = 0;
      let erros = 0;

      for (let i = 0; i < pendentes.length; i++) {
        // Verificar se foi cancelado ou pausado
        if (abortControllerRef.current?.signal.aborted) {
          toast.info("Processamento cancelado pelo usuário");
          break;
        }

        while (isPaused && !abortControllerRef.current?.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const resumo = pendentes[i];
        setCurrentProgress(prev => ({ ...prev, current: i + 1 }));

        // Adicionar log de processamento
        const logEntry: LogEntry = {
          timestamp: new Date(),
          area: resumo.area || "Sem área",
          tema: resumo.tema || "Sem tema",
          subtema: resumo.subtema || "Sem subtema",
          status: 'processing'
        };
        setLogs(prev => [logEntry, ...prev.slice(0, 49)]);

        try {
          await processarResumo(resumo);
          sucessos++;
          
          // Atualizar log com sucesso
          setLogs(prev => [
            { ...prev[0], status: 'success' as const },
            ...prev.slice(1)
          ]);
        } catch (err: unknown) {
          erros++;
          const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
          
          // Atualizar log com erro
          setLogs(prev => [
            { ...prev[0], status: 'error' as const, message: errorMessage },
            ...prev.slice(1)
          ]);
        }

        // Delay entre gerações (exceto no último)
        if (i < pendentes.length - 1 && !abortControllerRef.current?.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        }
      }

      toast.success(`Processamento concluído: ${sucessos} sucessos, ${erros} erros`);
      refetchStats();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro no processamento: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setCurrentProgress({ current: 0, total: 0, area: '' });
    }
  };

  const pausarProcessamento = () => {
    setIsPaused(!isPaused);
    toast.info(isPaused ? "Processamento retomado" : "Processamento pausado");
  };

  const cancelarProcessamento = () => {
    abortControllerRef.current?.abort();
    setIsProcessing(false);
    setIsPaused(false);
    toast.info("Processamento cancelado");
  };

  const getStatusColor = (percentual: number) => {
    if (percentual === 100) return "bg-green-500";
    if (percentual >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusIcon = (percentual: number) => {
    if (percentual === 100) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (percentual >= 50) return <Clock className="w-4 h-4 text-yellow-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Estimar tempo restante
  const tempoEstimado = currentProgress.total > 0 
    ? Math.ceil((currentProgress.total - currentProgress.current) * (delaySeconds + 2) / 60)
    : 0;

  return (
    <div className="space-y-6">
      {/* Card de Progresso Global */}
      <Card className="bg-gradient-to-r from-teal-500/5 to-cyan-500/5 border-teal-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-teal-500" />
            Progresso Global - Resumos de Matéria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {totais.gerados.toLocaleString()} / {totais.total.toLocaleString()} resumos gerados
            </span>
            <Badge variant={percentualGlobal === 100 ? "default" : "secondary"} className={percentualGlobal === 100 ? "bg-green-500" : ""}>
              {percentualGlobal}%
            </Badge>
          </div>
          <Progress value={percentualGlobal} className="h-3" />
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-red-500">{totais.pendentes.toLocaleString()}</span>
            <span className="text-muted-foreground">resumos pendentes</span>
          </div>
        </CardContent>
      </Card>

      {/* Controles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Controles de Geração em Lote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area">Área</Label>
              <Select value={selectedArea} onValueChange={setSelectedArea} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as áreas</SelectItem>
                  {areasStats?.map(area => (
                    <SelectItem key={area.area} value={area.area}>
                      {area.area} ({area.pendentes} pendentes)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limite">Limite por sessão</Label>
              <Input
                id="limite"
                type="number"
                min={1}
                max={500}
                value={limite}
                onChange={e => setLimite(Math.min(500, Math.max(1, parseInt(e.target.value) || 50)))}
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delay">Delay (segundos)</Label>
              <Input
                id="delay"
                type="number"
                min={1}
                max={10}
                value={delaySeconds}
                onChange={e => setDelaySeconds(Math.min(10, Math.max(1, parseInt(e.target.value) || 3)))}
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={processarLote}
              disabled={isProcessing || isLoading}
              className="gap-2 bg-teal-600 hover:bg-teal-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Iniciar Geração
                </>
              )}
            </Button>

            {isProcessing && (
              <>
                <Button variant="outline" onClick={pausarProcessamento} className="gap-2">
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {isPaused ? "Retomar" : "Pausar"}
                </Button>
                <Button variant="destructive" onClick={cancelarProcessamento} className="gap-2">
                  <Square className="w-4 h-4" />
                  Cancelar
                </Button>
              </>
            )}

            <Button variant="ghost" onClick={() => refetchStats()} disabled={isProcessing} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>

          {/* Progresso atual */}
          {isProcessing && currentProgress.total > 0 && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Gerando {currentProgress.current}/{currentProgress.total} - {currentProgress.area}
                </span>
                <span className="text-muted-foreground">
                  ~{tempoEstimado} min restantes
                </span>
              </div>
              <Progress value={(currentProgress.current / currentProgress.total) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid de Áreas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Status por Área Jurídica</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {areasStats?.map(area => (
                <div
                  key={area.area}
                  className="p-3 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => !isProcessing && setSelectedArea(area.area)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(area.percentual)}
                      <span className="text-sm font-medium truncate max-w-[150px]">{area.area}</span>
                    </div>
                    <Badge variant="outline" className={`text-xs ${area.pendentes === 0 ? 'border-green-500 text-green-500' : ''}`}>
                      {area.percentual}%
                    </Badge>
                  </div>
                  <Progress value={area.percentual} className="h-1.5 mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{area.gerados}/{area.total}</span>
                    {area.pendentes > 0 && (
                      <span className="text-red-500 font-medium">{area.pendentes} pendentes</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log de Atividade */}
      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Log de Atividade</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded text-sm ${
                      log.status === 'error' ? 'bg-red-500/10' :
                      log.status === 'success' ? 'bg-green-500/10' :
                      'bg-muted/50'
                    }`}
                  >
                    {log.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-blue-500 mt-0.5" />}
                    {log.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />}
                    {log.status === 'error' && <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">{formatTime(log.timestamp)}</span>
                        <span className="font-medium truncate">{log.area}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {log.tema} &gt; {log.subtema}
                      </p>
                      {log.message && (
                        <p className="text-xs text-red-500 mt-1">{log.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
