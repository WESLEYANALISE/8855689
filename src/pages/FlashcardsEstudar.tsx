import { useNavigate, useSearchParams } from "react-router-dom";
import { Scale, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FlashcardViewer, FlashcardSettings } from "@/components/FlashcardViewer";
import { FlashcardSettingsModal } from "@/components/FlashcardSettingsModal";
import { Progress } from "@/components/ui/progress";
import { useHierarchicalNavigation } from "@/hooks/useHierarchicalNavigation";

interface FlashcardGerado {
  id: number;
  pergunta: string;
  resposta: string;
  exemplo: string | null;
  base_legal: string | null;
  url_imagem_exemplo: string | null;
  url_audio_exemplo?: string | null;
  subtema: string;
  url_audio_pergunta?: string | null;
  url_audio_resposta?: string | null;
}

interface GeracaoStatus {
  total_subtemas: number;
  subtemas_processados: number;
  subtemas_faltantes: number;
  geracao_completa: boolean;
}

const FRASES_GERACAO = [
  "Analisando o conteúdo jurídico...",
  "Criando flashcards de memorização...",
  "Elaborando perguntas e respostas...",
  "Preparando exemplos práticos...",
  "Refinando os flashcards...",
  "Organizando por subtemas...",
  "A IA está trabalhando...",
  "Quase pronto...",
];

