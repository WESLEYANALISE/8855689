import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FileText, Mic, RefreshCw, Trash2, Pause, Check, X, Loader2 } from "lucide-react";
import {
  buscarCodigosVadeMecum,
  buscarArtigosComExplicacao,
  gerarNarracaoVadeMecum,
  excluirNarracaoVadeMecum,
  VadeMecumArtigo,
  VadeMecumCodigo
} from "@/lib/api/vadeMecumGeracaoApi";

interface BatchProgress {
  current: number;
  total: number;
  isRunning: boolean;
  tipo: "narracao" | null;
}

export function VadeMecumTab() {
  const queryClient = useQueryClient();
  const [codigoSelecionado, setCodigoSelecionado] = useState<string>("");
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    current: 0,
    total: 0,
    isRunning: false,
    tipo: null
  });
  const cancelarBatchRef = useRef(false);

  // Buscar lista de códigos
  const { data: codigos = [], isLoading: loadingCodigos } = useQuery({
    queryKey: ["vademecum-codigos"],
    queryFn: buscarCodigosVadeMecum,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });

  // Buscar artigos do código selecionado
  const { data: artigos = [], isLoading: loadingArtigos } = useQuery({
    queryKey: ["vademecum-artigos", codigoSelecionado],
    queryFn: () => {
      const codigo = codigos.find(c => c.codigo === codigoSelecionado);
      if (!codigo) return [];
      return buscarArtigosComExplicacao(codigo.tableName);
    },
    enabled: !!codigoSelecionado && codigos.length > 0
  });

  // Mutation para gerar narração
  const gerarNarracaoMutation = useMutation({
    mutationFn: async (artigo: VadeMecumArtigo) => {
      return gerarNarracaoVadeMecum(
        artigo.tableName,
        artigo.id,
        artigo.numeroArtigo,
        artigo.explicacaoTecnico || artigo.artigo
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vademecum-artigos"] });
      queryClient.invalidateQueries({ queryKey: ["vademecum-codigos"] });
    }
  });

  // Mutation para excluir narração
  const excluirNarracaoMutation = useMutation({
    mutationFn: async (artigo: VadeMecumArtigo) => {
      return excluirNarracaoVadeMecum(artigo.tableName, artigo.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vademecum-artigos"] });
      queryClient.invalidateQueries({ queryKey: ["vademecum-codigos"] });
      toast.success("Narração excluída");
    }
  });

  const toggleSelecionado = (id: number) => {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    if (selecionados.length === artigos.length) {
      setSelecionados([]);
    } else {
      setSelecionados(artigos.map(a => a.id));
    }
  };

  // Geração em lote de narrações
  const gerarNarracaoEmLote = async () => {
    const artigosFiltrados = artigos.filter(a => {
      if (selecionados.length > 0) return selecionados.includes(a.id);
      // Se não tem seleção, pegar apenas os que têm explicação mas não têm narração
      return a.explicacaoTecnico && !a.narracao;
    });

    if (artigosFiltrados.length === 0) {
      toast.info("Nenhum artigo para processar");
      return;
    }

    setBatchProgress({ current: 0, total: artigosFiltrados.length, isRunning: true, tipo: "narracao" });
    cancelarBatchRef.current = false;

    for (let i = 0; i < artigosFiltrados.length; i++) {
      if (cancelarBatchRef.current) {
        toast.info("Geração em lote cancelada");
        break;
      }

      const artigo = artigosFiltrados[i];
      setBatchProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        await gerarNarracaoMutation.mutateAsync(artigo);
        toast.success(`Narração gerada: Art. ${artigo.numeroArtigo}`);
      } catch (error) {
        console.error(`Erro ao gerar narração para Art. ${artigo.numeroArtigo}:`, error);
        toast.error(`Erro: Art. ${artigo.numeroArtigo}`);
      }

      // Delay maior entre requisições de áudio (5 segundos)
      if (i < artigosFiltrados.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    setBatchProgress({ current: 0, total: 0, isRunning: false, tipo: null });
    setSelecionados([]);
  };

  const codigoInfo = codigos.find(c => c.codigo === codigoSelecionado);
  const semNarracao = artigos.filter(a => !a.narracao).length;

  return (
    <div className="space-y-4">
      {/* Seletor de código */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select 
          value={codigoSelecionado} 
          onValueChange={(val) => {
            setCodigoSelecionado(val);
            setSelecionados([]);
          }}
        >
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder={loadingCodigos ? "Carregando..." : "Selecione um código"} />
          </SelectTrigger>
          <SelectContent>
            {codigos.map(codigo => (
              <SelectItem key={codigo.codigo} value={codigo.codigo}>
                <span className="flex items-center gap-2">
                  {codigo.tableName.substring(0, 30)}
                  <Badge variant="outline" className="text-[10px]">
                    {codigo.comExplicacao}/{codigo.total}
                  </Badge>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {codigoSelecionado && artigos.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selecionarTodos}
              disabled={batchProgress.isRunning}
            >
              {selecionados.length === artigos.length ? "Desmarcar" : "Selecionar Todos"}
            </Button>

            {selecionados.length > 0 && (
              <Badge variant="secondary">{selecionados.length} selecionados</Badge>
            )}
          </div>
        )}
      </div>

      {/* Info do código selecionado */}
      {codigoInfo && (
        <div className="bg-muted/50 rounded-lg p-3 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Total: <strong>{codigoInfo.total}</strong> artigos</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Com explicação: <strong>{codigoInfo.comExplicacao}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-purple-500" />
            <span>Com narração: <strong>{codigoInfo.comNarracao}</strong></span>
          </div>
        </div>
      )}

      {/* Botões de ação em lote */}
      {codigoSelecionado && artigos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={gerarNarracaoEmLote}
            disabled={batchProgress.isRunning}
          >
            <Mic className="w-4 h-4 mr-2" />
            {selecionados.length > 0
              ? `Gerar Narração (${selecionados.length})`
              : `Narrações Faltantes (${semNarracao})`}
          </Button>

          {batchProgress.isRunning && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => { cancelarBatchRef.current = true; }}
            >
              <Pause className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          )}
        </div>
      )}

      {/* Progresso do lote */}
      {batchProgress.isRunning && (
        <div className="bg-muted p-3 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Gerando narração...</span>
            <span>{batchProgress.current}/{batchProgress.total}</span>
          </div>
          <Progress value={(batchProgress.current / batchProgress.total) * 100} />
        </div>
      )}

      {/* Lista de artigos */}
      <ScrollArea className="h-[500px] border rounded-lg">
        {!codigoSelecionado ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Selecione um código para ver os artigos
          </div>
        ) : loadingArtigos ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : artigos.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Nenhum artigo com explicação gerada neste código
          </div>
        ) : (
          <div className="divide-y">
            {artigos.map(artigo => {
              const temExplicacao = !!artigo.explicacaoTecnico;
              const temNarracao = !!artigo.narracao;
              const completo = temExplicacao && temNarracao;

              return (
                <div
                  key={artigo.id}
                  className={`p-3 hover:bg-muted/50 ${
                    completo 
                      ? 'bg-green-500/5 border-l-2 border-l-green-500' 
                      : temExplicacao 
                        ? 'bg-amber-500/5 border-l-2 border-l-amber-500' 
                        : ''
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    {/* Linha 1: Checkbox + Título */}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selecionados.includes(artigo.id)}
                        onCheckedChange={() => toggleSelecionado(artigo.id)}
                        disabled={batchProgress.isRunning}
                        className={`mt-1 shrink-0 ${
                          completo 
                            ? 'border-green-500 data-[state=checked]:bg-green-500' 
                            : temExplicacao 
                              ? 'border-amber-500 data-[state=checked]:bg-amber-500' 
                              : ''
                        }`}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          Art. {artigo.numeroArtigo}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {artigo.artigo?.substring(0, 150)}...
                        </p>
                      </div>
                    </div>

                    {/* Linha 2: Status + Ações */}
                    <div className="flex items-center justify-between pl-7">
                      {/* Status badges */}
                      <div className="flex items-center gap-1">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${
                          temExplicacao ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
                        }`}>
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${
                          temNarracao ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Mic className="w-3.5 h-3.5" />
                        </div>

                        {completo && (
                          <Badge className="bg-green-500 text-[10px] h-5 px-1.5">Completo</Badge>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-0.5">
                        {temExplicacao && !temNarracao && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              toast.promise(gerarNarracaoMutation.mutateAsync(artigo), {
                                loading: "Gerando narração...",
                                success: "Narração gerada!",
                                error: "Erro ao gerar"
                              });
                            }}
                            disabled={batchProgress.isRunning || gerarNarracaoMutation.isPending}
                          >
                            <Mic className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {temNarracao && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                toast.promise(
                                  excluirNarracaoMutation.mutateAsync(artigo).then(() => 
                                    gerarNarracaoMutation.mutateAsync(artigo)
                                  ),
                                  {
                                    loading: "Regenerando...",
                                    success: "Narração regenerada!",
                                    error: "Erro"
                                  }
                                );
                              }}
                              disabled={batchProgress.isRunning}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={() => excluirNarracaoMutation.mutate(artigo)}
                              disabled={batchProgress.isRunning}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
