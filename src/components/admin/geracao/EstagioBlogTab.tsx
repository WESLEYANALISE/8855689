import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FileText, RefreshCw, Trash2, ExternalLink, Check, X, Loader2, Pause } from "lucide-react";
import {
  buscarEstagioBlogArtigos,
  gerarArtigoEstagioBlog,
  excluirArtigoEstagioBlog,
  EstagioBlogArtigo
} from "@/lib/api/geracaoApi";

interface BatchProgress {
  current: number;
  total: number;
  isRunning: boolean;
}

export function EstagioBlogTab() {
  const queryClient = useQueryClient();
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    current: 0,
    total: 0,
    isRunning: false
  });
  const cancelarBatchRef = useRef(false);

  const { data: artigos = [], isLoading } = useQuery({
    queryKey: ["estagio-blog-artigos"],
    queryFn: buscarEstagioBlogArtigos
  });

  const gerarArtigoMutation = useMutation({
    mutationFn: (numero: number) => gerarArtigoEstagioBlog(numero),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estagio-blog-artigos"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-geracao"] });
    }
  });

  const excluirArtigoMutation = useMutation({
    mutationFn: (numero: number) => excluirArtigoEstagioBlog(numero),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estagio-blog-artigos"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-geracao"] });
      toast.success("Artigo excluído");
    }
  });

  const gerarEmLote = async () => {
    const semArtigo = artigos.filter(a => !a.artigo_melhorado);

    if (semArtigo.length === 0) {
      toast.info("Todos os artigos já foram gerados");
      return;
    }

    setBatchProgress({ current: 0, total: semArtigo.length, isRunning: true });
    cancelarBatchRef.current = false;

    for (let i = 0; i < semArtigo.length; i++) {
      if (cancelarBatchRef.current) {
        toast.info("Geração cancelada");
        break;
      }

      const artigo = semArtigo[i];
      setBatchProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        await gerarArtigoMutation.mutateAsync(artigo.numero);
        toast.success(`Artigo ${artigo.numero} gerado`);
      } catch (error) {
        console.error(`Erro ao gerar artigo ${artigo.numero}:`, error);
        toast.error(`Erro no artigo ${artigo.numero}`);
      }

      if (i < semArtigo.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    setBatchProgress({ current: 0, total: 0, isRunning: false });
  };

  const semArtigo = artigos.filter(a => !a.artigo_melhorado).length;

  return (
    <div className="space-y-4">
      {/* Ações em lote */}
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={gerarEmLote}
          disabled={batchProgress.isRunning || semArtigo === 0}
        >
          <FileText className="w-4 h-4 mr-2" />
          Gerar Artigos Faltantes ({semArtigo})
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

      {/* Progresso */}
      {batchProgress.isRunning && (
        <div className="bg-muted p-3 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Gerando artigos...</span>
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
            {artigos.map(artigo => (
              <div
                key={artigo.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/50"
              >
                <Badge variant="outline" className="shrink-0">
                  #{artigo.numero}
                </Badge>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {artigo.titulo || `Artigo ${artigo.numero}`}
                  </p>
                  {artigo.link_noticia && (
                    <a
                      href={artigo.link_noticia}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Link original
                    </a>
                  )}
                </div>

                {/* Status */}
                <Badge variant={artigo.artigo_melhorado ? "default" : "secondary"} className="gap-1 shrink-0">
                  <FileText className="w-3 h-3" />
                  {artigo.artigo_melhorado ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                </Badge>

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0">
                  {!artigo.artigo_melhorado && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        toast.promise(gerarArtigoMutation.mutateAsync(artigo.numero), {
                          loading: "Gerando artigo...",
                          success: "Artigo gerado!",
                          error: "Erro ao gerar"
                        });
                      }}
                      disabled={batchProgress.isRunning || gerarArtigoMutation.isPending}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  )}

                  {artigo.artigo_melhorado && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          toast.promise(
                            excluirArtigoMutation.mutateAsync(artigo.numero).then(() =>
                              gerarArtigoMutation.mutateAsync(artigo.numero)
                            ),
                            {
                              loading: "Regenerando...",
                              success: "Artigo regenerado!",
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
                          if (confirm("Excluir artigo?")) {
                            excluirArtigoMutation.mutate(artigo.numero);
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
