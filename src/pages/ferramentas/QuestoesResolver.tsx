import { useNavigate, useSearchParams } from "react-router-dom";
import { Scale, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QuestoesConcurso from "@/components/QuestoesConcurso";
import { Progress } from "@/components/ui/progress";

export interface Questao {
  id: number;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  resposta_correta: string;
  comentario: string;
  subtema: string;
}

interface GeracaoStatus {
  total_subtemas: number;
  subtemas_processados: number;
  subtemas_faltantes: number;
  geracao_completa: boolean;
}

const FRASES_GERACAO = [
  "Analisando o conteúdo jurídico...",
  "Criando questões desafiadoras...",
  "Elaborando alternativas...",
  "Preparando comentários explicativos...",
  "Refinando as questões...",
  "Verificando gabaritos...",
  "Organizando por subtemas...",
  "Finalizando questões...",
  "A IA está trabalhando...",
  "Quase pronto...",
];

const QuestoesResolver = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const tema = searchParams.get("tema") || "";
  const autoplayParam = searchParams.get("autoplay");
  const autoplayAudio = autoplayParam !== null ? autoplayParam === "true" : true;
  const [isGenerating, setIsGenerating] = useState(false);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [geracaoStatus, setGeracaoStatus] = useState<GeracaoStatus | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [fraseIndex, setFraseIndex] = useState(0);
  const fraseIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const { data: questoesCache, isLoading, refetch } = useQuery({
    queryKey: ["questoes-resolver", area, tema],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("QUESTOES_GERADAS")
        .select("*")
        .eq("area", area)
        .eq("tema", tema);

      if (error) throw error;
      return data as Questao[];
    },
    enabled: !!area && !!tema
  });

  // Verificar se precisa gerar mais questões (se não completou todos os subtemas)
  useEffect(() => {
    const checkAndGenerate = async () => {
      if (!area || !tema || isGenerating) return;
      
      if (questoesCache && questoesCache.length > 0) {
        setQuestoes(questoesCache);
        
        // Buscar quantos subtemas existem no RESUMO
        const { data: resumos } = await supabase
          .from("RESUMO")
          .select("subtema")
          .eq("area", area)
          .eq("tema", tema);
        
        if (resumos) {
          const subtemasTotal = new Set(resumos.map(r => r.subtema)).size;
          const subtemasComQuestoes = new Set(questoesCache.map(q => q.subtema)).size;
          
          // Se faltam subtemas, continuar gerando em background
          if (subtemasComQuestoes < subtemasTotal) {
            console.log(`Faltam ${subtemasTotal - subtemasComQuestoes} subtemas. Gerando...`);
            generateQuestoes();
          }
        }
      } else if (questoesCache && questoesCache.length === 0) {
        generateQuestoes();
      }
    };
    
    checkAndGenerate();
  }, [questoesCache, area, tema]);

  const generateQuestoes = async () => {
    setIsGenerating(true);
    setProgressMessage("Buscando resumos do tema...");
    
    try {
      // Busca resumos do tema
      const { data: resumos, error: resumosError } = await supabase
        .from("RESUMO")
        .select("subtema, conteudo")
        .eq("area", area)
        .eq("tema", tema);

      if (resumosError) throw resumosError;

      if (!resumos || resumos.length === 0) {
        toast.error("Não há conteúdo disponível para gerar questões");
        setIsGenerating(false);
        return;
      }

      // Calcular total de subtemas para mostrar progresso
      const subtemasUnicos = new Set(resumos.map(r => r.subtema));
      const totalSubtemas = subtemasUnicos.size;
      
      // Buscar subtemas já processados
      const { data: questoesExistentes } = await supabase
        .from("QUESTOES_GERADAS")
        .select("subtema")
        .eq("area", area)
        .eq("tema", tema);
      
      const subtemasJaProcessados = new Set(questoesExistentes?.map(q => q.subtema) || []);
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
        const { data: questoesAtuais } = await supabase
          .from("QUESTOES_GERADAS")
          .select("subtema")
          .eq("area", area)
          .eq("tema", tema);
        
        if (questoesAtuais) {
          const subtemasAtuais = new Set(questoesAtuais.map(q => q.subtema)).size;
          setGeracaoStatus(prev => ({
            ...prev!,
            subtemas_processados: subtemasAtuais,
            subtemas_faltantes: totalSubtemas - subtemasAtuais,
            geracao_completa: subtemasAtuais >= totalSubtemas
          }));
          
          // Atualiza as questões em tempo real
          const { data: todasQuestoes } = await supabase
            .from("QUESTOES_GERADAS")
            .select("*")
            .eq("area", area)
            .eq("tema", tema);
          
          if (todasQuestoes && todasQuestoes.length > 0) {
            setQuestoes(todasQuestoes as Questao[]);
          }
        }
      };
      
      // Polling a cada 3 segundos
      pollInterval = setInterval(pollProgress, 3000);

      // Chama edge function para gerar questões
      const { data, error } = await supabase.functions.invoke("gerar-questoes-tema", {
        body: { area, tema, resumos }
      });

      // Para o polling
      if (pollInterval) {
        clearInterval(pollInterval);
      }

      if (error) throw error;

      // Busca final das questões após a geração
      const { data: questoesFinais } = await supabase
        .from("QUESTOES_GERADAS")
        .select("*")
        .eq("area", area)
        .eq("tema", tema);

      if (questoesFinais && questoesFinais.length > 0) {
        setQuestoes(questoesFinais as Questao[]);
        
        const subtemasFinais = new Set(questoesFinais.map(q => q.subtema)).size;
        const geracaoCompleta = subtemasFinais >= totalSubtemas;
        
        setGeracaoStatus({
          total_subtemas: totalSubtemas,
          subtemas_processados: subtemasFinais,
          subtemas_faltantes: totalSubtemas - subtemasFinais,
          geracao_completa: geracaoCompleta
        });
        
        if (geracaoCompleta) {
          toast.success(`${questoesFinais.length} questões disponíveis!`);
        } else {
          toast.success(
            `${questoesFinais.length} questões geradas! (${subtemasFinais}/${totalSubtemas} subtemas)`,
            {
              description: "O próximo acesso continuará gerando mais questões.",
              duration: 5000
            }
          );
        }
      } else {
        toast.error("Não foi possível gerar questões");
      }
    } catch (error) {
      console.error("Erro ao gerar questões:", error);
      toast.error("Erro ao gerar questões. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinish = () => {
    navigate(`/ferramentas/questoes/temas?area=${encodeURIComponent(area)}`);
  };

  // Calcular progresso para a barra
  const progressPercent = geracaoStatus 
    ? Math.round((geracaoStatus.subtemas_processados / geracaoStatus.total_subtemas) * 100)
    : 0;

  if (isLoading || isGenerating) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          
          <div className="text-center w-full max-w-xs">
            <h2 className="text-lg font-semibold mb-1">
              {isGenerating ? "Gerando questões..." : "Carregando..."}
            </h2>
            
            {isGenerating && geracaoStatus && (
              <>
                <div className="mt-4 mb-2">
                  <Progress value={progressPercent} className="h-2" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {geracaoStatus.subtemas_processados}/{geracaoStatus.total_subtemas} subtemas
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {questoes.length > 0 && `${questoes.length} questões geradas`}
                </p>
              </>
            )}
            
            <p className="text-sm text-muted-foreground max-w-xs mt-2 min-h-[40px] transition-opacity duration-300">
              {isGenerating 
                ? FRASES_GERACAO[fraseIndex]
                : "Verificando questões disponíveis..."
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (questoes.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center">
            <Scale className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-1">Nenhuma questão disponível</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              Não foi possível carregar ou gerar questões para este tema.
            </p>
            <Button onClick={() => navigate(-1)}>Voltar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-3 py-3">
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm line-clamp-1">{tema}</h1>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {area} • {questoes.length} questões
            {geracaoStatus && !geracaoStatus.geracao_completa && (
              <span className="text-amber-500 ml-1">
                ({geracaoStatus.subtemas_processados}/{geracaoStatus.total_subtemas} subtemas)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Quiz */}
      <QuestoesConcurso 
        questoes={questoes} 
        onFinish={handleFinish}
        area={area}
        tema={tema}
        autoplayAudio={autoplayAudio}
      />
    </div>
  );
};

export default QuestoesResolver;
