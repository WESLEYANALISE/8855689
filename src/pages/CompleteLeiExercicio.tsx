import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Check, X, RotateCcw, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import confetti from "canvas-confetti";

interface Lacuna {
  posicao: number;
  palavraCorreta: string;
}

interface ExercicioData {
  textoComLacunas: string;
  palavras: string[];
  lacunas: Lacuna[];
}

const getAreaName = (tableName: string): string => {
  const areaMap: Record<string, string> = {
    "CP - Código Penal": "Código Penal",
    "CC - Código Civil": "Código Civil",
    "CF - Constituição Federal": "Constituição Federal",
    "CPC – Código de Processo Civil": "Código de Processo Civil",
    "CPP – Código de Processo Penal": "Código de Processo Penal",
    "CLT - Consolidação das Leis do Trabalho": "CLT",
    "CDC – Código de Defesa do Consumidor": "Código de Defesa do Consumidor",
    "CTN – Código Tributário Nacional": "Código Tributário Nacional",
    "CE – Código Eleitoral": "Código Eleitoral",
    "CTB Código de Trânsito Brasileiro": "Código de Trânsito Brasileiro",
    "CPM – Código Penal Militar": "Código Penal Militar",
    "CPPM – Código de Processo Penal Militar": "Código de Processo Penal Militar",
  };
  return areaMap[tableName] || tableName;
};

