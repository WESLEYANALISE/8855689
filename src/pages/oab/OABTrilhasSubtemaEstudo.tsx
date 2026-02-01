import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Info, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

interface Pagina {
  titulo: string;
  tipo: string;
  markdown: string;
  conteudo?: string;
}

interface SecaoData {
  id: number;
  titulo: string;
  slides: any[];
}

interface ConteudoGerado {
  paginas?: Pagina[];
  secoes?: SecaoData[];  // Novo formato com seções
  objetivos?: string[];
  resumo?: string;
  markdown?: string;
  exemplos?: any;
  termos?: any;
  flashcards?: Flashcard[];
  questoes?: Questao[];
}

type ViewMode = 'intro' | 'slides';

const mapOabPaginaTipoToSlideTipo = (tipo?: string): ConceitoSlide['tipo'] => {
  switch (tipo) {
    case 'introducao':
      return 'introducao';
    case 'quadro_comparativo':
      return 'tabela';
    case 'dicas_provas':
      return 'dica';
    case 'sintese_final':
      return 'resumo';
    // Tipos OAB que viram texto padrão
    case 'conteudo_principal':
    case 'desmembrando':
    case 'entendendo_na_pratica':
    case 'correspondencias':
    default:
      return 'texto';
  }
};

const OABTrilhasSubtemaEstudo = () => {
  const { materiaId, topicoId, resumoId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('intro');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  const parsedResumoId = resumoId ? parseInt(resumoId) : null;
  const parsedMateriaId = materiaId ? parseInt(materiaId) : null;
  const parsedTopicoId = topicoId ? parseInt(topicoId) : null;

  // Buscar dados do RESUMO com polling
  const { data: resumo, isLoading, refetch } = useQuery({
    queryKey: ["oab-resumo-estudo", parsedResumoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("RESUMO")
        .select("*")
        .eq("id", parsedResumoId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!parsedResumoId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && !data.conteudo_gerado) return 3000;
      return false;
    },
  });

  // Buscar progresso do usuário
  const { data: progresso } = useQuery({
    queryKey: ["oab-subtema-progresso", parsedTopicoId, user?.id],
    queryFn: async () => {
      if (!user?.id || !parsedTopicoId) return null;
      
      const { data } = await supabase
        .from("oab_trilhas_estudo_progresso")
        .select("*")
        .eq("user_id", user.id)
        .eq("topico_id", parsedTopicoId)
        .maybeSingle();
      
      return data;
    },
    enabled: !!user?.id && !!parsedTopicoId,
  });

  // Mutation para gerar capa manualmente
  const gerarCapaMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("gerar-capa-subtema-resumo", {
        body: { 
          resumo_id: parsedResumoId,
          titulo: resumo?.subtema,
          area: resumo?.area
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["oab-resumo-estudo", parsedResumoId] });
      toast.success("Capa gerada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao gerar capa. Tente novamente.");
    },
  });

  const gerarConteudoMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingContent(true);
      const { data, error } = await supabase.functions.invoke("gerar-conteudo-resumo-oab", {
        body: { resumo_id: parsedResumoId },
      });
      if (error) throw error;
      
      if (data?.status === "gerando") {
        let tentativas = 0;
        const maxTentativas = 60;
        
        while (tentativas < maxTentativas) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { data: resumoAtualizado } = await supabase
            .from("RESUMO")
            .select("conteudo_gerado")
            .eq("id", parsedResumoId!)
            .single();
          
          if (resumoAtualizado?.conteudo_gerado) {
            return { success: true, completed: true };
          }
          
          tentativas++;
        }
        
        throw new Error("Timeout ao aguardar geração de conteúdo");
      }
      
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["oab-resumo-estudo", parsedResumoId] });
      toast.success("Conteúdo gerado com sucesso!");
      setIsGeneratingContent(false);
    },
    onError: () => {
      toast.error("Erro ao gerar conteúdo");
      setIsGeneratingContent(false);
    },
  });

  // Gerar conteúdo automaticamente se não existir
  useEffect(() => {
    if (resumo && !resumo.conteudo_gerado && !gerarConteudoMutation.isPending && !isGeneratingContent) {
      gerarConteudoMutation.mutate();
    }
  }, [resumo?.id, resumo?.conteudo_gerado, isGeneratingContent]);

  // Parse conteudo_gerado (memoizado para estabilidade entre renders)
  const conteudoGerado = useMemo(
    (): (ConteudoGerado & { erro?: boolean; mensagem?: string; detalhe?: string; acao?: string }) => {
      if (!resumo?.conteudo_gerado) return {};
      if (typeof resumo.conteudo_gerado === 'string') {
        try {
          return JSON.parse(resumo.conteudo_gerado);
        } catch {
          return {};
        }
      }
      return resumo.conteudo_gerado as ConteudoGerado;
    },
    [resumo?.conteudo_gerado]
  );
  
  // Detectar se houve erro na geração (conteúdo fonte vazio)
  const isErroFonte = conteudoGerado.erro === true;

  // Converter para formato ConceitoSecao[] - suporta 3 formatos com prioridade
  const slidesData: ConceitoSecao[] = useMemo(() => {
    // 1. PRIORIDADE: slides_json na raiz do resumo (novo formato V2 - igual Conceitos)
    if (resumo?.slides_json) {
      const data = resumo.slides_json as any;
      if (data?.secoes && Array.isArray(data.secoes) && data.secoes.length > 0) {
        return data.secoes.map((secao: any) => ({
          id: secao.id,
          titulo: secao.titulo,
          slides: (secao.slides || []).map((slide: any): ConceitoSlide => ({
            tipo: slide.tipo || 'texto',
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
    }
    
    // 2. Fallback: conteudo_gerado.secoes (formato intermediário)
    if (conteudoGerado.secoes && Array.isArray(conteudoGerado.secoes) && conteudoGerado.secoes.length > 0) {
      return conteudoGerado.secoes.map((secao) => ({
        id: secao.id,
        titulo: secao.titulo,
        slides: (secao.slides || []).map((slide: any): ConceitoSlide => ({
          tipo: mapOabPaginaTipoToSlideTipo(slide.tipo),
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
    
    // 3. Fallback antigo: conteudo_gerado.paginas (formato flat - compatibilidade)
    if (!conteudoGerado.paginas || conteudoGerado.paginas.length === 0) return [];
    
    return [{
      id: 1,
      titulo: resumo?.subtema || "Conteúdo",
      slides: conteudoGerado.paginas.map((p): ConceitoSlide => ({
        tipo: mapOabPaginaTipoToSlideTipo(p.tipo),
        titulo: p.titulo,
        conteudo: p.markdown || p.conteudo || ''
      }))
    }];
  }, [resumo?.slides_json, conteudoGerado, resumo?.subtema]);

  // Debug: garantir que nenhuma página está sendo descartada
  useEffect(() => {
    const paginasCount = Array.isArray(conteudoGerado.paginas) ? conteudoGerado.paginas.length : 0;
    const slidesCount = slidesData.reduce((acc, s) => acc + (s.slides?.length || 0), 0);
    if (paginasCount || slidesCount) {
      console.log('[OABTrilhasSubtemaEstudo] paginas:', paginasCount, 'slides:', slidesCount);
    }
  }, [conteudoGerado.paginas, slidesData]);

  // Flashcards e questões
  const flashcards: Flashcard[] = Array.isArray(conteudoGerado.flashcards) ? conteudoGerado.flashcards : [];
  const questoes: Questao[] = Array.isArray(conteudoGerado.questoes) ? conteudoGerado.questoes : [];

  // Extrair objetivos do conteúdo (mover antes dos returns condicionais para evitar erro de hooks)
  const objetivos = useMemo(() => {
    // 1. PRIORIDADE: slides_json.objetivos (novo formato V2)
    if (resumo?.slides_json) {
      const data = resumo.slides_json as any;
      if (data?.objetivos && Array.isArray(data.objetivos)) {
        return data.objetivos;
      }
    }
    // 2. conteudo_gerado.objetivos
    if (conteudoGerado.objetivos && Array.isArray(conteudoGerado.objetivos)) {
      return conteudoGerado.objetivos;
    }
    // 3. Extrair das seções
    if (conteudoGerado.secoes && conteudoGerado.secoes.length > 0) {
      return conteudoGerado.secoes.slice(0, 4).map(s => s.titulo);
    }
    // 4. Fallback: extrair das páginas
    return conteudoGerado.paginas?.slice(0, 3).map(p => p.titulo) || [];
  }, [resumo?.slides_json, conteudoGerado]);
  
  const totalPaginas = slidesData.reduce((acc, s) => acc + (s.slides?.length || 0), 0);
  const tempoEstimado = `${Math.ceil(totalPaginas * 2)} min`;

  // Callbacks de navegação
  const handleBack = () => {
    navigate(`/oab/trilhas-aprovacao/materia/${parsedMateriaId}/topicos/${parsedTopicoId}`);
  };

  const handleStartSlides = () => {
    setViewMode('slides');
  };

  const handleCloseSlides = () => {
    setViewMode('intro');
  };

  const handleStartFlashcards = () => {
    navigate(`/oab/trilhas-aprovacao/materia/${materiaId}/topicos/${topicoId}/estudo/${resumoId}/flashcards`);
  };

  const handleStartQuestoes = () => {
    navigate(`/oab/trilhas-aprovacao/materia/${materiaId}/topicos/${topicoId}/estudo/${resumoId}/questoes`);
  };

  const handleSlidesComplete = async () => {
    // Marcar leitura como completa
    if (user?.id && parsedTopicoId) {
      await supabase
        .from("oab_trilhas_estudo_progresso")
        .upsert({
          user_id: user.id,
          topico_id: parsedTopicoId,
          leitura_completa: true,
          progresso_leitura: 100,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,topico_id' });
      
      queryClient.invalidateQueries({ queryKey: ["oab-subtema-progresso"] });
    }
    
    toast.success("Leitura concluída!");
    setViewMode('intro');
  };

  const handleProgressChange = async (progress: number) => {
    if (user?.id && parsedTopicoId) {
      await supabase
        .from("oab_trilhas_estudo_progresso")
        .upsert({
          user_id: user.id,
          topico_id: parsedTopicoId,
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

  // Estado de erro de fonte - conteúdo do PDF não disponível
  if (isErroFonte) {
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <div className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-400 uppercase tracking-widest truncate">{resumo?.area}</p>
              <h1 className="text-sm font-semibold text-white truncate">{resumo?.subtema || "Erro"}</h1>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 text-center px-4 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Info className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Conteúdo Fonte Indisponível</h2>
          <p className="text-neutral-400 mb-2">
            {conteudoGerado.mensagem || "O texto extraído do PDF para este subtema não está disponível."}
          </p>
          {conteudoGerado.detalhe && (
            <p className="text-sm text-neutral-500 mb-4">
              {conteudoGerado.detalhe}
            </p>
          )}
          <p className="text-sm text-neutral-400 mb-6">
            {conteudoGerado.acao || "Volte ao tópico e reprocesse o PDF para corrigir."}
          </p>
          <Button
            onClick={handleBack}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Voltar ao Tópico
          </Button>
        </div>
      </div>
    );
  }

  const isGerando = !resumo?.conteudo_gerado || gerarConteudoMutation.isPending || isGeneratingContent;

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
              <p className="text-xs text-red-400 uppercase tracking-widest truncate">{resumo?.area}</p>
              <h1 className="text-sm font-semibold text-white truncate">{resumo?.subtema || "Carregando..."}</h1>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <Loader2 className="w-12 h-12 animate-spin text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Gerando conteúdo...</h2>
          <p className="text-sm text-gray-400">
            A IA está criando o material de estudo para este subtema.
            <br />
            Isso pode levar alguns segundos.
          </p>
        </div>
      </div>
    );
  }


  // Renderizar Slides Viewer (igual ao Conceitos)
  if (viewMode === 'slides' && slidesData.length > 0) {
    return (
      <ConceitosSlidesViewer
        secoes={slidesData}
        titulo={resumo?.subtema || ""}
        materiaName={resumo?.area}
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
            <p className="text-xs text-red-400 uppercase tracking-widest truncate">{resumo?.area} • OAB</p>
          </div>
        </div>
      </div>

      <OABTrilhasTopicoIntro
        titulo={resumo?.subtema || ""}
        materiaName={resumo?.area}
        capaUrl={resumo?.url_imagem_resumo}
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

export default OABTrilhasSubtemaEstudo;
