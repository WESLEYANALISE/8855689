import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FileText, Mic, RefreshCw, Trash2, Pause, Check, X, Loader2, Image } from "lucide-react";
import {
  buscarBloggerArtigos,
  buscarCategoriasBlogger,
  gerarConteudoBlogger,
  gerarAudioBlogger,
  gerarCapaBlogger,
  excluirConteudoBlogger,
  excluirAudioBlogger,
  excluirCapaBlogger,
  BloggerArtigo
} from "@/lib/api/geracaoApi";

interface BatchProgress {
  current: number;
  total: number;
  isRunning: boolean;
  tipo: "conteudo" | "audio" | "capa" | null;
}

export function BloggerTab() {
  const queryClient = useQueryClient();
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    current: 0,
    total: 0,
    isRunning: false,
    tipo: null
  });
  const cancelarBatchRef = useRef(false);

  const { data: categorias = [] } = useQuery({
    queryKey: ["blogger-categorias"],
    queryFn: buscarCategoriasBlogger
  });

  const { data: artigos = [], isLoading } = useQuery({
    queryKey: ["blogger-artigos", categoriaFiltro],
    queryFn: () => buscarBloggerArtigos(categoriaFiltro === "todas" ? undefined : categoriaFiltro)
  });

  const gerarConteudoMutation = useMutation({
    mutationFn: (artigo: BloggerArtigo) =>
      gerarConteudoBlogger(artigo.categoria, artigo.ordem, artigo.titulo, artigo.topicos || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogger-artigos"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-geracao"] });
    }
  });

  const gerarAudioMutation = useMutation({
    mutationFn: async (artigo: BloggerArtigo) => {
      if (!artigo.conteudo_gerado) throw new Error("Artigo sem conteúdo");
      return gerarAudioBlogger(artigo.conteudo_gerado, artigo.categoria, artigo.ordem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogger-artigos"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-geracao"] });
    }
  });

  const excluirConteudoMutation = useMutation({
    mutationFn: excluirConteudoBlogger,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogger-artigos"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-geracao"] });
      toast.success("Conteúdo excluído");
    }
  });

  const excluirAudioMutation = useMutation({
    mutationFn: excluirAudioBlogger,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogger-artigos"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-geracao"] });
      toast.success("Áudio excluído");
    }
  });

  const gerarCapaMutation = useMutation({
    mutationFn: (artigo: BloggerArtigo) =>
      gerarCapaBlogger(artigo.categoria, artigo.ordem, artigo.titulo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogger-artigos"] });
    }
  });

  const excluirCapaMutation = useMutation({
    mutationFn: excluirCapaBlogger,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogger-artigos"] });
      toast.success("Capa excluída");
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

  const gerarConteudoEmLote = async (tipo: "conteudo" | "audio" | "capa") => {
    const artigosFiltrados = artigos.filter(a => {
      if (selecionados.length > 0) return selecionados.includes(a.id);
      if (tipo === "conteudo") return !a.conteudo_gerado;
      if (tipo === "audio") return !a.url_audio && a.conteudo_gerado;
      if (tipo === "capa") return !a.url_capa && a.conteudo_gerado;
      return false;
    });

    if (artigosFiltrados.length === 0) {
      toast.info("Nenhum artigo para processar");
      return;
    }

    setBatchProgress({ current: 0, total: artigosFiltrados.length, isRunning: true, tipo });
    cancelarBatchRef.current = false;

    for (let i = 0; i < artigosFiltrados.length; i++) {
      if (cancelarBatchRef.current) {
        toast.info("Geração em lote cancelada");
        break;
      }

      const artigo = artigosFiltrados[i];
      setBatchProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        if (tipo === "conteudo") {
          await gerarConteudoMutation.mutateAsync(artigo);
        } else if (tipo === "audio") {
          await gerarAudioMutation.mutateAsync(artigo);
        } else {
          await gerarCapaMutation.mutateAsync(artigo);
        }
        const tipoNome = tipo === "conteudo" ? "Conteúdo" : tipo === "audio" ? "Áudio" : "Capa";
        toast.success(`${tipoNome} gerado: ${artigo.titulo.substring(0, 30)}...`);
      } catch (error) {
        console.error(`Erro ao gerar ${tipo} para ${artigo.titulo}:`, error);
        toast.error(`Erro: ${artigo.titulo.substring(0, 30)}...`);
      }

      // Delay entre requisições (maior para capas por ser mais pesado)
      if (i < artigosFiltrados.length - 1) {
        await new Promise(resolve => setTimeout(resolve, tipo === "capa" ? 5000 : 2000));
      }
    }

    setBatchProgress({ current: 0, total: 0, isRunning: false, tipo: null });
    setSelecionados([]);
  };

  const semConteudo = artigos.filter(a => !a.conteudo_gerado).length;
  const semAudio = artigos.filter(a => !a.url_audio && a.conteudo_gerado).length;
  const semCapa = artigos.filter(a => !a.url_capa && a.conteudo_gerado).length;

  return (
    <div className="space-y-4">
      {/* Filtros e ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categorias.map(cat => (
              <SelectItem key={cat.categoria} value={cat.categoria}>
                {cat.categoria} ({cat.total})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
      </div>

      {/* Botões de ação em lote - Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Button
          size="sm"
          onClick={() => gerarConteudoEmLote("conteudo")}
          disabled={batchProgress.isRunning}
          className="justify-start"
        >
          <FileText className="w-4 h-4 mr-2 shrink-0" />
          <span className="truncate">
            {selecionados.length > 0
              ? `Conteúdo (${selecionados.length})`
              : `Conteúdo Faltante (${semConteudo})`}
          </span>
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => gerarConteudoEmLote("audio")}
          disabled={batchProgress.isRunning}
          className="justify-start"
        >
          <Mic className="w-4 h-4 mr-2 shrink-0" />
          <span className="truncate">
            {selecionados.length > 0
              ? `Áudio (${selecionados.length})`
              : `Áudios Faltantes (${semAudio})`}
          </span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => gerarConteudoEmLote("capa")}
          disabled={batchProgress.isRunning}
          className="justify-start"
        >
          <Image className="w-4 h-4 mr-2 shrink-0" />
          <span className="truncate">
            {selecionados.length > 0
              ? `Capa (${selecionados.length})`
              : `Capas Faltantes (${semCapa})`}
          </span>
        </Button>

        {batchProgress.isRunning && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => { cancelarBatchRef.current = true; }}
            className="justify-start"
          >
            <Pause className="w-4 h-4 mr-2 shrink-0" />
            Cancelar
          </Button>
        )}
      </div>

      {/* Progresso do lote */}
      {batchProgress.isRunning && (
        <div className="bg-muted p-3 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Gerando {batchProgress.tipo === "conteudo" ? "conteúdo" : batchProgress.tipo === "audio" ? "áudio" : "capa"}...</span>
            <span>{batchProgress.current}/{batchProgress.total}</span>
          </div>
          <Progress value={(batchProgress.current / batchProgress.total) * 100} />
        </div>
      )}

      {/* Lista de artigos - Layout Responsivo */}
      <ScrollArea className="h-[500px] border rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="divide-y">
            {artigos.map(artigo => {
              const temConteudo = !!artigo.conteudo_gerado;
              const temAudio = !!artigo.url_audio;
              const temCapa = !!artigo.url_capa;
              const completo = temConteudo && temAudio && temCapa;
              
              return (
                <div
                  key={artigo.id}
                  className={`p-3 hover:bg-muted/50 ${
                    completo 
                      ? 'bg-green-500/5 border-l-2 border-l-green-500' 
                      : temConteudo 
                        ? 'bg-amber-500/5 border-l-2 border-l-amber-500' 
                        : ''
                  }`}
                >
                  {/* Mobile: Stack vertical */}
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
                            : temConteudo 
                              ? 'border-amber-500 data-[state=checked]:bg-amber-500' 
                              : ''
                        }`}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight line-clamp-2">
                          {artigo.titulo}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                            {artigo.categoria}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">#{artigo.ordem}</span>
                        </div>
                      </div>
                    </div>

                    {/* Linha 2: Status + Ações */}
                    <div className="flex items-center justify-between pl-7">
                      {/* Status badges compactos */}
                      <div className="flex items-center gap-1">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${
                          temConteudo ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
                        }`}>
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${
                          temAudio ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Mic className="w-3.5 h-3.5" />
                        </div>
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${
                          temCapa ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Image className="w-3.5 h-3.5" />
                        </div>
                        
                        {completo && (
                          <Badge className="bg-green-500 text-[10px] h-5 px-1.5">Completo</Badge>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-0.5">
                        {!temConteudo && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              toast.promise(gerarConteudoMutation.mutateAsync(artigo), {
                                loading: "Gerando conteúdo...",
                                success: "Conteúdo gerado!",
                                error: "Erro ao gerar"
                              });
                            }}
                            disabled={batchProgress.isRunning || gerarConteudoMutation.isPending}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {temConteudo && !temAudio && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              toast.promise(gerarAudioMutation.mutateAsync(artigo), {
                                loading: "Gerando áudio...",
                                success: "Áudio gerado!",
                                error: "Erro ao gerar"
                              });
                            }}
                            disabled={batchProgress.isRunning || gerarAudioMutation.isPending}
                          >
                            <Mic className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {temConteudo && !temCapa && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              toast.promise(gerarCapaMutation.mutateAsync(artigo), {
                                loading: "Gerando capa...",
                                success: "Capa gerada!",
                                error: "Erro ao gerar"
                              });
                            }}
                            disabled={batchProgress.isRunning || gerarCapaMutation.isPending}
                          >
                            <Image className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {temConteudo && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              toast.promise(
                                Promise.all([
                                  excluirConteudoMutation.mutateAsync(artigo.id),
                                  artigo.url_audio ? excluirAudioMutation.mutateAsync(artigo.id) : Promise.resolve(),
                                  artigo.url_capa ? excluirCapaMutation.mutateAsync(artigo.id) : Promise.resolve()
                                ]),
                                {
                                  loading: "Regenerando...",
                                  success: () => {
                                    gerarConteudoMutation.mutate(artigo);
                                    return "Regenerando conteúdo...";
                                  },
                                  error: "Erro"
                                }
                              );
                            }}
                            disabled={batchProgress.isRunning}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {(temConteudo || temAudio || temCapa) && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => {
                              if (confirm("Excluir conteúdo, áudio e capa?")) {
                                if (temConteudo) excluirConteudoMutation.mutate(artigo.id);
                                if (temAudio) excluirAudioMutation.mutate(artigo.id);
                                if (temCapa) excluirCapaMutation.mutate(artigo.id);
                              }
                            }}
                            disabled={batchProgress.isRunning}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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