const CompleteLeiExercicio = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codigo = searchParams.get("codigo") || "";
  const artigo = searchParams.get("artigo") || "";
  const cor = searchParams.get("cor") || "rgb(59, 130, 246)";

  const [exercicio, setExercicio] = useState<ExercicioData | null>(null);
  const [respostasUsuario, setRespostasUsuario] = useState<Record<number, string>>({});
  const [palavrasDisponiveis, setPalavrasDisponiveis] = useState<string[]>([]);
  const [palavraSelecionada, setPalavraSelecionada] = useState<string | null>(null);
  const [verificado, setVerificado] = useState(false);
  const [acertos, setAcertos] = useState(0);

  // Buscar exercício do cache
  const { data: exercicioCache, isLoading: isLoadingCache } = useQuery({
    queryKey: ["exercicio-cache", codigo, artigo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("COMPLETE_LEI_CACHE")
        .select("*")
        .eq("area", codigo)
        .eq("artigo", artigo)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao buscar cache:", error);
        return null;
      }

      return data;
    },
    enabled: !!codigo && !!artigo,
  });

  // Buscar conteúdo do artigo se não houver cache
  const { data: artigoConteudo, isLoading: isLoadingArtigo } = useQuery({
    queryKey: ["artigo-conteudo", codigo, artigo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(codigo as any)
        .select("Artigo")
        .eq('"Número do Artigo"', artigo)
        .single();

      if (error) {
        console.error("Erro ao buscar artigo:", error);
        return null;
      }

      return (data as any)?.Artigo || null;
    },
    enabled: !!codigo && !!artigo && !exercicioCache,
  });

  // Gerar exercício via edge function (usa gerar-flashcards com tipo: lacunas)
  const gerarExercicioMutation = useMutation({
    mutationFn: async (conteudo: string) => {
      const { data, error } = await supabase.functions.invoke("gerar-flashcards", {
        body: {
          conteudo,
          area: codigo,
          artigo,
          tipo: "lacunas",
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.textoComLacunas && data?.palavras && data?.lacunas) {
        setExercicio(data);
        setPalavrasDisponiveis([...data.palavras].sort(() => Math.random() - 0.5));
      }
    },
    onError: (error) => {
      console.error("Erro ao gerar exercício:", error);
      toast.error("Erro ao gerar exercício. Tente novamente.");
    },
  });

  // Carregar exercício do cache ou gerar novo
  useEffect(() => {
    if (exercicioCache) {
      const cacheData = exercicioCache as any;
      const data = {
        textoComLacunas: cacheData.texto_com_lacunas,
        palavras: cacheData.palavras as string[],
        lacunas: cacheData.lacunas as Lacuna[],
      };
      setExercicio(data);
      setPalavrasDisponiveis([...data.palavras].sort(() => Math.random() - 0.5));
    } else if (artigoConteudo && !exercicio) {
      gerarExercicioMutation.mutate(artigoConteudo);
    }
  }, [exercicioCache, artigoConteudo]);

  const handlePalavraClick = (palavra: string) => {
    if (verificado) return;
    setPalavraSelecionada(palavra);
  };

  const handleLacunaClick = (posicao: number) => {
    if (verificado) return;
    
    if (palavraSelecionada) {
      // Colocar palavra na lacuna
      const palavraAnterior = respostasUsuario[posicao];
      
      setRespostasUsuario((prev) => ({
        ...prev,
        [posicao]: palavraSelecionada,
      }));
      
      setPalavrasDisponiveis((prev) => {
        let novaLista = prev.filter((p) => p !== palavraSelecionada);
        if (palavraAnterior) {
          novaLista = [...novaLista, palavraAnterior];
        }
        return novaLista;
      });
      
      setPalavraSelecionada(null);
    } else if (respostasUsuario[posicao]) {
      // Remover palavra da lacuna
      const palavra = respostasUsuario[posicao];
      setPalavrasDisponiveis((prev) => [...prev, palavra]);
      setRespostasUsuario((prev) => {
        const novo = { ...prev };
        delete novo[posicao];
        return novo;
      });
    }
  };

  const handleVerificar = () => {
    if (!exercicio) return;
    
    let corretas = 0;
    exercicio.lacunas.forEach((lacuna) => {
      if (respostasUsuario[lacuna.posicao]?.toLowerCase() === lacuna.palavraCorreta.toLowerCase()) {
        corretas++;
      }
    });
    
    setAcertos(corretas);
    setVerificado(true);
    
    if (corretas === exercicio.lacunas.length) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast.success("Parabéns! Você acertou tudo!");
    } else if (corretas > exercicio.lacunas.length / 2) {
      toast.success(`Bom trabalho! ${corretas}/${exercicio.lacunas.length} corretas`);
    } else {
      toast.info(`${corretas}/${exercicio.lacunas.length} corretas. Continue praticando!`);
    }
  };

  const handleRecomecar = () => {
    setRespostasUsuario({});
    setPalavrasDisponiveis(exercicio ? [...exercicio.palavras].sort(() => Math.random() - 0.5) : []);
    setPalavraSelecionada(null);
    setVerificado(false);
    setAcertos(0);
  };

  const renderTextoComLacunas = () => {
    if (!exercicio) return null;
    
    const partes = exercicio.textoComLacunas.split("_____");
    
    return (
      <p className="text-base leading-relaxed">
        {partes.map((parte, index) => (
          <span key={index}>
            {parte}
            {index < partes.length - 1 && (
              <button
                onClick={() => handleLacunaClick(index)}
                className={`inline-flex items-center justify-center min-w-[80px] px-2 py-1 mx-1 rounded-md border-2 border-dashed transition-all ${
                  verificado
                    ? respostasUsuario[index]?.toLowerCase() === exercicio.lacunas[index]?.palavraCorreta.toLowerCase()
                      ? "bg-green-500/20 border-green-500 text-green-400"
                      : "bg-red-500/20 border-red-500 text-red-400"
                    : respostasUsuario[index]
                    ? "bg-primary/20 border-primary text-foreground"
                    : palavraSelecionada
                    ? "bg-primary/10 border-primary/50 animate-pulse cursor-pointer"
                    : "bg-muted/50 border-muted-foreground/30"
                }`}
                disabled={verificado}
              >
                {respostasUsuario[index] || (
                  <span className="text-muted-foreground text-sm">_____</span>
                )}
                {verificado && respostasUsuario[index]?.toLowerCase() !== exercicio.lacunas[index]?.palavraCorreta.toLowerCase() && (
                  <span className="ml-1 text-xs text-green-400">
                    ({exercicio.lacunas[index]?.palavraCorreta})
                  </span>
                )}
              </button>
            )}
          </span>
        ))}
      </p>
    );
  };

  if (!codigo || !artigo) {
    navigate("/flashcards/complete-lei");
    return null;
  }

  const isLoading = isLoadingCache || isLoadingArtigo || gerarExercicioMutation.isPending;

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/flashcards/complete-lei/artigos?codigo=${encodeURIComponent(codigo)}&cor=${encodeURIComponent(cor)}`)}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg"
            style={{ backgroundColor: cor, boxShadow: `0 0 20px ${cor}50` }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Art. {artigo}</h1>
            <p className="text-sm text-muted-foreground">{getAreaName(codigo)}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {gerarExercicioMutation.isPending ? "Gerando exercício com IA..." : "Carregando..."}
          </p>
        </div>
      ) : exercicio ? (
        <>
          {/* Texto com lacunas */}
          <Card className="p-5 mb-6 bg-card/80 border-border/50">
            <div className="mb-2 text-xs text-muted-foreground uppercase tracking-wide">
              Complete o artigo:
            </div>
            {renderTextoComLacunas()}
          </Card>

          {/* Palavras disponíveis */}
          <div className="mb-6">
            <div className="mb-2 text-sm font-medium text-muted-foreground">
              Palavras disponíveis:
            </div>
            <div className="flex flex-wrap gap-2">
              {palavrasDisponiveis.map((palavra, index) => (
                <button
                  key={`${palavra}-${index}`}
                  onClick={() => handlePalavraClick(palavra)}
                  disabled={verificado}
                  className={`px-3 py-2 rounded-lg border-2 transition-all font-medium ${
                    palavraSelecionada === palavra
                      ? "border-primary bg-primary text-primary-foreground scale-105"
                      : "border-border bg-card hover:border-primary/50 hover:bg-primary/10"
                  } ${verificado ? "opacity-50" : ""}`}
                >
                  {palavra}
                </button>
              ))}
              {palavrasDisponiveis.length === 0 && !verificado && (
                <span className="text-muted-foreground text-sm">
                  Todas as palavras foram usadas
                </span>
              )}
            </div>
          </div>

          {/* Resultado */}
          {verificado && (
            <Card className="p-4 mb-6 bg-card/80 border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {acertos === exercicio.lacunas.length ? (
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <X className="w-5 h-5 text-amber-500" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold">
                      {acertos}/{exercicio.lacunas.length} corretas
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {acertos === exercicio.lacunas.length
                        ? "Perfeito!"
                        : "Revise as respostas em vermelho"}
                    </div>
                  </div>
                </div>
                <div 
                  className="text-2xl font-bold"
                  style={{ color: cor }}
                >
                  {Math.round((acertos / exercicio.lacunas.length) * 100)}%
                </div>
              </div>
            </Card>
          )}

          {/* Botões de ação */}
          <div className="flex gap-3">
            {!verificado ? (
              <Button
                onClick={handleVerificar}
                disabled={Object.keys(respostasUsuario).length < exercicio.lacunas.length}
                className="flex-1"
                style={{ backgroundColor: cor }}
              >
                <Check className="w-4 h-4 mr-2" />
                Verificar
              </Button>
            ) : (
              <Button onClick={handleRecomecar} variant="outline" className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p>Erro ao carregar exercício. Tente novamente.</p>
          <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">
            Voltar
          </Button>
        </div>
      )}
    </div>
  );
};

export default CompleteLeiExercicio;
