import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BookOpen, CheckCircle, Loader2, Play, ArrowUp, BookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface LivroComConteudo {
  id: number;
  livro: string;
  autor: string | null;
  imagem: string | null;
  totalPaginas: number;
  status: 'pendente' | 'em_progresso' | 'concluido';
  progresso?: number;
  paginasFormatadas?: number;
  totalPaginasFormatadas?: number;
}

const LeituraInterativaFormatacao = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingLivros, setCurrentGeneratingLivros] = useState<string[]>([]);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalToGenerate, setTotalToGenerate] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Buscar livros da BIBLIOTECA-CLASSICOS que têm conteúdo em AULAS INTERATIVAS
  const { data: livrosComConteudo, isLoading, refetch } = useQuery({
    queryKey: ["livros-com-conteudo-interativo"],
    queryFn: async () => {
      // 1. Buscar todos os livros em AULAS INTERATIVAS (agrupados por Livro)
      const { data: aulasInterativas, error: errorAulas } = await (supabase as any)
        .from("AULAS INTERATIVAS")
        .select("Livro");
      
      if (errorAulas) throw errorAulas;

      // Contar páginas por livro
      const livrosPaginas = new Map<string, number>();
      aulasInterativas?.forEach((aula: any) => {
        const livro = aula.Livro;
        if (livro) {
          livrosPaginas.set(livro, (livrosPaginas.get(livro) || 0) + 1);
        }
      });

      const livrosUnicos = Array.from(livrosPaginas.keys());

      if (livrosUnicos.length === 0) return [];

      // 2. Buscar dados completos dos livros na BIBLIOTECA-CLASSICOS
      const { data: livrosBiblioteca, error: errorBiblioteca } = await (supabase as any)
        .from("BIBLIOTECA-CLASSICOS")
        .select("id, livro, autor, imagem")
        .in("livro", livrosUnicos);

      if (errorBiblioteca) throw errorBiblioteca;

      // 3. Buscar status de formatação na LEITURA_FORMATADA
      const { data: formatados, error: errorFormatados } = await (supabase as any)
        .from("LEITURA_FORMATADA")
        .select("livro_id, status, progresso_formatacao, paginas_formatadas, total_paginas");

      if (errorFormatados) throw errorFormatados;

      const statusMap = new Map<number, any>();
      formatados?.forEach((f: any) => {
        statusMap.set(f.livro_id, f);
      });

      // 4. Montar lista final
      const resultado: LivroComConteudo[] = livrosBiblioteca?.map((livro: any) => {
        const statusData = statusMap.get(livro.id);
        return {
          id: livro.id,
          livro: livro.livro,
          autor: livro.autor,
          imagem: livro.imagem,
          totalPaginas: livrosPaginas.get(livro.livro) || 0,
          status: statusData?.status || 'pendente',
          progresso: statusData?.progresso_formatacao,
          paginasFormatadas: statusData?.paginas_formatadas,
          totalPaginasFormatadas: statusData?.total_paginas
        };
      }) || [];

      return resultado.sort((a, b) => {
        // Ordenar: concluidos primeiro, depois em_progresso, depois pendentes
        const ordem = { concluido: 0, em_progresso: 1, pendente: 2 };
        return ordem[a.status] - ordem[b.status];
      });
    },
    refetchInterval: isGenerating ? 3000 : false
  });

  const livrosPendentes = livrosComConteudo?.filter(l => l.status === 'pendente') || [];
  const livrosConcluidos = livrosComConteudo?.filter(l => l.status === 'concluido') || [];
  const livrosEmProgresso = livrosComConteudo?.filter(l => l.status === 'em_progresso') || [];

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const iniciarGeracaoLote = async () => {
    if (livrosPendentes.length === 0) {
      toast({
        title: "Nenhum livro pendente",
        description: "Todos os livros já foram formatados ou estão em progresso.",
      });
      return;
    }

    setIsGenerating(true);
    setTotalToGenerate(livrosPendentes.length);
    setGeneratedCount(0);

    // Gerar 2 livros por vez (livros demoram mais)
    const BATCH_SIZE = 2;
    
    for (let i = 0; i < livrosPendentes.length; i += BATCH_SIZE) {
      const batch = livrosPendentes.slice(i, i + BATCH_SIZE);
      setCurrentGeneratingLivros(batch.map(l => l.livro));
      
      console.log(`📚 Iniciando formatação de ${batch.length} livros: ${batch.map(l => l.livro).join(', ')}`);

      // Chamar a edge function para cada livro do lote em paralelo
      await Promise.all(batch.map(async (livro) => {
        try {
          const { error } = await supabase.functions.invoke('formatar-leitura-interativa', {
            body: {
              livroId: livro.id,
              livroTitulo: livro.livro,
              autor: livro.autor,
              capaUrl: livro.imagem
            }
          });

          if (error) {
            console.error(`❌ Erro ao formatar ${livro.livro}:`, error);
            toast({
              title: "Erro na formatação",
              description: `Erro ao formatar "${livro.livro}": ${error.message}`,
              variant: "destructive"
            });
          } else {
            console.log(`✅ Formatação iniciada para: ${livro.livro}`);
          }
        } catch (err) {
          console.error(`❌ Exceção ao formatar ${livro.livro}:`, err);
        }
      }));

      setGeneratedCount(Math.min(i + BATCH_SIZE, livrosPendentes.length));
      
      // Delay entre lotes
      if (i + BATCH_SIZE < livrosPendentes.length) {
        await delay(5000);
      }
    }

    setIsGenerating(false);
    setCurrentGeneratingLivros([]);
    
    toast({
      title: "Geração iniciada",
      description: `${livrosPendentes.length} livros foram enviados para formatação. Acompanhe o progresso na lista.`,
    });

    // Refetch para atualizar status
    queryClient.invalidateQueries({ queryKey: ["livros-com-conteudo-interativo"] });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="relative h-48 md:h-56 overflow-hidden bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/biblioteca-classicos')}
          className="absolute top-4 left-4 text-white hover:bg-white/20 z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/90 rounded-lg">
              <BookText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Preparar Leitura Interativa</h1>
              <p className="text-sm text-white/90 mt-1">
                {livrosComConteudo?.length || 0} livros com conteúdo disponível
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-3 py-6 max-w-4xl mx-auto">
        {/* Banner de Status */}
        {(isGenerating || livrosEmProgresso.length > 0) && (
          <Card className="mb-6 border-accent/50 bg-accent/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {isGenerating 
                      ? `Formatando: ${currentGeneratingLivros.join(', ')}`
                      : `${livrosEmProgresso.length} livro(s) em formatação`
                    }
                  </p>
                  {isGenerating && (
                    <p className="text-sm text-muted-foreground">
                      {generatedCount} de {totalToGenerate} livros iniciados
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{livrosConcluidos.length}</p>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-accent">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-accent">{livrosEmProgresso.length}</p>
              <p className="text-xs text-muted-foreground">Em progresso</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-muted-foreground">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{livrosPendentes.length}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Botão Gerar Todos */}
        {livrosPendentes.length > 0 && !isGenerating && (
          <Button
            onClick={iniciarGeracaoLote}
            className="w-full mb-6 h-12 text-base"
            disabled={isGenerating}
          >
            <Play className="w-5 h-5 mr-2" />
            Gerar Todas Leituras Interativas ({livrosPendentes.length})
          </Button>
        )}

        {/* Lista de Livros */}
        <div className="space-y-3">
          {livrosComConteudo?.map((livro) => (
            <Card 
              key={livro.id}
              className={`border-l-4 transition-all ${
                livro.status === 'concluido' 
                  ? 'border-l-accent bg-accent/5' 
                  : livro.status === 'em_progresso'
                  ? 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-l-muted-foreground/30'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Imagem do livro */}
                  {livro.imagem ? (
                    <img
                      src={livro.imagem}
                      alt={livro.livro}
                      className="w-16 h-20 object-cover rounded-md shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-muted rounded-md flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}

                  {/* Info do livro */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{livro.livro}</h3>
                    {livro.autor && (
                      <p className="text-sm text-muted-foreground truncate">{livro.autor}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {livro.totalPaginas} páginas de conteúdo
                    </p>
                    {livro.status === 'em_progresso' && livro.paginasFormatadas !== undefined && (
                      <p className="text-xs text-blue-600 mt-1">
                        {livro.paginasFormatadas} de {livro.totalPaginasFormatadas} páginas formatadas
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    {livro.status === 'concluido' ? (
                      <CheckCircle className="w-6 h-6 text-accent" />
                    ) : livro.status === 'em_progresso' ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        {livro.progresso !== undefined && (
                          <span className="text-xs text-blue-600 mt-1">{livro.progresso}%</span>
                        )}
                      </div>
                    ) : (
                      <BookOpen className="w-6 h-6 text-muted-foreground/50" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {livrosComConteudo?.length === 0 && (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum livro com conteúdo disponível em AULAS INTERATIVAS
            </p>
          </Card>
        )}
      </div>

      {/* Botão Voltar ao Topo */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full w-12 h-12 shadow-lg z-50"
          size="icon"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default LeituraInterativaFormatacao;
