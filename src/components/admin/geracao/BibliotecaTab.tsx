import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Image, 
  RefreshCw, 
  Trash2, 
  Pause, 
  Check, 
  X, 
  Loader2, 
  BookOpen,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LivroStats {
  livro_titulo: string;
  total_paginas: number;
  total_capitulos: number;
  capitulos_com_capa: number;
  capitulos_com_audio: number;
}

interface Capitulo {
  numero_pagina: number;
  capitulo_titulo: string;
  url_capa_capitulo: string | null;
  url_audio_capitulo: string | null;
}

interface BatchProgress {
  current: number;
  total: number;
  isRunning: boolean;
  tipo: "capa" | "audio" | null;
  capituloAtual?: string;
}

export function BibliotecaTab() {
  const queryClient = useQueryClient();
  const [livroSelecionado, setLivroSelecionado] = useState<string>("");
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    current: 0,
    total: 0,
    isRunning: false,
    tipo: null
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const cancelarBatchRef = useRef(false);

  // Buscar lista de livros com estatísticas
  const { data: livros = [], isLoading: loadingLivros } = useQuery({
    queryKey: ["biblioteca-livros-stats"],
    queryFn: async (): Promise<LivroStats[]> => {
      // Query manual para calcular estatísticas
      const { data: paginasData, error: paginasError } = await supabase
        .from('leitura_paginas_formatadas')
        .select('livro_titulo, is_chapter_start, url_capa_capitulo, url_audio_capitulo');
      
      if (paginasError) throw paginasError;
      
      // Agrupar manualmente
      const statsMap = new Map<string, LivroStats>();
      
      paginasData?.forEach(p => {
        if (!statsMap.has(p.livro_titulo)) {
          statsMap.set(p.livro_titulo, {
            livro_titulo: p.livro_titulo,
            total_paginas: 0,
            total_capitulos: 0,
            capitulos_com_capa: 0,
            capitulos_com_audio: 0
          });
        }
        const stats = statsMap.get(p.livro_titulo)!;
        stats.total_paginas++;
        if (p.is_chapter_start) {
          stats.total_capitulos++;
          if (p.url_capa_capitulo) stats.capitulos_com_capa++;
          if (p.url_audio_capitulo) stats.capitulos_com_audio++;
        }
      });
      
      return Array.from(statsMap.values()).sort((a, b) => a.livro_titulo.localeCompare(b.livro_titulo));
    },
    staleTime: 30 * 1000
  });

  // Buscar capítulos do livro selecionado
  const { data: capitulos = [], isLoading: loadingCapitulos } = useQuery({
    queryKey: ["biblioteca-capitulos", livroSelecionado],
    queryFn: async (): Promise<Capitulo[]> => {
      if (!livroSelecionado) return [];
      
      const { data, error } = await supabase
        .from('leitura_paginas_formatadas')
        .select('numero_pagina, capitulo_titulo, url_capa_capitulo, url_audio_capitulo')
        .eq('livro_titulo', livroSelecionado)
        .eq('is_chapter_start', true)
        .order('numero_pagina');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!livroSelecionado
  });

  // Mutation para gerar capa
  const gerarCapaMutation = useMutation({
    mutationFn: async ({ capitulo, forceRegenerate }: { capitulo: Capitulo; forceRegenerate: boolean }) => {
      const { data, error } = await supabase.functions.invoke('gerar-capa-capitulo-leitura', {
        body: {
          livroTitulo: livroSelecionado,
          capituloTitulo: capitulo.capitulo_titulo,
          numeroCapitulo: capitulo.numero_pagina,
          forceRegenerate
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biblioteca-capitulos"] });
      queryClient.invalidateQueries({ queryKey: ["biblioteca-livros-stats"] });
    }
  });

  // Mutation para apagar capa
  const apagarCapaMutation = useMutation({
    mutationFn: async (capitulo: Capitulo) => {
      if (capitulo.url_capa_capitulo) {
        // Extrair path do storage
        const urlParts = capitulo.url_capa_capitulo.split('/gerador-imagens/');
        if (urlParts[1]) {
          const filePath = decodeURIComponent(urlParts[1]);
          await supabase.storage.from('gerador-imagens').remove([filePath]);
        }
      }
      
      // Limpar URL no banco
      const { error } = await supabase
        .from('leitura_paginas_formatadas')
        .update({ url_capa_capitulo: null })
        .eq('livro_titulo', livroSelecionado)
        .eq('capitulo_titulo', capitulo.capitulo_titulo)
        .eq('is_chapter_start', true);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biblioteca-capitulos"] });
      queryClient.invalidateQueries({ queryKey: ["biblioteca-livros-stats"] });
      toast.success("Capa apagada");
    }
  });

  // Mutation para apagar e reformatar livro
  const apagarEReformatarMutation = useMutation({
    mutationFn: async () => {
      if (!livroSelecionado) throw new Error("Nenhum livro selecionado");
      
      // 1. Apagar páginas formatadas
      const { error: erroPaginas } = await supabase
        .from('leitura_paginas_formatadas')
        .delete()
        .ilike('livro_titulo', `%${livroSelecionado}%`);
      
      if (erroPaginas) {
        console.error('Erro ao apagar páginas:', erroPaginas);
        throw erroPaginas;
      }
      
      // 2. Apagar índice de capítulos
      const { error: erroIndice } = await supabase
        .from('leitura_livros_indice')
        .delete()
        .ilike('livro_titulo', `%${livroSelecionado}%`);
      
      if (erroIndice) {
        console.error('Erro ao apagar índice:', erroIndice);
        // Não falhar se não conseguir apagar índice
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biblioteca-capitulos"] });
      queryClient.invalidateQueries({ queryKey: ["biblioteca-livros-stats"] });
      setLivroSelecionado("");
      toast.success("Livro apagado. Abra-o novamente para reformatar.");
    },
    onError: (error) => {
      toast.error(`Erro ao apagar: ${error.message}`);
    }
  });

  // NARRAÇÃO DESATIVADA TEMPORARIAMENTE
  // const gerarNarracaoMutation = useMutation({...});

  const toggleSelecionado = (pag: number) => {
    setSelecionados(prev =>
      prev.includes(pag) ? prev.filter(x => x !== pag) : [...prev, pag]
    );
  };

  const selecionarTodos = () => {
    if (selecionados.length === capitulos.length) {
      setSelecionados([]);
    } else {
      setSelecionados(capitulos.map(c => c.numero_pagina));
    }
  };

  // Geração em lote de capas
  const gerarCapasEmLote = async (forceRegenerate = false) => {
    const capitulosParaGerar = capitulos.filter(c => 
      selecionados.includes(c.numero_pagina) && 
      (forceRegenerate || !c.url_capa_capitulo)
    );
    
    if (capitulosParaGerar.length === 0) {
      toast.info("Nenhum capítulo para gerar");
      return;
    }
    
    cancelarBatchRef.current = false;
    setBatchProgress({
      current: 0,
      total: capitulosParaGerar.length,
      isRunning: true,
      tipo: "capa"
    });
    
    let sucesso = 0;
    let erro = 0;
    
    for (let i = 0; i < capitulosParaGerar.length; i++) {
      if (cancelarBatchRef.current) {
        toast.info("Geração cancelada");
        break;
      }
      
      const cap = capitulosParaGerar[i];
      setBatchProgress(prev => ({
        ...prev,
        current: i + 1,
        capituloAtual: cap.capitulo_titulo
      }));
      
      try {
        await gerarCapaMutation.mutateAsync({ capitulo: cap, forceRegenerate });
        sucesso++;
      } catch (err) {
        console.error(`Erro ao gerar capa para ${cap.capitulo_titulo}:`, err);
        erro++;
      }
      
      // Delay entre gerações
      if (i < capitulosParaGerar.length - 1) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    
    setBatchProgress(prev => ({ ...prev, isRunning: false }));
    toast.success(`Capas geradas: ${sucesso} sucesso, ${erro} erros`);
    queryClient.invalidateQueries({ queryKey: ["biblioteca-capitulos"] });
  };

  // NARRAÇÃO DESATIVADA TEMPORARIAMENTE
  // const gerarNarracoesEmLote = async () => {...};

  const cancelarBatch = () => {
    cancelarBatchRef.current = true;
  };

  const livroStats = livros.find(l => l.livro_titulo === livroSelecionado);

  return (
    <div className="space-y-6">
      {/* Seletor de livro */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={livroSelecionado} onValueChange={setLivroSelecionado}>
          <SelectTrigger className="w-full sm:w-[400px]">
            <SelectValue placeholder="Selecione um livro..." />
          </SelectTrigger>
          <SelectContent>
            {loadingLivros ? (
              <SelectItem value="loading" disabled>Carregando...</SelectItem>
            ) : (
              livros.map(livro => (
                <SelectItem key={livro.livro_titulo} value={livro.livro_titulo}>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="truncate max-w-[300px]">{livro.livro_titulo}</span>
                    <Badge variant="outline" className="ml-auto">
                      {livro.total_capitulos} caps
                    </Badge>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        {livroStats && (
          <div className="flex gap-4 text-sm items-center">
            <div className="flex items-center gap-1">
              <Image className="w-4 h-4 text-amber-500" />
              <span>{livroStats.capitulos_com_capa}/{livroStats.total_capitulos} capas</span>
            </div>
            
            {/* Botão para apagar e reformatar */}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm(`Apagar TODAS as páginas e índice de "${livroSelecionado}"?\n\nIsso permitirá reformatar do zero.`)) {
                  apagarEReformatarMutation.mutate();
                }
              }}
              disabled={apagarEReformatarMutation.isPending}
            >
              {apagarEReformatarMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1" />
              )}
              Apagar e Reformatar
            </Button>
          </div>
        )}
      </div>

      {/* Progresso do batch */}
      {batchProgress.isRunning && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <Image className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div>
                  <span className="text-sm font-medium">Gerando capas...</span>
                  <p className="text-xs text-muted-foreground">
                    {batchProgress.capituloAtual}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-primary">
                  {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                </span>
                <Button variant="ghost" size="sm" onClick={cancelarBatch}>
                  <Pause className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
            <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {batchProgress.current} de {batchProgress.total} capítulos processados
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista de capítulos */}
      {livroSelecionado && (
        <div className="space-y-4">
          {/* Ações em lote */}
          <div className="flex flex-wrap gap-2 items-center">
            <Checkbox
              checked={selecionados.length === capitulos.length && capitulos.length > 0}
              onCheckedChange={selecionarTodos}
            />
            <span className="text-sm text-muted-foreground">
              {selecionados.length} selecionados
            </span>
            
            <div className="flex-1" />
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => gerarCapasEmLote(false)}
              disabled={selecionados.length === 0 || batchProgress.isRunning}
            >
              <Image className="w-4 h-4 mr-1" />
              Gerar Capas
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => gerarCapasEmLote(true)}
              disabled={selecionados.length === 0 || batchProgress.isRunning}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Regenerar Capas
            </Button>
            
            {/* NARRAÇÃO DESATIVADA TEMPORARIAMENTE */}
          </div>

          {/* Lista */}
          <ScrollArea className="h-[500px] border rounded-lg">
            <div className="p-4 space-y-2">
              {loadingCapitulos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : capitulos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum capítulo encontrado
                </p>
              ) : (
                capitulos.map((cap, idx) => (
                  <div
                    key={cap.numero_pagina}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selecionados.includes(cap.numero_pagina)}
                      onCheckedChange={() => toggleSelecionado(cap.numero_pagina)}
                    />
                    
                    {/* Preview da capa */}
                    <div 
                      className="w-16 h-10 rounded overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
                      onClick={() => cap.url_capa_capitulo && setPreviewImage(cap.url_capa_capitulo)}
                    >
                      {cap.url_capa_capitulo ? (
                        <img 
                          src={cap.url_capa_capitulo} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Título */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {idx + 1}. {cap.capitulo_titulo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Página {cap.numero_pagina}
                      </p>
                    </div>
                    
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {cap.url_capa_capitulo ? (
                        <Badge variant="default" className="gap-1">
                          <Check className="w-3 h-3" />
                          Capa
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <X className="w-3 h-3" />
                          Capa
                        </Badge>
                      )}
                      
                      {/* ÁUDIO DESATIVADO TEMPORARIAMENTE */}
                    </div>
                    
                    {/* Ações individuais */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => gerarCapaMutation.mutate({ capitulo: cap, forceRegenerate: true })}
                        disabled={gerarCapaMutation.isPending}
                        title="Regenerar capa"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      
                      {cap.url_capa_capitulo && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => apagarCapaMutation.mutate(cap)}
                          disabled={apagarCapaMutation.isPending}
                          title="Apagar capa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {/* BOTÃO PLAY ÁUDIO DESATIVADO TEMPORARIAMENTE */}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Modal de preview de imagem */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-[90vh] rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
