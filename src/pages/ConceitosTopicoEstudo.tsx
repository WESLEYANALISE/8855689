import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, X, Info, Target, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import StandardPageHeader from "@/components/StandardPageHeader";
import OABTrilhasReader from "@/components/oab/OABTrilhasReader";
import { 
  ConceitosSlidesViewer, 
  ConceitosTopicoIntro,
  type ConceitoSecao 
} from "@/components/conceitos/slides";
import { useAuth } from "@/contexts/AuthContext";
import { markImageLoaded } from "@/hooks/useImagePreload";

interface Flashcard {
  frente: string;
  verso: string;
  exemplo?: string;
}

interface Questao {
  pergunta?: string;
  enunciado?: string;
  alternativas?: string[];
  opcoes?: string[];
  correta: number;
  explicacao: string;
}

interface CorrespondenciaItem {
  termo: string;
  definicao: string;
}

// Modo de visualização do conteúdo
type ViewMode = 'intro' | 'slides' | 'reading';

const ConceitosTopicoEstudo = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Modo de visualização
  const [viewMode, setViewMode] = useState<ViewMode>('intro');
  
  // Key para forçar recarregamento quando voltar de flashcards/questões
  const [readerKey, setReaderKey] = useState(0);
  
  // Estado para controle de fonte - default 16px
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("conceitos-font-size");
    return saved ? parseInt(saved) : 16;
  });
  
  // Salvar preferência de fonte
  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    localStorage.setItem("conceitos-font-size", String(newSize));
  };
  
  // Ref para evitar múltiplas chamadas de auto-trigger
  const autoTriggerRef = useRef(false);
  
  // Estado do progresso do usuário
  const [progressoLeitura, setProgressoLeitura] = useState(0);
  const [progressoFlashcards, setProgressoFlashcards] = useState(0);
  const [progressoQuestoes, setProgressoQuestoes] = useState(0);
  
  useEffect(() => {
    setReaderKey(prev => prev + 1);
  }, [location.key]);

  // Buscar progresso do usuário no banco
  useEffect(() => {
    const carregarProgresso = async () => {
      if (!user || !id) return;
      
      try {
        const { data } = await supabase
          .from('oab_trilhas_estudo_progresso')
          .select('*')
          .eq('user_id', user.id)
          .eq('topico_id', parseInt(id))
          .single();
        
        if (data) {
          setProgressoLeitura(data.progresso_leitura || 0);
          setProgressoFlashcards(data.progresso_flashcards || 0);
          setProgressoQuestoes(data.progresso_questoes || 0);
        }
      } catch (error) {
        // Sem progresso anterior - valores já inicializados em 0
      }
    };
    
    carregarProgresso();
  }, [user, id]);

  // Estado removido - não vamos mais mostrar mensagem de "travado"

  // Enquanto a chamada da Edge Function estiver em execução, precisamos continuar
  // fazendo polling do tópico para refletir o progresso (status/progresso) no UI.
  const [isInvocandoGeracao, setIsInvocandoGeracao] = useState(false);
  const invokeStartedAtRef = useRef<number | null>(null);
  
  // Buscar tópico com matéria - com polling quando está gerando
  const { data: topico, isLoading, refetch } = useQuery({
    queryKey: ["conceitos-topico", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conceitos_topicos")
        .select(`
          *,
          materia:conceitos_materias(*)
        `)
        .eq("id", parseInt(id!))
        .single();

      if (error) throw error;
      
      // Geração contínua - sem verificação de timeout
      
      return data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      // Importante: enquanto a Edge Function está rodando, o status no banco pode
      // demorar a ser refletido no cache do React Query. Então fazemos polling
      // também durante a mutation pendente.
      if (isInvocandoGeracao) return 2000;
      // Continua polling se está gerando ou na fila
      if (data?.status === "gerando" || data?.status === "na_fila") {
        return 2000;
      }
      // Se caiu em erro, ainda fazemos polling por um curto período para garantir
      // que o UI reflita atualizações (ex: reset automático / tentativas).
      if (data?.status === "erro") return 5000;
      return false;
    },
  });

  // Extrair slides JSON se disponível
  const slidesData = useMemo(() => {
    if (!topico?.slides_json) return null;
    const data = topico.slides_json as any;
    if (!data?.secoes || !Array.isArray(data.secoes)) return null;
    return {
      versao: data.versao || 1,
      titulo: data.titulo || topico.titulo,
      tempoEstimado: data.tempoEstimado || "25 min",
      objetivos: data.objetivos || [],
      secoes: data.secoes as ConceitoSecao[]
    };
  }, [topico?.slides_json, topico?.titulo]);

  // Calcular estatísticas das páginas
  const paginasStats = useMemo(() => {
    if (!slidesData?.secoes) return { totalPaginas: 0, totalSecoes: 0 };
    const totalPaginas = slidesData.secoes.reduce((acc, s) => acc + s.slides.length, 0);
    return {
      totalPaginas,
      totalSecoes: slidesData.secoes.length
    };
  }, [slidesData]);

  // 🚀 PRELOAD: Pré-carregar capa + primeiras imagens dos slides quando tópico carrega
  useEffect(() => {
    if (!topico) return;
    
    const imagesToPreload: string[] = [];
    
    // Capa do tópico
    if (topico.capa_url) {
      imagesToPreload.push(topico.capa_url);
    }
    
    // Primeiras 5 imagens dos slides
    if (slidesData?.secoes) {
      let count = 0;
      for (const secao of slidesData.secoes) {
        for (const slide of secao.slides) {
          if (slide.imagemUrl && count < 5) {
            imagesToPreload.push(slide.imagemUrl);
            count++;
          }
          if (count >= 5) break;
        }
        if (count >= 5) break;
      }
    }
    
    // Preload em paralelo
    imagesToPreload.forEach(url => {
      const img = new Image();
      img.onload = () => markImageLoaded(url);
      img.src = url;
    });
  }, [topico, slidesData]);

  // Buscar tópico que está sendo gerado atualmente (para mostrar na fila)
  const { data: topicoGerando } = useQuery({
    queryKey: ["conceitos-topico-gerando"],
    queryFn: async () => {
      const { data } = await supabase
        .from("conceitos_topicos")
        .select("id, titulo, progresso")
        .eq("status", "gerando")
        .maybeSingle();
      return data;
    },
    enabled: topico?.status === "na_fila",
    refetchInterval: 2000,
  });

  // Mutation para gerar conteúdo - recebe forceRestart como parâmetro
  const gerarConteudoMutation = useMutation({
    mutationFn: async (forceRestart: boolean) => {
      const { data, error } = await supabase.functions.invoke("gerar-conteudo-conceitos", {
        body: { topico_id: parseInt(id!), force_restart: forceRestart },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onMutate: async () => {
      setIsInvocandoGeracao(true);
      invokeStartedAtRef.current = Date.now();
      // já começa a puxar o registro atualizado (status/progresso)
      refetch();
    },
    onSuccess: (data) => {
      setIsInvocandoGeracao(false);
      invokeStartedAtRef.current = null;
      refetch();
      if (data?.queued) {
        toast.info(`Adicionado à fila de geração (posição ${data.position})`);
      } else {
        toast.success(data?.message || "Conteúdo gerado com sucesso!");
      }
    },
    onError: (error) => {
      setIsInvocandoGeracao(false);
      invokeStartedAtRef.current = null;
      refetch();
      toast.error("Erro ao gerar conteúdo. Tente novamente.");
      console.error(error);
    },
    onSettled: () => {
      setIsInvocandoGeracao(false);
      invokeStartedAtRef.current = null;
    },
  });

  // Watchdog: se a invocação ficar pendente por muito tempo, força refetch e solta o UI
  // (evita tela travada caso a mutation não resolva por algum motivo de rede/runtime).
  useEffect(() => {
    if (!isInvocandoGeracao) return;
    const interval = setInterval(() => {
      const startedAt = invokeStartedAtRef.current;
      if (!startedAt) return;
      const elapsedMs = Date.now() - startedAt;
      // 90s: suficiente para detectar travamento sem atrapalhar execuções normais.
      if (elapsedMs > 90_000) {
        console.warn("[Conceitos UI] Watchdog: invocação demorou demais, liberando UI e refazendo fetch");
        setIsInvocandoGeracao(false);
        invokeStartedAtRef.current = null;
        refetch();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isInvocandoGeracao, refetch]);

  // Gerar conteúdo automaticamente se não existir
  useEffect(() => {
    if (topico && topico.status === "pendente" && !gerarConteudoMutation.isPending) {
      gerarConteudoMutation.mutate(false);
    }
  }, [topico?.status]);

  // Auto-iniciar quando está na posição 1 da fila e não há outro gerando
  useEffect(() => {
    const isNaFilaPosicao1 = topico?.status === "na_fila" && topico?.posicao_fila === 1;
    // Verificar se realmente não há ninguém gerando (topicoGerando é null/undefined)
    const ninguemGerando = topicoGerando === null;
    
    // Só auto-iniciar se:
    // 1. Está na posição 1 da fila
    // 2. Não há ninguém gerando (topicoGerando é explicitamente null, não undefined)
    // 3. A mutation não está pendente
    // 4. Ainda não disparamos o auto-trigger
    if (isNaFilaPosicao1 && ninguemGerando && !gerarConteudoMutation.isPending && !autoTriggerRef.current) {
      console.log("[Conceitos UI] Auto-iniciando geração da posição 1 - ninguém gerando");
      autoTriggerRef.current = true;
      
      // Delay maior para garantir que o polling detectou corretamente
      const timer = setTimeout(() => {
        gerarConteudoMutation.mutate(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
    
    // Reset ref quando muda de status (concluído, gerando, etc)
    if (topico?.status !== "na_fila") {
      autoTriggerRef.current = false;
    }
  }, [topico?.status, topico?.posicao_fila, topicoGerando, gerarConteudoMutation.isPending]);

  // Preparar dados do conteúdo gerado
  const conteudoGerado = useMemo(() => {
    if (!topico?.conteudo_gerado) return null;
    
    // Primeiro, verificar se temos as páginas estruturadas em termos.paginas
    const termos = topico?.termos as any;
    if (termos?.paginas && Array.isArray(termos.paginas) && termos.paginas.length > 0) {
      return {
        paginas: termos.paginas.map((p: any, idx: number) => ({
          titulo: p.titulo || `Página ${idx + 1}`,
          markdown: p.markdown || '',
          tipo: p.tipo || 'conteudo_principal'
        }))
      };
    }
    
    // Fallback: O conteúdo pode estar em formato string (markdown concatenado)
    const conteudo = topico.conteudo_gerado;
    
    // Títulos padrão para fallback
    const TITULOS_PADRAO = [
      "Introdução",
      "Conteúdo Completo", 
      "Desmembrando o Tema",
      "Entendendo na Prática",
      "Quadro Comparativo",
      "Dicas para Memorizar",
      "Ligar Termos",
      "Síntese Final"
    ];
    
    // Se for string, dividir por separadores
    if (typeof conteudo === 'string') {
      const sections = conteudo.split(/\n---\n/);
      return {
        paginas: sections.map((section, i) => ({
          titulo: TITULOS_PADRAO[i] || `Página ${i + 1}`,
          markdown: section.trim(),
          tipo: i === 0 ? 'introducao' : 
                i === 6 ? 'correspondencias' :
                i === sections.length - 1 ? 'sintese_final' : 'conteudo_principal'
        }))
      };
    }
    
    return conteudo;
  }, [topico?.conteudo_gerado, topico?.termos]);

  // Extrair flashcards e questões
  const flashcards: Flashcard[] = useMemo(() => {
    return (topico?.flashcards as unknown as Flashcard[]) || [];
  }, [topico?.flashcards]);
  
  const questoes: Questao[] = useMemo(() => {
    return (topico?.questoes as unknown as Questao[]) || [];
  }, [topico?.questoes]);

  // Extrair correspondências para o jogo "Ligar Termos"
  const correspondencias: CorrespondenciaItem[] = useMemo(() => {
    const termos = topico?.termos as any;
    if (termos?.correspondencias && Array.isArray(termos.correspondencias)) {
      return termos.correspondencias;
    }
    return [];
  }, [topico?.termos]);

  // Handler para voltar
  const handleBack = () => {
    if (topico?.materia?.id) {
      navigate(`/conceitos/materia/${topico.materia.id}`);
    } else {
      navigate(-1);
    }
  };

  // Função para salvar progresso de leitura - DEVE estar antes de qualquer early return
  const salvarProgressoLeitura = useCallback(async (novoProgresso: number) => {
    setProgressoLeitura(novoProgresso);
    
    if (!user || !id) return;
    
    try {
      await supabase
        .from('oab_trilhas_estudo_progresso')
        .upsert({
          user_id: user.id,
          topico_id: parseInt(id),
          progresso_leitura: novoProgresso,
          leitura_completa: novoProgresso >= 100,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,topico_id' });
    } catch (error) {
      console.error("Erro ao salvar progresso:", error);
    }
  }, [user, id]);

  // Early return AFTER all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Quando o usuário clica em "Tentar novamente" (mutation pending), a UI não deve mostrar o bloco de erro ao mesmo tempo.
  // Não deixe a mutation pendente mascarar um status=erro vindo do banco.
  const isErro = topico?.status === "erro";
  const isGerando = !isErro && (topico?.status === "gerando" || isInvocandoGeracao || gerarConteudoMutation.isPending);
  const isNaFila = topico?.status === "na_fila";
  const progresso = topico?.progresso || 0;

  // Se está no modo páginas, renderiza o viewer de páginas
  if (viewMode === 'slides' && slidesData) {
    return (
      <ConceitosSlidesViewer
        secoes={slidesData.secoes}
        titulo={slidesData.titulo}
        materiaName={topico?.materia?.nome}
        onClose={() => setViewMode('intro')}
        onComplete={() => {
          salvarProgressoLeitura(100);
          toast.success("Parabéns! Você concluiu todas as páginas!");
          setViewMode('intro');
        }}
        onProgressChange={salvarProgressoLeitura}
        initialProgress={progressoLeitura}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ backgroundColor: 'hsl(0, 0%, 8%)' }}>
      {/* Header - esconde no modo intro quando tem páginas */}
      {!(viewMode === 'intro' && slidesData && topico?.status === "concluido") && (
        <StandardPageHeader
          title={topico?.titulo || "Carregando..."}
          subtitle={topico?.materia?.nome}
          onBack={handleBack}
        />
      )}

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col">
        {/* Estado: Na Fila */}
        {isNaFila && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Na fila de geração</h2>
            <p className="text-muted-foreground mb-4">
              Posição: <span className="font-semibold text-foreground">{topico?.posicao_fila || "?"}</span>
            </p>
            
            {/* Mostrar informações do tópico que está gerando */}
            {topicoGerando && (
              <div className="w-full max-w-sm bg-muted/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-muted-foreground mb-2">Gerando agora:</p>
                <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">
                  {topicoGerando.titulo}
                </p>
                <Progress value={topicoGerando.progresso || 0} className="h-2 mb-1" />
                <p className="text-xs text-muted-foreground">{topicoGerando.progresso || 0}% concluído</p>
              </div>
            )}
            
            {!topicoGerando && (
              <p className="text-sm text-muted-foreground mb-4">
                Aguardando processamento...
              </p>
            )}
            
            <div className="w-full max-w-xs">
              <Progress value={0} className="h-2" />
            </div>
          </div>
        )}

        {/* Estado: Gerando */}
        {isGerando && !isNaFila && !isErro && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Gerando conteúdo...</h2>
            <p className="text-sm text-muted-foreground mb-4">
              A IA está criando páginas interativas para este tópico.
            </p>
            <div className="w-full max-w-xs">
              <Progress value={progresso} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{progresso}% concluído</p>
            </div>
          </div>
        )}

        {/* Estado: Erro */}
        {isErro && !isGerando && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Erro na geração</h2>
            <p className="text-muted-foreground mb-4">
              Houve um problema ao gerar o conteúdo.
              <br />
              Tentativas: {topico?.tentativas || 0}/3
            </p>
            <Button
              onClick={() => gerarConteudoMutation.mutate(true)}
              disabled={gerarConteudoMutation.isPending}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Estado: Conteúdo Pronto - Tela de Introdução (novo formato slides_json) */}
        {topico?.status === "concluido" && slidesData && viewMode === 'intro' && (
          <>
            {/* Header para tela de intro */}
            <StandardPageHeader
              title=""
              onBack={handleBack}
            />
            <ConceitosTopicoIntro
              titulo={topico.titulo}
              materiaName={topico.materia?.nome}
              capaUrl={topico.capa_url}
              tempoEstimado={slidesData.tempoEstimado}
              totalSecoes={paginasStats.totalSecoes}
              totalPaginas={paginasStats.totalPaginas}
              objetivos={slidesData.objetivos}
              progressoLeitura={progressoLeitura}
              progressoFlashcards={progressoFlashcards}
              progressoQuestoes={progressoQuestoes}
              hasFlashcards={flashcards.length > 0}
              hasQuestoes={questoes.length > 0}
              onStartPaginas={() => setViewMode('slides')}
              onStartFlashcards={() => navigate(`/conceitos/flashcards/${topico.id}`)}
              onStartQuestoes={() => navigate(`/conceitos/questoes/${topico.id}`)}
            />
          </>
        )}

        {/* Fallback: Conteúdo pronto com formato antigo (conteudo_gerado) mas sem slides */}
        {topico?.status === "concluido" && !slidesData && topico?.conteudo_gerado && (
          <OABTrilhasReader
            key={`reader-${readerKey}`}
            conteudoGerado={topico.conteudo_gerado}
            paginas={conteudoGerado?.paginas}
            titulo={topico.titulo}
            materia={topico.materia?.nome}
            capaUrl={topico.capa_url}
            flashcards={flashcards}
            questoes={questoes}
            topicoId={topico.id}
            correspondencias={correspondencias}
            fontSize={fontSize}
            onFontSizeChange={handleFontSizeChange}
          />
        )}

        {/* Estado: Sem conteúdo (nem slides_json nem conteudo_gerado) e não está gerando */}
        {!slidesData && !topico?.conteudo_gerado && !isGerando && !isNaFila && !isErro && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="mb-4">Conteúdo não disponível</p>
              <Button onClick={() => gerarConteudoMutation.mutate(false)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Conteúdo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConceitosTopicoEstudo;