const FlashcardsEstudar = () => {
  const navigate = useNavigate();
  const { goBack } = useHierarchicalNavigation();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const tema = searchParams.get("tema") || "";
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState<FlashcardGerado[]>([]);
  const [geracaoStatus, setGeracaoStatus] = useState<GeracaoStatus | null>(null);
  const [fraseIndex, setFraseIndex] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false); // Não mostra mais o modal
  const [settings, setSettings] = useState<FlashcardSettings>({ autoNarration: false, showExamples: true, studyMode: 'leitura' }); // Direto em modo leitura
  const fraseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [flashcardsCount, setFlashcardsCount] = useState<number | null>(null);

  // Buscar contagem de flashcards rapidamente (para exibir no modal)
  useEffect(() => {
    const fetchCount = async () => {
      if (!area || !tema) return;
      
      const { count } = await supabase
        .from("FLASHCARDS_GERADOS")
        .select("*", { count: 'exact', head: true })
        .eq("area", area)
        .eq("tema", tema);
      
      setFlashcardsCount(count || 0);
    };
    
    fetchCount();
  }, [area, tema]);

  // Rotacionar frases durante a geração
  useEffect(() => {
    if (isGenerating) {
      fraseIntervalRef.current = setInterval(() => {
        setFraseIndex(prev => (prev + 1) % FRASES_GERACAO.length);
      }, 3000);
    } else {
      if (fraseIntervalRef.current) {
        clearInterval(fraseIntervalRef.current);
        fraseIntervalRef.current = null;
      }
      setFraseIndex(0);
    }
    
    return () => {
      if (fraseIntervalRef.current) {
        clearInterval(fraseIntervalRef.current);
      }
    };
  }, [isGenerating]);

  const { data: flashcardsCache } = useQuery({
    queryKey: ["flashcards-estudar-progressivo", area, tema],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("FLASHCARDS_GERADOS")
        .select("*")
        .eq("area", area)
        .eq("tema", tema);

      if (error) throw error;
      return data as FlashcardGerado[];
    },
    enabled: !!area && !!tema && settings !== null // Só busca quando configurações foram escolhidas
  });

  // Atualizar flashcards quando cache carregar
  useEffect(() => {
    if (flashcardsCache && flashcardsCache.length > 0) {
      setFlashcards(flashcardsCache);
      
      // Verificar se precisa gerar mais em background
      checkAndGenerateMore();
    } else if (flashcardsCache && flashcardsCache.length === 0 && settings !== null) {
      // Só gera se não tem flashcards e usuário já escolheu configurações
      generateFlashcards();
    }
  }, [flashcardsCache, settings]);

  const checkAndGenerateMore = async () => {
    if (!area || !tema || isGenerating || !flashcardsCache) return;
    
    // Buscar quantos subtemas existem no RESUMO
    const { data: resumos } = await supabase
      .from("RESUMO")
      .select("subtema")
      .eq("area", area)
      .eq("tema", tema);
    
    if (resumos) {
      const subtemasTotal = new Set(resumos.map(r => r.subtema)).size;
      const subtemasComFlashcards = new Set(flashcardsCache.map(f => f.subtema)).size;
      
      // Se faltam subtemas, continuar gerando em background (silenciosamente)
      if (subtemasComFlashcards < subtemasTotal) {
        console.log(`Faltam ${subtemasTotal - subtemasComFlashcards} subtemas. Gerando em background...`);
        generateFlashcardsBackground();
      }
    }
  };

  const generateFlashcardsBackground = async () => {
    try {
      const { data: resumos } = await supabase
        .from("RESUMO")
        .select("subtema, conteudo")
        .eq("area", area)
        .eq("tema", tema);

      if (!resumos || resumos.length === 0) return;

      // Chama edge function em background sem bloquear UI
      await supabase.functions.invoke("gerar-flashcards-tema", {
        body: { area, tema, resumos }
      });

      // Recarrega flashcards após geração
      const { data: flashcardsFinais } = await supabase
        .from("FLASHCARDS_GERADOS")
        .select("*")
        .eq("area", area)
        .eq("tema", tema);

      if (flashcardsFinais && flashcardsFinais.length > 0) {
        setFlashcards(flashcardsFinais as FlashcardGerado[]);
      }
    } catch (error) {
      console.error("Erro ao gerar flashcards em background:", error);
    }
  };

  const generateFlashcards = async () => {
    setIsGenerating(true);
    
    try {
      // Busca resumos do tema
      const { data: resumos, error: resumosError } = await supabase
        .from("RESUMO")
        .select("subtema, conteudo")
        .eq("area", area)
        .eq("tema", tema);

      if (resumosError) throw resumosError;

      if (!resumos || resumos.length === 0) {
        toast.error("Não há conteúdo disponível para gerar flashcards");
        setIsGenerating(false);
        return;
      }

      // Calcular total de subtemas para mostrar progresso
      const subtemasUnicos = new Set(resumos.map(r => r.subtema));
      const totalSubtemas = subtemasUnicos.size;
      
      // Buscar subtemas já processados
      const { data: flashcardsExistentes } = await supabase
        .from("FLASHCARDS_GERADOS")
        .select("subtema")
        .eq("area", area)
        .eq("tema", tema);
      
      const subtemasJaProcessados = new Set(flashcardsExistentes?.map(f => f.subtema) || []);
      const subtemasProcessadosInicial = subtemasJaProcessados.size;
      
      setGeracaoStatus({
        total_subtemas: totalSubtemas,
        subtemas_processados: subtemasProcessadosInicial,
        subtemas_faltantes: totalSubtemas - subtemasProcessadosInicial,
        geracao_completa: false
      });

      // Iniciar polling para atualizar progresso em tempo real
      let pollInterval: NodeJS.Timeout | null = null;
      
      const pollProgress = async () => {
        const { data: flashcardsAtuais } = await supabase
          .from("FLASHCARDS_GERADOS")
          .select("subtema")
          .eq("area", area)
          .eq("tema", tema);
        
        if (flashcardsAtuais) {
          const subtemasAtuais = new Set(flashcardsAtuais.map(f => f.subtema)).size;
          setGeracaoStatus(prev => ({
            ...prev!,
            subtemas_processados: subtemasAtuais,
            subtemas_faltantes: totalSubtemas - subtemasAtuais,
            geracao_completa: subtemasAtuais >= totalSubtemas
          }));
          
          // Atualiza os flashcards em tempo real
          const { data: todosFlashcards } = await supabase
            .from("FLASHCARDS_GERADOS")
            .select("*")
            .eq("area", area)
            .eq("tema", tema);
          
          if (todosFlashcards && todosFlashcards.length > 0) {
            setFlashcards(todosFlashcards as FlashcardGerado[]);
          }
        }
      };
      
      // Polling a cada 3 segundos
      pollInterval = setInterval(pollProgress, 3000);

      // Chama edge function para gerar flashcards
      const { error } = await supabase.functions.invoke("gerar-flashcards-tema", {
        body: { area, tema, resumos }
      });

      // Para o polling
      if (pollInterval) {
        clearInterval(pollInterval);
      }

      if (error) throw error;

      // Busca final dos flashcards após a geração
      const { data: flashcardsFinais } = await supabase
        .from("FLASHCARDS_GERADOS")
        .select("*")
        .eq("area", area)
        .eq("tema", tema);

      if (flashcardsFinais && flashcardsFinais.length > 0) {
        setFlashcards(flashcardsFinais as FlashcardGerado[]);
        
        const subtemasFinais = new Set(flashcardsFinais.map(f => f.subtema)).size;
        const geracaoCompleta = subtemasFinais >= totalSubtemas;
        
        setGeracaoStatus({
          total_subtemas: totalSubtemas,
          subtemas_processados: subtemasFinais,
          subtemas_faltantes: totalSubtemas - subtemasFinais,
          geracao_completa: geracaoCompleta
        });
        
        if (geracaoCompleta) {
          toast.success(`${flashcardsFinais.length} flashcards disponíveis!`);
        } else {
          toast.success(
            `${flashcardsFinais.length} flashcards gerados! (${subtemasFinais}/${totalSubtemas} subtemas)`,
            {
              description: "O próximo acesso continuará gerando mais flashcards.",
              duration: 5000
            }
          );
        }
      } else {
        toast.error("Não foi possível gerar flashcards");
      }
    } catch (error) {
      console.error("Erro ao gerar flashcards:", error);
      toast.error("Erro ao gerar flashcards. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSettingsConfirm = (newSettings: FlashcardSettings) => {
    setSettings(newSettings);
    setShowSettingsModal(false);
  };

  // Calcular progresso para a barra
  const progressPercent = geracaoStatus 
    ? Math.round((geracaoStatus.subtemas_processados / geracaoStatus.total_subtemas) * 100)
    : 0;

  // Redirecionar se não houver área
  if (!area) {
    navigate("/flashcards");
    return null;
  }

  // Mostrar tela de geração apenas quando está gerando (não para carregamento inicial)
  if (isGenerating) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[hsl(260,40%,15%)] via-[hsl(250,35%,18%)] to-[hsl(240,30%,20%)]">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          
          <div className="text-center w-full max-w-xs">
            <h2 className="text-lg font-semibold mb-1 text-white">
              Gerando flashcards...
            </h2>
            
            {geracaoStatus && (
              <>
                <div className="mt-4 mb-2">
                  <Progress value={progressPercent} className="h-2" />
                </div>
                <p className="text-sm text-white/70">
                  {geracaoStatus.subtemas_processados}/{geracaoStatus.total_subtemas} subtemas
                </p>
                <p className="text-xs text-white/50 mt-1">
                  {flashcards.length > 0 && `${flashcards.length} flashcards gerados`}
                </p>
              </>
            )}
            
            <p className="text-sm text-white/60 max-w-xs mt-2 min-h-[40px] transition-opacity duration-300">
              {FRASES_GERACAO[fraseIndex]}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se não tem flashcards após carregar e configurar, mostrar mensagem
  if (settings && flashcards.length === 0 && !isGenerating) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[hsl(260,40%,15%)] via-[hsl(250,35%,18%)] to-[hsl(240,30%,20%)]">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center">
            <Scale className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-1 text-white">Nenhum flashcard disponível</h2>
            <p className="text-sm text-white/60 max-w-xs mb-4">
              Não foi possível carregar ou gerar flashcards para este tema.
            </p>
            <Button onClick={goBack}>Voltar</Button>
          </div>
        </div>
      </div>
    );
  }

  // Transformar flashcards para o formato do FlashcardViewer
  const flashcardsFormatados = flashcards.map(f => ({
    id: f.id,
    front: f.pergunta,
    back: f.resposta,
    exemplo: f.exemplo || undefined,
    base_legal: f.base_legal || undefined,
    url_imagem_exemplo: f.url_imagem_exemplo || undefined,
    url_audio_exemplo: f.url_audio_exemplo || undefined,
    "audio-pergunta": f.url_audio_pergunta || undefined,
    "audio-resposta": f.url_audio_resposta || undefined
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(260,40%,15%)] via-[hsl(250,35%,18%)] to-[hsl(240,30%,20%)] pb-24">
      {/* Modal de configurações - abre imediatamente */}
      <FlashcardSettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onStart={handleSettingsConfirm}
        totalFlashcards={flashcardsCount ?? flashcards.length}
        tema={tema}
        onBack={goBack}
      />

      <div className="max-w-4xl mx-auto px-3 py-4">
        {flashcards.length > 0 ? (
          <FlashcardViewer flashcards={flashcardsFormatados} settings={settings} area={area} />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-white/60">Carregando flashcards...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsEstudar;