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
import { useEffect } from "react";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

type ViewMode = 'intro' | 'slides';

const CategoriasTopicoEstudo = () => {
  const { id: topicoId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  
  const [viewMode, setViewMode] = useState<ViewMode>('intro');
  const [isGeracaoTravada, setIsGeracaoTravada] = useState(false);

  // Removed admin-only restriction - all users can access topic study

  const { data: topico, isLoading, refetch } = useQuery({
    queryKey: ["categorias-topico-estudo", topicoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_topicos")
        .select(`*, materia:categorias_materias(*)`)
        .eq("id", parseInt(topicoId!))
        .single();
      if (error) throw error;
      if (data?.status === "gerando" && data?.updated_at) {
        const diffMinutes = (Date.now() - new Date(data.updated_at).getTime()) / (1000 * 60);
        setIsGeracaoTravada(diffMinutes > 5);
      } else {
        setIsGeracaoTravada(false);
      }
      return data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "gerando" || data?.status === "na_fila") return 3000;
      return false;
    },
  });

  const { data: progresso } = useQuery({
    queryKey: ["categorias-progresso", topicoId, user?.id],
    queryFn: async () => {
      if (!user?.id || !topicoId) return null;
      const { data } = await supabase
        .from("categorias_progresso")
        .select("*")
        .eq("user_id", user.id)
        .eq("topico_id", parseInt(topicoId))
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !!topicoId,
  });

  // Buscar livro_id da BIBLIOTECA-ESTUDOS para navegação de volta
  const { data: livroId } = useQuery({
    queryKey: ["categorias-livro-id", topico?.materia?.categoria, topico?.materia?.nome],
    queryFn: async () => {
      const { data } = await supabase
        .from("BIBLIOTECA-ESTUDOS")
        .select("id")
        .eq("Área", topico!.materia!.categoria)
        .eq("Tema", topico!.materia!.nome)
        .maybeSingle();
      return data?.id || null;
    },
    enabled: !!topico?.materia?.categoria && !!topico?.materia?.nome,
    staleTime: Infinity,
  });

  const gerarConteudoMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("gerar-conteudo-categorias", {
        body: { topico_id: parseInt(topicoId!) },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { refetch(); toast.success("Geração iniciada!"); },
    onError: () => { refetch(); toast.error("Erro ao gerar conteúdo."); },
  });

  // Auto-trigger generation for pending or error topics
  useEffect(() => {
    if ((topico?.status === "pendente" || topico?.status === "erro") && !gerarConteudoMutation.isPending) {
      gerarConteudoMutation.mutate();
    }
  }, [topico?.status]);

  const conteudoGerado = useMemo(() => {
    if (!topico?.conteudo_gerado) return null;
    return typeof topico.conteudo_gerado === 'string' ? JSON.parse(topico.conteudo_gerado) : topico.conteudo_gerado;
  }, [topico?.conteudo_gerado]);

  const slidesData: ConceitoSecao[] = useMemo(() => {
    if (!conteudoGerado?.secoes) return [];
    return conteudoGerado.secoes.map((secao: any) => ({
      id: secao.id,
      titulo: secao.titulo,
      slides: (secao.slides || []).map((slide: any): ConceitoSlide => ({
        tipo: slide.tipo || 'texto',
        titulo: slide.titulo,
        conteudo: slide.conteudo || '',
        termos: slide.termos,
        etapas: slide.etapas,
        tabela: slide.tabela,
        pergunta: slide.pergunta,
        opcoes: slide.opcoes,
        resposta: slide.resposta,
        feedback: slide.feedback,
        pontos: slide.pontos,
      }))
    }));
  }, [conteudoGerado]);

  const flashcards = (topico?.flashcards as any[]) || [];
  const questoes = (topico?.questoes as any[]) || [];
  const totalPaginas = slidesData.reduce((acc, s) => acc + (s.slides?.length || 0), 0);
  const objetivos = conteudoGerado?.objetivos || [];

  const handleBack = () => {
    if (topico?.materia && livroId) {
      const areaNome = topico.materia.categoria || '';
      navigate(`/aulas/area/${encodeURIComponent(areaNome)}/materia/${livroId}`);
    } else if (topico?.materia) {
      const areaNome = topico.materia.categoria || '';
      navigate(`/aulas/area/${encodeURIComponent(areaNome)}`);
    } else {
      navigate('/?tab=jornada');
    }
  };

  const handleSlidesComplete = async () => {
    if (user?.id && topicoId) {
      await supabase.from("categorias_progresso").upsert({
        user_id: user.id,
        topico_id: parseInt(topicoId),
        leitura_concluida: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,topico_id' });
      queryClient.invalidateQueries({ queryKey: ["categorias-progresso"] });
    }
    toast.success("Leitura concluída!");
    setViewMode('intro');
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;
  }

  if (topico?.status === "gerando" || gerarConteudoMutation.isPending) {
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <div className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-400 uppercase tracking-widest truncate">{topico?.materia?.categoria}</p>
              <h1 className="text-sm font-semibold text-white truncate">{topico?.titulo}</h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <Loader2 className="w-12 h-12 animate-spin text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Gerando conteúdo...</h2>
          <p className="text-sm text-gray-400">A IA está criando o material de estudo.</p>
          {topico?.progresso && topico.progresso > 0 && (
            <div className="w-full max-w-xs mt-4">
              <Progress value={topico.progresso} className="h-2" />
              <p className="text-xs text-neutral-500 mt-1">{topico.progresso}%</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === 'slides' && slidesData.length > 0) {
    return (
      <ConceitosSlidesViewer
        secoes={slidesData}
        titulo={topico?.titulo || ""}
        materiaName={topico?.materia?.nome}
        onClose={() => setViewMode('intro')}
        onComplete={handleSlidesComplete}
        onProgressChange={() => {}}
        initialProgress={0}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      <div className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 text-white hover:bg-white/10"><ArrowLeft className="w-4 h-4" /></Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-red-400 uppercase tracking-widest truncate">{topico?.materia?.categoria}</p>
          </div>
        </div>
      </div>
      <OABTrilhasTopicoIntro
        titulo={topico?.titulo || ""}
        materiaName={topico?.materia?.nome}
        capaUrl={topico?.capa_url}
        tempoEstimado={`${Math.ceil(totalPaginas * 2)} min`}
        totalPaginas={totalPaginas}
        objetivos={objetivos}
        progressoLeitura={progresso?.leitura_concluida ? 100 : 0}
        progressoFlashcards={progresso?.flashcards_concluidos ? 100 : 0}
        progressoQuestoes={progresso?.questoes_concluidas ? 100 : 0}
        hasFlashcards={flashcards.length > 0}
        hasQuestoes={questoes.length > 0}
        onStartPaginas={() => setViewMode('slides')}
        onStartFlashcards={() => navigate(`/categorias/topico/${topicoId}/flashcards`)}
        onStartQuestoes={() => navigate(`/categorias/topico/${topicoId}/questoes`)}
        onBack={handleBack}
        subtituloMateria={topico?.materia?.categoria || ""}
        textoMotivacional="Prepare-se para dominar este tema!"
        textoFooter="As páginas são interativas e ideais para memorização"
      />
    </div>
  );
};

export default CategoriasTopicoEstudo;
