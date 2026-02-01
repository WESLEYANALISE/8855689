import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Info, Clock, ListOrdered, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import OABTrilhasTopicoIntro from "@/components/oab/OABTrilhasTopicoIntro";
import { ConceitosSlidesViewer } from "@/components/conceitos/slides";
import type { ConceitoSecao, ConceitoSlide } from "@/components/conceitos/slides/types";

interface Flashcard {
  frente: string;
  verso: string;
  exemplo?: string;
}

interface Questao {
  pergunta: string;
  alternativas: string[];
  correta: number;
  explicacao: string;
}

interface QueueInfo {
  totalNaFila: number;
  posicaoAtual: number | null;
}

interface Pagina {
  titulo: string;
  tipo: string;
  markdown: string;
}

type ViewMode = 'intro' | 'slides';

const OABTrilhasTopicoEstudo = () => {
  const { id, materiaId, topicoId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const targetId = id || topicoId;
  
  const [viewMode, setViewMode] = useState<ViewMode>('intro');
  const [isGeracaoTravada, setIsGeracaoTravada] = useState(false);

  // Buscar informações da fila
  const { data: queueInfo } = useQuery<QueueInfo>({
    queryKey: ["oab-trilha-queue-info", targetId],
    queryFn: async () => {
      const { count: totalNaFila } = await supabase
        .from("oab_trilhas_topicos")
        .select("id", { count: "exact", head: true })
        .eq("status", "na_fila");

      const { data: topico } = await supabase
        .from("oab_trilhas_topicos")
        .select("posicao_fila, status")
        .eq("id", parseInt(targetId!))
        .single();

      return {
        totalNaFila: totalNaFila || 0,
        posicaoAtual: topico?.status === "na_fila" ? topico.posicao_fila : null,
      };
    },
    refetchInterval: 3000,
  });

  // Buscar dados do tópico
  const { data: topico, isLoading, refetch } = useQuery({
    queryKey: ["oab-trilha-topico-estudo", targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oab_trilhas_topicos")
        .select(`
          *,
          materia:oab_trilhas_materias(*)
        `)
        .eq("id", parseInt(targetId!))
        .single();

      if (error) throw error;
      
      if (data?.status === "gerando" && data?.updated_at) {
        const updatedAt = new Date(data.updated_at).getTime();
        const now = Date.now();
        const diffMinutes = (now - updatedAt) / (1000 * 60);
        setIsGeracaoTravada(diffMinutes > 5);
      } else {
        setIsGeracaoTravada(false);
      }
      
      return data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "gerando" || data?.status === "na_fila") return 3000;
      if (data?.status === "concluido" && !data?.capa_url) return 5000;
      return false;
    },
  });

  // Buscar progresso do usuário
  const { data: progresso } = useQuery({
    queryKey: ["oab-topico-progresso", targetId, user?.id],
    queryFn: async () => {
      if (!user?.id || !targetId) return null;
      
      const { data } = await supabase
        .from("oab_trilhas_estudo_progresso")
        .select("*")
        .eq("user_id", user.id)
        .eq("topico_id", parseInt(targetId))
        .maybeSingle();
      
      return data;
    },
    enabled: !!user?.id && !!targetId,
  });

  // Mutation para gerar conteúdo
  const gerarConteudoMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("gerar-conteudo-oab-trilhas", {
        body: { topico_id: parseInt(targetId!) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setIsGeracaoTravada(false);
      refetch();
      
      if (data?.queued) {
        toast.info(`Adicionado à fila - Posição ${data.position}`);
      } else if (data?.requeued) {
        toast.warning(`Conteúdo incompleto, reprocessando...`);
      } else {
        toast.success(data?.message || "Conteúdo gerado com sucesso!");
      }
    },
    onError: () => {
      setIsGeracaoTravada(false);
      refetch();
      toast.error("Erro ao gerar conteúdo. Tente novamente.");
    },
  });

  // Gerar conteúdo automaticamente se não existir
  if (topico?.status === "pendente" && !gerarConteudoMutation.isPending) {
    gerarConteudoMutation.mutate();
  }

  // Parse conteúdo gerado (suporta novo formato com seções ou formato antigo com páginas)
  const parseConteudoGerado = () => {
    if (!topico?.conteudo_gerado) return null;
    if (typeof topico.conteudo_gerado === 'string') {
      try {
        return JSON.parse(topico.conteudo_gerado);
      } catch {
        return null;
      }
    }
    return topico.conteudo_gerado;
  };

  const conteudoGerado = parseConteudoGerado();

  // Converter para formato ConceitoSecao[] - suporta ambos formatos
  const slidesData: ConceitoSecao[] = useMemo(() => {
    if (!conteudoGerado) return [];
    
    // Novo formato: já tem seções estruturadas (igual Conceitos)
    if (conteudoGerado.secoes && Array.isArray(conteudoGerado.secoes)) {
      return conteudoGerado.secoes.map((secao: any) => ({
        id: secao.id,
        titulo: secao.titulo,
        slides: (secao.slides || []).map((slide: any): ConceitoSlide => ({
          tipo: (slide.tipo as ConceitoSlide['tipo']) || 'texto',
          titulo: slide.titulo,
          conteudo: slide.conteudo || slide.markdown || '',
          termos: slide.termos,
          etapas: slide.etapas,
          tabela: slide.tabela,
          pergunta: slide.pergunta,
          opcoes: slide.opcoes,
          resposta: slide.resposta,
          feedback: slide.feedback,
          pontos: slide.pontos
        }))
      }));
    }
    
    // Formato antigo: páginas flat (compatibilidade)
    const paginas = conteudoGerado.paginas as Pagina[] | undefined;
    if (!paginas || paginas.length === 0) return [];
    
    return [{
      id: 1,
      titulo: topico?.titulo || "Conteúdo",
      slides: paginas.map((p): ConceitoSlide => ({
        tipo: (p.tipo as ConceitoSlide['tipo']) || 'texto',
        titulo: p.titulo,
        conteudo: p.markdown
      }))
    }];
  }, [conteudoGerado, topico?.titulo]);

  const flashcards: Flashcard[] = (topico?.flashcards as unknown as Flashcard[]) || [];
  const questoes: Questao[] = (topico?.questoes as unknown as Questao[]) || [];

  // Callbacks
  const handleBack = () => {
    if (materiaId && topicoId) {
      navigate(`/oab/trilhas-aprovacao/materia/${materiaId}/topicos/${topicoId}`);
    } else if (topico?.materia?.id) {
      navigate(`/oab/trilhas-aprovacao/materia/${topico.materia.id}`);
    } else {
      navigate(-1);
    }
  };

  const handleStartSlides = () => {
    setViewMode('slides');
  };

  const handleCloseSlides = () => {
    setViewMode('intro');
  };

  const handleStartFlashcards = () => {
    // Navigate to flashcards page
    toast.info("Navegando para flashcards...");
  };

  const handleStartQuestoes = () => {
    // Navigate to questoes page
    toast.info("Navegando para questões...");
  };

  const handleSlidesComplete = async () => {
    if (user?.id && targetId) {
      await supabase
        .from("oab_trilhas_estudo_progresso")
        .upsert({
          user_id: user.id,
          topico_id: parseInt(targetId),
          leitura_completa: true,
          progresso_leitura: 100,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,topico_id' });
      
      queryClient.invalidateQueries({ queryKey: ["oab-topico-progresso"] });
    }
    
    toast.success("Leitura concluída!");
    setViewMode('intro');
  };

  const handleProgressChange = async (progress: number) => {
    if (user?.id && targetId) {
      await supabase
        .from("oab_trilhas_estudo_progresso")
        .upsert({
          user_id: user.id,
          topico_id: parseInt(targetId),
          progresso_leitura: progress,
          leitura_completa: progress >= 100,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,topico_id' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const isNaFila = topico?.status === "na_fila";
  const isGerando = topico?.status === "gerando" || gerarConteudoMutation.isPending;
  const isEtica = topico?.materia?.nome?.toLowerCase().includes("ética");
  const accentColor = isEtica ? "amber" : "red";

  // Estado de fila
  if (isNaFila) {
    const posicao = queueInfo?.posicaoAtual || topico?.posicao_fila || 1;
    const total = queueInfo?.totalNaFila || 1;
    const progressPercent = total > 1 ? ((total - posicao + 1) / total) * 100 : 0;

    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <div className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-400 uppercase tracking-widest truncate">{topico?.materia?.nome}</p>
              <h1 className="text-sm font-semibold text-white truncate">{topico?.titulo || "Carregando..."}</h1>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${accentColor}-500/20 flex items-center justify-center`}>
            <Clock className={`w-8 h-8 text-${accentColor}-400 animate-pulse`} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Aguardando na fila...</h2>
          <p className="text-neutral-400 mb-4">
            Outro conteúdo está sendo gerado no momento.
          </p>
          
          <div className="w-full max-w-xs mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ListOrdered className="w-4 h-4 text-neutral-500" />
              <span className={`text-lg font-bold text-${accentColor}-400`}>
                Posição: {posicao} de {total}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          
          <p className="text-xs text-neutral-500">
            {topico?.tentativas && topico.tentativas > 0 
              ? `Tentativa ${topico.tentativas + 1} de 3`
              : "A geração iniciará automaticamente"}
          </p>
        </div>
      </div>
    );
  }

  // Estado de geração
  if (isGerando) {
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <div className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-400 uppercase tracking-widest truncate">{topico?.materia?.nome}</p>
              <h1 className="text-sm font-semibold text-white truncate">{topico?.titulo || "Carregando..."}</h1>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          {!isGeracaoTravada ? (
            <>
              <Loader2 className={`w-12 h-12 animate-spin text-${accentColor}-500 mb-4`} />
              <h2 className="text-lg font-semibold text-white mb-2">Gerando conteúdo...</h2>
              <p className="text-sm text-gray-400">
                A IA está criando o material de estudo para este tópico.
                <br />
                Isso pode levar alguns segundos.
              </p>
              
              {topico?.progresso && topico.progresso > 0 && (
                <div className="w-full max-w-xs mt-4">
                  <Progress value={topico.progresso} className="h-2" />
                  <p className="text-xs text-neutral-500 mt-1">{topico.progresso}%</p>
                </div>
              )}
              
              {queueInfo && queueInfo.totalNaFila > 0 && (
                <p className="text-xs text-neutral-500 mt-4">
                  {queueInfo.totalNaFila} item(ns) aguardando na fila
                </p>
              )}
            </>
          ) : (
            <>
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${accentColor}-500/20 flex items-center justify-center`}>
                <Info className={`w-8 h-8 text-${accentColor}-400`} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Geração demorando mais que o esperado</h2>
              <p className="text-neutral-400 mb-4">
                A geração está demorando mais de 5 minutos.
                <br />
                Você pode tentar novamente.
              </p>
              <Button
                onClick={() => {
                  setIsGeracaoTravada(false);
                  gerarConteudoMutation.mutate();
                }}
                className={`bg-${accentColor}-500 hover:bg-${accentColor}-600 text-white`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Extrair objetivos do conteúdo (suporta novo e antigo formato)
  const objetivos = useMemo(() => {
    // Novo formato com objetivos explícitos
    if (conteudoGerado?.objetivos && Array.isArray(conteudoGerado.objetivos)) {
      return conteudoGerado.objetivos;
    }
    // Extrair das seções (novo formato)
    if (conteudoGerado?.secoes && Array.isArray(conteudoGerado.secoes) && conteudoGerado.secoes.length > 0) {
      return conteudoGerado.secoes.slice(0, 4).map((s: any) => s.titulo);
    }
    // Fallback: extrair das páginas
    return (conteudoGerado?.paginas as Pagina[] | undefined)?.slice(0, 3).map(p => p.titulo) || [];
  }, [conteudoGerado]);
  
  const totalPaginas = slidesData.reduce((acc, s) => acc + (s.slides?.length || 0), 0);
  const tempoEstimado = `${Math.ceil(totalPaginas * 2)} min`;

  // Renderizar Slides Viewer (igual ao Conceitos)
  if (viewMode === 'slides' && slidesData.length > 0) {
    return (
      <ConceitosSlidesViewer
        secoes={slidesData}
        titulo={topico?.titulo || ""}
        materiaName={topico?.materia?.nome}
        onClose={handleCloseSlides}
        onComplete={handleSlidesComplete}
        onProgressChange={handleProgressChange}
        initialProgress={progresso?.progresso_leitura || 0}
      />
    );
  }

  // Renderizar Tela de Introdução (igual ao Conceitos, com boas-vindas OAB)
  return (
    <div className="min-h-screen bg-[#0d0d14]">
      {/* Header minimalista */}
      <div className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-red-400 uppercase tracking-widest truncate">{topico?.materia?.nome} • OAB</p>
          </div>
        </div>
      </div>

      <OABTrilhasTopicoIntro
        titulo={topico?.titulo || ""}
        materiaName={topico?.materia?.nome}
        capaUrl={topico?.materia?.capa_url || topico?.capa_url}
        tempoEstimado={tempoEstimado}
        totalPaginas={totalPaginas}
        objetivos={objetivos}
        progressoLeitura={progresso?.progresso_leitura || 0}
        progressoFlashcards={progresso?.progresso_flashcards || 0}
        progressoQuestoes={progresso?.progresso_questoes || 0}
        hasFlashcards={flashcards.length > 0}
        hasQuestoes={questoes.length > 0}
        onStartPaginas={handleStartSlides}
        onStartFlashcards={handleStartFlashcards}
        onStartQuestoes={handleStartQuestoes}
        onBack={handleBack}
      />
    </div>
  );
};

export default OABTrilhasTopicoEstudo;
