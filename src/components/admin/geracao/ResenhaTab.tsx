import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FileText, RefreshCw, Trash2, Check, X, Loader2, Pause, Scale } from "lucide-react";
import {
  buscarResenhaLeis,
  gerarExplicacaoResenha,
  excluirExplicacaoResenha,
  ResenhaLei
} from "@/lib/api/geracaoApi";

interface BatchProgress {
  current: number;
  total: number;
  isRunning: boolean;
}

export function ResenhaTab() {
  const queryClient = useQueryClient();
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    current: 0,
    total: 0,
    isRunning: false
  });
  const [cancelarBatch, setCancelarBatch] = useState(false);

  const { data: leis = [], isLoading } = useQuery({
    queryKey: ["resenha-leis"],
    queryFn: buscarResenhaLeis
  });

  const gerarExplicacaoMutation = useMutation({
    mutationFn: (leiId: string) => gerarExplicacaoResenha(leiId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resenha-leis"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-geracao"] });
    }
  });

  const excluirExplicacaoMutation = useMutation({
    mutationFn: excluirExplicacaoResenha,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resenha-leis"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-geracao"] });
      toast.success("Explicação excluída");
    }
  });

  const gerarEmLote = async () => {
    const semExplicacao = leis.filter(l => l.ativa && !l.explicacao_lei);

    if (semExplicacao.length === 0) {
      toast.info("Todas as leis ativas já têm explicação");
      return;
    }

    setBatchProgress({ current: 0, total: semExplicacao.length, isRunning: true });
    setCancelarBatch(false);

    for (let i = 0; i < semExplicacao.length; i++) {
      if (cancelarBatch) {
        toast.info("Geração cancelada");
        break;
      }

      const lei = semExplicacao[i];
      setBatchProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        await gerarExplicacaoMutation.mutateAsync(lei.id);
        toast.success(`Explicação gerada: ${lei.numero_lei}`);
      } catch (error) {
        console.error(`Erro ao gerar explicação para ${lei.numero_lei}:`, error);
        toast.error(`Erro: ${lei.numero_lei}`);
      }

      if (i < semExplicacao.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    setBatchProgress({ current: 0, total: 0, isRunning: false });
  };

  const semExplicacao = leis.filter(l => l.ativa && !l.explicacao_lei).length;

  return (
    <div className="space-y-4">
      {/* Ações em lote */}
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={gerarEmLote}
          disabled={batchProgress.isRunning || semExplicacao === 0}
        >
          <Scale className="w-4 h-4 mr-2" />
          Gerar Explicações Faltantes ({semExplicacao})
        </Button>

        {batchProgress.isRunning && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setCancelarBatch(true)}
          >
            <Pause className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        )}
      </div>

      {/* Progresso */}
      {batchProgress.isRunning && (
        <div className="bg-muted p-3 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Gerando explicações...</span>
            <span>{batchProgress.current}/{batchProgress.total}</span>
          </div>
          <Progress value={(batchProgress.current / batchProgress.total) * 100} />
        </div>
      )}

      {/* Lista */}
      <ScrollArea className="h-[500px] border rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="divide-y">
            {leis.map(lei => (
              <div
                key={lei.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={lei.ativa ? "default" : "secondary"} className="shrink-0">
                      {lei.numero_lei}
                    </Badge>
                    {!lei.ativa && (
                      <Badge variant="outline" className="text-xs">Inativa</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {lei.ementa || "Sem ementa"}
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant={lei.explicacao_lei ? "default" : "secondary"} className="gap-1">
                    <FileText className="w-3 h-3" />
                    {lei.explicacao_lei ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </Badge>
                  {lei.explicacao_artigos && (
                    <Badge variant="outline" className="text-xs">
                      Artigos
                    </Badge>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0">
                  {!lei.explicacao_lei && lei.ativa && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        toast.promise(gerarExplicacaoMutation.mutateAsync(lei.id), {
                          loading: "Gerando explicação...",
                          success: "Explicação gerada!",
                          error: "Erro ao gerar"
                        });
                      }}
                      disabled={batchProgress.isRunning || gerarExplicacaoMutation.isPending}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  )}

                  {lei.explicacao_lei && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          toast.promise(
                            excluirExplicacaoMutation.mutateAsync(lei.id).then(() =>
                              gerarExplicacaoMutation.mutateAsync(lei.id)
                            ),
                            {
                              loading: "Regenerando...",
                              success: "Explicação regenerada!",
                              error: "Erro"
                            }
                          );
                        }}
                        disabled={batchProgress.isRunning}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Excluir explicação?")) {
                            excluirExplicacaoMutation.mutate(lei.id);
                          }
                        }}
                        disabled={batchProgress.isRunning}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
