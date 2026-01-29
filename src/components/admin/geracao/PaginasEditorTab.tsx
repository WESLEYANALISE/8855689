import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Checkbox 
} from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Trash2, 
  Loader2, 
  BookOpen,
  Eye,
  Search,
  FileText,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Pagina {
  id: string;
  numero_pagina: number;
  html_formatado: string | null;
  capitulo_titulo: string | null;
  is_chapter_start: boolean | null;
  numero_capitulo: number | null;
}

interface LivroInfo {
  livro_titulo: string;
  total_paginas: number;
}

export function PaginasEditorTab() {
  const queryClient = useQueryClient();
  const [livroSelecionado, setLivroSelecionado] = useState<string>("");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [paginaPreview, setPaginaPreview] = useState<Pagina | null>(null);

  // Buscar lista de livros
  const { data: livros = [], isLoading: loadingLivros } = useQuery({
    queryKey: ["paginas-editor-livros"],
    queryFn: async (): Promise<LivroInfo[]> => {
      const { data, error } = await supabase
        .from('leitura_paginas_formatadas')
        .select('livro_titulo');
      
      if (error) throw error;
      
      // Agrupar e contar
      const contagem = new Map<string, number>();
      data?.forEach(p => {
        contagem.set(p.livro_titulo, (contagem.get(p.livro_titulo) || 0) + 1);
      });
      
      return Array.from(contagem.entries())
        .map(([livro_titulo, total_paginas]) => ({ livro_titulo, total_paginas }))
        .sort((a, b) => a.livro_titulo.localeCompare(b.livro_titulo));
    },
    staleTime: 30 * 1000
  });

  // Buscar páginas do livro selecionado
  const { data: paginas = [], isLoading: loadingPaginas } = useQuery({
    queryKey: ["paginas-editor-paginas", livroSelecionado],
    queryFn: async (): Promise<Pagina[]> => {
      if (!livroSelecionado) return [];
      
      const { data, error } = await supabase
        .from('leitura_paginas_formatadas')
        .select('id, numero_pagina, html_formatado, capitulo_titulo, is_chapter_start, numero_capitulo')
        .eq('livro_titulo', livroSelecionado)
        .order('numero_pagina');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!livroSelecionado
  });

  // Mutation para apagar páginas selecionadas
  const apagarPaginasMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('leitura_paginas_formatadas')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      return { count: ids.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["paginas-editor-paginas"] });
      queryClient.invalidateQueries({ queryKey: ["paginas-editor-livros"] });
      queryClient.invalidateQueries({ queryKey: ["biblioteca-livros-stats"] });
      setSelecionados([]);
      toast.success(`${data.count} página(s) apagada(s)`);
    },
    onError: (error) => {
      toast.error(`Erro ao apagar: ${error.message}`);
    }
  });

  // Filtrar páginas por busca
  const paginasFiltradas = paginas.filter(p => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      p.numero_pagina.toString().includes(termo) ||
      p.html_formatado?.toLowerCase().includes(termo) ||
      p.capitulo_titulo?.toLowerCase().includes(termo)
    );
  });

  const toggleSelecionado = (id: string) => {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    if (selecionados.length === paginasFiltradas.length) {
      setSelecionados([]);
    } else {
      setSelecionados(paginasFiltradas.map(p => p.id));
    }
  };

  const getTipoPagina = (pagina: Pagina): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } => {
    const conteudo = pagina.html_formatado || '';
    const tamanho = conteudo.length;
    
    if (tamanho < 50) {
      return { label: "Vazia", variant: "destructive" };
    }
    if (tamanho < 200) {
      return { label: "Curta", variant: "secondary" };
    }
    if (pagina.is_chapter_start) {
      return { label: "Início Cap.", variant: "default" };
    }
    return { label: "Normal", variant: "outline" };
  };

  const livroInfo = livros.find(l => l.livro_titulo === livroSelecionado);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Select value={livroSelecionado} onValueChange={val => { setLivroSelecionado(val); setSelecionados([]); }}>
          <SelectTrigger className="w-full sm:w-[350px]">
            <SelectValue placeholder="Selecione um livro..." />
          </SelectTrigger>
          <SelectContent>
            {loadingLivros ? (
              <SelectItem value="loading" disabled>Carregando...</SelectItem>
            ) : (
              livros.map(livro => (
                <SelectItem key={livro.livro_titulo} value={livro.livro_titulo}>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="truncate max-w-[250px]">{livro.livro_titulo}</span>
                    <Badge variant="outline" className="ml-auto">
                      {livro.total_paginas} págs
                    </Badge>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {livroInfo && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>{livroInfo.total_paginas} páginas totais</span>
          </div>
        )}
      </div>

      {livroSelecionado && (
        <>
          {/* Barra de busca e ações */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou conteúdo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={selecionados.length === paginasFiltradas.length && paginasFiltradas.length > 0}
                onCheckedChange={selecionarTodos}
              />
              <span className="text-sm text-muted-foreground">
                {selecionados.length} selecionada(s)
              </span>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (selecionados.length > 0 && confirm(`Apagar ${selecionados.length} página(s) selecionada(s)?`)) {
                    apagarPaginasMutation.mutate(selecionados);
                  }
                }}
                disabled={selecionados.length === 0 || apagarPaginasMutation.isPending}
              >
                {apagarPaginasMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1" />
                )}
                Apagar Selecionadas
              </Button>
            </div>
          </div>

          {/* Lista de páginas */}
          <ScrollArea className="h-[500px] border rounded-lg">
            <div className="p-2 space-y-1">
              {loadingPaginas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : paginasFiltradas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma página encontrada
                </p>
              ) : (
                paginasFiltradas.map((pagina) => {
                  const tipo = getTipoPagina(pagina);
                  const conteudoPreview = (pagina.html_formatado || '').substring(0, 100);
                  
                  return (
                    <div
                      key={pagina.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors",
                        selecionados.includes(pagina.id) 
                          ? "bg-primary/10 ring-1 ring-primary/30" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={selecionados.includes(pagina.id)}
                        onCheckedChange={() => toggleSelecionado(pagina.id)}
                      />
                      
                      {/* Número da página */}
                      <div className="w-12 text-center">
                        <span className="font-mono text-sm font-medium">
                          {pagina.numero_pagina}
                        </span>
                      </div>
                      
                      {/* Tipo */}
                      <Badge variant={tipo.variant} className="w-20 justify-center text-xs">
                        {tipo.label}
                      </Badge>
                      
                      {/* Preview do conteúdo */}
                      <div className="flex-1 min-w-0">
                        {pagina.is_chapter_start && pagina.capitulo_titulo && (
                          <p className="text-xs font-medium text-primary truncate mb-0.5">
                            📖 {pagina.capitulo_titulo}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground truncate">
                          {conteudoPreview || "(Sem conteúdo)"}...
                        </p>
                      </div>
                      
                      {/* Tamanho */}
                      <div className="text-xs text-muted-foreground w-16 text-right">
                        {(pagina.html_formatado?.length || 0).toLocaleString()} chars
                      </div>
                      
                      {/* Ações */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setPaginaPreview(pagina)}
                        title="Visualizar conteúdo"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Apagar página ${pagina.numero_pagina}?`)) {
                            apagarPaginasMutation.mutate([pagina.id]);
                          }
                        }}
                        disabled={apagarPaginasMutation.isPending}
                        title="Apagar página"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Resumo */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>
                {paginas.filter(p => (p.html_formatado?.length || 0) >= 200).length} normais
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>
                {paginas.filter(p => {
                  const len = p.html_formatado?.length || 0;
                  return len >= 50 && len < 200;
                }).length} curtas
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-destructive" />
              <span>
                {paginas.filter(p => (p.html_formatado?.length || 0) < 50).length} vazias
              </span>
            </div>
          </div>
        </>
      )}

      {/* Modal de preview */}
      <Dialog open={!!paginaPreview} onOpenChange={(open) => !open && setPaginaPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Página {paginaPreview?.numero_pagina}
              {paginaPreview?.is_chapter_start && (
                <Badge variant="default" className="ml-2">Início de Capítulo</Badge>
              )}
            </DialogTitle>
            {paginaPreview?.capitulo_titulo && (
              <DialogDescription>
                {paginaPreview.capitulo_titulo}
              </DialogDescription>
            )}
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                {paginaPreview?.html_formatado || "(Sem conteúdo)"}
              </pre>
            </div>
          </ScrollArea>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {(paginaPreview?.html_formatado?.length || 0).toLocaleString()} caracteres
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (paginaPreview && confirm(`Apagar página ${paginaPreview.numero_pagina}?`)) {
                  apagarPaginasMutation.mutate([paginaPreview.id]);
                  setPaginaPreview(null);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Apagar esta página
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
