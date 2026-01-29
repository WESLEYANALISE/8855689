import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Volume2, Pause, BookOpen, Scale } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { getTableFromCodigo } from "@/lib/codigoMappings";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { playFeedbackSound } from "@/hooks/useFeedbackSound";
import { imageQueue } from "@/lib/imageQueue";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface Questao {
  id: number;
  enunciado: string;
  alternativas: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  resposta_correta: string;
  comentario: string;
  exemplo_pratico: string;
  artigo?: string; // Número do artigo da questão
  url_audio_enunciado?: string;
  url_audio_comentario?: string;
  url_audio_exemplo?: string;
  url_imagem_exemplo?: string;
}

const QuestoesArtigosLeiResolver = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codigo = searchParams.get("codigo") || "cf";
  const artigoParam = searchParams.get("artigo") || "";
  const artigosParam = searchParams.get("artigos") || "";
  
  // Suporta tanto artigo único quanto múltiplos artigos
  const artigos = artigosParam ? artigosParam.split(",") : (artigoParam ? [artigoParam] : []);
  const artigo = artigos[0] || ""; // Primeiro artigo para compatibilidade

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [geracaoProgresso, setGeracaoProgresso] = useState<{ atual: number; total: number } | null>(null);
  const [showExemplo, setShowExemplo] = useState(false);
  const [showArtigo, setShowArtigo] = useState(false);
  const [artigoTexto, setArtigoTexto] = useState<string>("");
  const [artigoGrifos, setArtigoGrifos] = useState<string[]>([]);
  const [isLoadingGrifos, setIsLoadingGrifos] = useState(false);
  const [isPlayingEnunciado, setIsPlayingEnunciado] = useState(false);
  const [isPlayingComentario, setIsPlayingComentario] = useState(false);
  const [isPlayingExemplo, setIsPlayingExemplo] = useState(false);

  // URLs de feedback de voz
  const [feedbackAudioUrls, setFeedbackAudioUrls] = useState<{ correta?: string; incorreta?: string }>({});

  // Refs de áudio
  const audioEnunciadoRef = useRef<HTMLAudioElement>(null);
  const audioComentarioRef = useRef<HTMLAudioElement>(null);
  const audioExemploRef = useRef<HTMLAudioElement>(null);
  const feedbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const comentarioRef = useRef<HTMLDivElement>(null);

  const tableName = getTableFromCodigo(codigo);
  const currentQuestao = questoes[currentIndex];
  
  // Refs para controlar execução única
  const hasLoadedRef = useRef(false);
  const audioPlaybackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carregar áudios de feedback de voz
  useEffect(() => {
    const carregarAudiosFeedback = async () => {
      try {
        const [resCorreta, resIncorreta] = await Promise.all([
          supabase.from('AUDIO_FEEDBACK_CACHE').select('url_audio').eq('tipo', 'correta').single(),
          supabase.from('AUDIO_FEEDBACK_CACHE').select('url_audio').eq('tipo', 'incorreta').single()
        ]);
        
        setFeedbackAudioUrls({
          correta: resCorreta.data?.url_audio,
          incorreta: resIncorreta.data?.url_audio
        });
        console.log("🔊 Áudios de feedback carregados");
      } catch (err) {
        console.log('Erro ao carregar áudios de feedback:', err);
      }
    };
    carregarAudiosFeedback();
  }, []);

  // Shake animation variants
  const shakeVariants = {
    shake: {
      x: [0, -8, 8, -8, 8, -4, 4, 0],
      transition: { duration: 0.5 }
    },
    idle: { x: 0 }
  };

  // Parar todos os áudios
  const stopAllAudio = useCallback(() => {
    if (audioEnunciadoRef.current) {
      audioEnunciadoRef.current.pause();
      setIsPlayingEnunciado(false);
    }
    if (audioComentarioRef.current) {
      audioComentarioRef.current.pause();
      setIsPlayingComentario(false);
    }
    if (audioExemploRef.current) {
      audioExemploRef.current.pause();
      setIsPlayingExemplo(false);
    }
    if (feedbackAudioRef.current) {
      feedbackAudioRef.current.pause();
      feedbackAudioRef.current = null;
    }
  }, []);

  // Função para reproduzir feedback de voz
  const playVoiceFeedback = (isCorrect: boolean): Promise<void> => {
    return new Promise((resolve) => {
      const url = isCorrect ? feedbackAudioUrls.correta : feedbackAudioUrls.incorreta;
      
      if (!url) {
        resolve();
        return;
      }
      
      if (feedbackAudioRef.current) {
        feedbackAudioRef.current.pause();
      }
      
      const audio = new Audio(url);
      feedbackAudioRef.current = audio;
      
      audio.onended = () => {
        feedbackAudioRef.current = null;
        resolve();
      };
      audio.onerror = () => {
        feedbackAudioRef.current = null;
        resolve();
      };
      
      audio.play().catch(() => {
        feedbackAudioRef.current = null;
        resolve();
      });
    });
  };

  // Ref para armazenar áudios pré-carregados
  const preloadedAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Função para pré-carregar áudio
  const preloadAudio = useCallback((url: string) => {
    if (!url || preloadedAudiosRef.current.has(url)) return;
    
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = url;
    preloadedAudiosRef.current.set(url, audio);
  }, []);

  const fetchQuestoes = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("QUESTOES_ARTIGOS_LEI")
        .select("*")
        .eq("area", tableName);
      
      // Se múltiplos artigos, usar .in(), senão usar .eq()
      if (artigos.length > 1) {
        query = query.in("artigo", artigos);
      } else if (artigo) {
        query = query.eq("artigo", artigo);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedQuestoes = data.map(q => ({
          id: q.id,
          enunciado: q.enunciado,
          alternativas: {
            a: q.alternativa_a,
            b: q.alternativa_b,
            c: q.alternativa_c,
            d: q.alternativa_d,
          },
          resposta_correta: q.resposta_correta,
          comentario: q.comentario,
          exemplo_pratico: q.exemplo_pratico,
          artigo: q.artigo, // Incluir o artigo da questão
          url_audio_enunciado: q.url_audio_enunciado,
          url_audio_comentario: q.url_audio_comentario,
          url_audio_exemplo: q.url_audio_exemplo,
          url_imagem_exemplo: q.url_imagem_exemplo,
        }));
        
        // Embaralhar questões se múltiplos artigos
        const shuffledQuestoes = artigos.length > 1 
          ? mappedQuestoes.sort(() => Math.random() - 0.5)
          : mappedQuestoes;
        
        setQuestoes(shuffledQuestoes);
        
        // Pré-carregar áudios das primeiras 3 questões imediatamente
        shuffledQuestoes.slice(0, 3).forEach(q => {
          if (q.url_audio_enunciado) preloadAudio(q.url_audio_enunciado);
          if (q.url_audio_comentario) preloadAudio(q.url_audio_comentario);
          if (q.url_audio_exemplo) preloadAudio(q.url_audio_exemplo);
        });
      } else if (artigos.length === 1) {
        // Só gerar automaticamente se for artigo único
        await generateQuestoes();
      } else {
        toast.error("Nenhuma questão encontrada para os artigos selecionados");
      }
    } catch (error) {
      console.error("Erro ao carregar questões:", error);
      toast.error("Erro ao carregar questões");
    } finally {
      setIsLoading(false);
    }
  }, [tableName, artigo, artigos, preloadAudio]);

  const generateQuestoes = async () => {
    setIsGenerating(true);
    setGeracaoProgresso({ atual: 0, total: 25 }); // Estimativa inicial
    
    try {
      const variacoes = [
        artigo,
        `${artigo}°`,
        `Art. ${artigo}`,
        `Art. ${artigo}°`,
        artigo.replace('°', ''),
      ];
      
      let artigoContent: string | null = null;
      
      for (const variacao of variacoes) {
        const { data: artigoData } = await supabase
          .from(tableName as any)
          .select("Artigo")
          .eq("Número do Artigo", variacao)
          .maybeSingle();
        
        if ((artigoData as any)?.Artigo) {
          artigoContent = (artigoData as any).Artigo;
          break;
        }
      }
      
      if (!artigoContent) {
        const { data: artigoData } = await supabase
          .from(tableName as any)
          .select("Artigo, \"Número do Artigo\"")
          .or(`"Número do Artigo".eq.${artigo},"Número do Artigo".eq.${artigo}°,"Número do Artigo".ilike.%${artigo}%`)
          .limit(1)
          .maybeSingle();
        
        artigoContent = (artigoData as any)?.Artigo;
      }
      
      if (!artigoContent) {
        toast.error("Artigo não encontrado");
        return;
      }

      // Calcular total esperado baseado no tamanho do artigo
      const tamanhoArtigo = artigoContent.length;
      let totalEsperado = 15;
      if (tamanhoArtigo > 3000) totalEsperado = 40;
      else if (tamanhoArtigo > 1500) totalEsperado = 25;
      
      setGeracaoProgresso({ atual: 0, total: totalEsperado });

      // Chamar edge function (gera em background)
      const { error } = await supabase.functions.invoke("gerar-questoes-artigo", {
        body: {
          content: artigoContent,
          area: tableName,
          numeroArtigo: artigo,
        },
      });

      if (error) throw error;

      toast.info("Gerando questões... aguarde");

      // Polling para aguardar questões serem geradas
      let tentativas = 0;
      const maxTentativas = 60; // 2 minutos
      let ultimoCount = 0;
      let semProgressoCount = 0;

      while (tentativas < maxTentativas) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        tentativas++;

        const { count } = await supabase
          .from("QUESTOES_ARTIGOS_LEI")
          .select("id", { count: 'exact', head: true })
          .eq("area", tableName)
          .eq("artigo", artigo);

        const currentCount = count || 0;
        setGeracaoProgresso({ atual: currentCount, total: Math.max(totalEsperado, currentCount) });

        if (currentCount > ultimoCount) {
          ultimoCount = currentCount;
          semProgressoCount = 0;
        } else {
          semProgressoCount++;
        }

        // Se tem pelo menos 15 questões e parou de crescer por 10s
        if (currentCount >= 15 && semProgressoCount >= 5) {
          break;
        }
      }

      // Recarregar questões após geração
      const { data: novasQuestoes } = await supabase
        .from("QUESTOES_ARTIGOS_LEI")
        .select("*")
        .eq("area", tableName)
        .eq("artigo", artigo);

      if (novasQuestoes && novasQuestoes.length > 0) {
        const mappedQuestoes = novasQuestoes.map(q => ({
          id: q.id,
          enunciado: q.enunciado,
          alternativas: {
            a: q.alternativa_a,
            b: q.alternativa_b,
            c: q.alternativa_c,
            d: q.alternativa_d,
          },
          resposta_correta: q.resposta_correta,
          comentario: q.comentario,
          exemplo_pratico: q.exemplo_pratico,
          url_audio_enunciado: q.url_audio_enunciado,
          url_audio_comentario: q.url_audio_comentario,
          url_audio_exemplo: q.url_audio_exemplo,
          url_imagem_exemplo: q.url_imagem_exemplo,
        }));
        
        setQuestoes(mappedQuestoes);
        toast.success(`${mappedQuestoes.length} questões geradas!`);
      } else {
        toast.error("Nenhuma questão foi gerada");
      }
    } catch (error) {
      console.error("Erro ao gerar questões:", error);
      toast.error("Erro ao gerar questões");
    } finally {
      setIsGenerating(false);
      setGeracaoProgresso(null);
    }
  };

  useEffect(() => {
    if (artigos.length > 0 && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchQuestoes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artigos.length]);

  // Buscar texto do artigo para exibir no drawer - baseado na questão atual
  useEffect(() => {
    const fetchArtigoTexto = async () => {
      // Usar o artigo da questão atual, ou o primeiro artigo da lista
      const artigoAtual = currentQuestao?.artigo || artigo;
      if (!artigoAtual || !tableName) return;
      
      // Normalizar artigo removendo símbolos ordinais
      const artigoLimpo = artigoAtual.replace(/[°º]/g, '');
      
      const variacoes = [
        artigoAtual,
        `${artigoLimpo}º`,  // com º ordinal
        `${artigoLimpo}°`,  // com ° grau
        artigoLimpo,        // só número
        `Art. ${artigoAtual}`,
        `Art. ${artigoLimpo}º`,
        `Art. ${artigoLimpo}°`,
        `Art. ${artigoLimpo}`,
      ];
      
      for (const variacao of variacoes) {
        const { data } = await supabase
          .from(tableName as any)
          .select("Artigo")
          .eq("Número do Artigo", variacao)
          .limit(1);
        
        // Usar limit(1) em vez de maybeSingle() para lidar com tabelas que têm múltiplos registros do mesmo artigo
        if (data && data.length > 0 && (data[0] as any)?.Artigo) {
          setArtigoTexto((data[0] as any).Artigo);
          return;
        }
      }
      
      // Se não encontrou, limpar o texto
      setArtigoTexto("");
    };
    
    fetchArtigoTexto();
  }, [currentQuestao?.artigo, artigo, tableName]);

  // Função para grifar texto do artigo usando trechos identificados pela IA
  const highlightCitedText = (textoArtigo: string, trechos: string[]): string => {
    if (!textoArtigo || trechos.length === 0) return textoArtigo;
    
    let resultado = textoArtigo;
    const highlightClass = 'bg-amber-500/30 text-amber-200 px-0.5 rounded-sm';
    
    // Ordenar por tamanho decrescente para evitar conflitos de substituição
    const trechosOrdenados = [...trechos].sort((a, b) => b.length - a.length);
    
    trechosOrdenados.forEach(trecho => {
      // Escapar caracteres especiais de regex
      const escapedTexto = trecho.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match flexível: ignorar diferenças de espaços múltiplos
      const flexiblePattern = escapedTexto.replace(/\s+/g, '\\s+');
      const regex = new RegExp(`(${flexiblePattern})(?![^<]*>)`, 'gi');
      
      resultado = resultado.replace(regex, `<mark class="${highlightClass}">$1</mark>`);
    });
    
    return resultado;
  };

  // Buscar trechos para grifo - primeiro do cache, depois da IA
  const fetchGrifosComIA = async () => {
    if (!artigoTexto || !currentQuestao) return;
    
    const artigoAtual = currentQuestao.artigo || artigo;
    
    setIsLoadingGrifos(true);
    try {
      // Primeiro, tentar buscar do cache
      const { data: cacheData } = await supabase
        .from('questoes_grifos_cache')
        .select('trechos_grifados')
        .eq('tabela_codigo', tableName)
        .eq('numero_artigo', artigoAtual)
        .maybeSingle();

      if (cacheData?.trechos_grifados && cacheData.trechos_grifados.length > 0) {
        console.log("✅ Grifos carregados do cache:", cacheData.trechos_grifados);
        setArtigoGrifos(cacheData.trechos_grifados);
        setIsLoadingGrifos(false);
        return;
      }

      // Se não estiver no cache, chamar a edge function
      const alternativaCorreta = currentQuestao.resposta_correta?.toLowerCase();
      const textoAlternativaCorreta = alternativaCorreta 
        ? currentQuestao.alternativas[alternativaCorreta as keyof typeof currentQuestao.alternativas]
        : '';

      const { data, error } = await supabase.functions.invoke('identificar-grifo-artigo', {
        body: {
          textoArtigo: artigoTexto,
          enunciado: currentQuestao.enunciado,
          alternativaCorreta: textoAlternativaCorreta,
          comentario: currentQuestao.comentario,
          tabelaCodigo: tableName,
          numeroArtigo: artigoAtual,
          questaoId: currentQuestao.id,
          salvarCache: true
        }
      });

      if (error) {
        console.error("Erro ao identificar grifos:", error);
        setArtigoGrifos([]);
        return;
      }

      if (data?.trechos && Array.isArray(data.trechos)) {
        console.log("✅ Grifos identificados pela IA:", data.trechos);
        setArtigoGrifos(data.trechos);
      } else {
        setArtigoGrifos([]);
      }
    } catch (err) {
      console.error("Erro ao buscar grifos:", err);
      setArtigoGrifos([]);
    } finally {
      setIsLoadingGrifos(false);
    }
  };

  // Chamar a IA quando abrir o drawer do artigo
  useEffect(() => {
    if (showArtigo && artigoTexto && artigoGrifos.length === 0) {
      fetchGrifosComIA();
    }
  }, [showArtigo, artigoTexto]);

  // Limpar grifos quando mudar de questão
  useEffect(() => {
    setArtigoGrifos([]);
  }, [currentIndex]);

  // Pré-carregar próxima questão quando mudar de questão (apenas áudios existentes, sem gerar novos)
  useEffect(() => {
    const nextQuestao = questoes[currentIndex + 1];
    if (nextQuestao) {
      if (nextQuestao.url_audio_enunciado) preloadAudio(nextQuestao.url_audio_enunciado);
      if (nextQuestao.url_audio_comentario) preloadAudio(nextQuestao.url_audio_comentario);
      if (nextQuestao.url_audio_exemplo) preloadAudio(nextQuestao.url_audio_exemplo);
    }
  }, [currentIndex, questoes, preloadAudio]);

  // NARRAÇÃO AUTOMÁTICA DESATIVADA - não reproduz áudio ao entrar na questão
  // O usuário pode clicar no botão de áudio se quiser ouvir (áudios já salvos)

  // GERAÇÃO DE ÁUDIO DESATIVADA - apenas reproduz áudios já salvos
  // GERAÇÃO DE IMAGEM DESATIVADA

  // Scroll suave para o comentário
  const scrollToComentario = () => {
    setTimeout(() => {
      comentarioRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 100);
  };

  // Reproduzir áudio e aguardar (apenas para áudios já salvos)
  const reproduzirAudioEAguardar = (url: string, audioElement: HTMLAudioElement | null): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioElement || !url) {
        resolve();
        return;
      }
      
      const handleEnded = () => {
        audioElement.removeEventListener('ended', handleEnded);
        resolve();
      };
      
      audioElement.addEventListener('ended', handleEnded);
      audioElement.src = url;
      audioElement.play().catch(() => {
        audioElement.removeEventListener('ended', handleEnded);
        resolve();
      });
    });
  };

  // Narrar comentário (apenas se já tiver URL salva)
  const narrarComentarioAutomatico = async () => {
    if (!currentQuestao?.comentario || !currentQuestao.url_audio_comentario) return;
    
    if (audioComentarioRef.current) {
      setIsPlayingComentario(true);
      await reproduzirAudioEAguardar(currentQuestao.url_audio_comentario, audioComentarioRef.current);
      setIsPlayingComentario(false);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (showResult) return;
    
    stopAllAudio();
    
    setSelectedAnswer(answer);
    setShowResult(true);

    const correct = answer === currentQuestao.resposta_correta;
    
    // Animação de shake se errou
    if (!correct) {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
    }

    // Scroll suave para o comentário
    scrollToComentario();

    // 1. Som de beep (acerto/erro)
    await playFeedbackSound(correct ? 'correct' : 'error');
    
    // 2. Voz "Parabéns, você acertou!" ou "Ops, você errou."
    await playVoiceFeedback(correct);

    // Não narrar comentário automaticamente - usuário pode usar botão manual
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      stopAllAudio();
      setCurrentIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExemplo(false);
    }
  };

  const handleNext = () => {
    stopAllAudio();
    
    if (currentIndex < questoes.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExemplo(false);
    } else {
      toast.success("Você completou todas as questões!");
      navigate(-1);
    }
  };

  // Toggle áudio do enunciado - só reproduz áudio já salvo
  const toggleAudioEnunciado = async () => {
    if (!audioEnunciadoRef.current) return;
    
    if (isPlayingEnunciado) {
      stopAllAudio();
      return;
    }
    
    stopAllAudio();
    
    const url = currentQuestao?.url_audio_enunciado;
    
    if (url) {
      audioEnunciadoRef.current.src = url;
      audioEnunciadoRef.current.play().then(() => {
        setIsPlayingEnunciado(true);
      }).catch(console.error);
    }
  };

  // Toggle áudio do comentário - só reproduz áudio já salvo
  const toggleAudioComentario = async () => {
    if (!audioComentarioRef.current) return;
    
    if (isPlayingComentario) {
      stopAllAudio();
      return;
    }
    
    stopAllAudio();
    
    const url = currentQuestao?.url_audio_comentario;
    
    if (url) {
      if (audioComentarioRef.current.src !== url) {
        audioComentarioRef.current.src = url;
      }
      audioComentarioRef.current.play().then(() => {
        setIsPlayingComentario(true);
      }).catch(console.error);
    }
  };

  // Toggle áudio do exemplo - só reproduz áudio já salvo
  const toggleAudioExemplo = async () => {
    if (!audioExemploRef.current) return;
    
    if (isPlayingExemplo) {
      stopAllAudio();
      return;
    }
    
    stopAllAudio();
    
    const url = currentQuestao?.url_audio_exemplo;
    
    if (url) {
      if (audioExemploRef.current.src !== url) {
        audioExemploRef.current.src = url;
      }
      audioExemploRef.current.play().then(() => {
        setIsPlayingExemplo(true);
      }).catch(console.error);
    }
  };

  if (isLoading || isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <div className="text-center space-y-3">
          <p className="text-muted-foreground font-medium">
            {isGenerating ? "Gerando questões..." : "Carregando..."}
          </p>
          {isGenerating && geracaoProgresso && (
            <div className="w-64 mx-auto space-y-2">
              <Progress 
                value={(geracaoProgresso.atual / geracaoProgresso.total) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground/70">
                Questão {geracaoProgresso.atual} de {geracaoProgresso.total}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentQuestao) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Nenhuma questão disponível</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  const isCorrect = selectedAnswer === currentQuestao.resposta_correta;

  return (
    <>
      <motion.div 
        ref={containerRef}
        variants={shakeVariants}
        animate={shakeError ? "shake" : "idle"}
        className="px-3 py-4 max-w-4xl mx-auto pb-8"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-bold">
            {artigos.length > 1 
              ? `${artigos.length} Artigos Selecionados`
              : `Art. ${artigo}`
            }
          </h1>
          <p className="text-sm text-muted-foreground">
            Questão {currentIndex + 1} de {questoes.length}
          </p>
        </div>

        {/* Questão com transição fluida */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* Indicador do Artigo (quando múltiplos artigos selecionados) */}
            {artigos.length > 1 && currentQuestao.artigo && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="text-sm font-medium text-amber-500">
                  Art. {currentQuestao.artigo}
                </span>
              </div>
            )}

            {/* Enunciado */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <p className="text-sm leading-relaxed flex-1">{currentQuestao.enunciado}</p>
                </div>
              </CardContent>
            </Card>

            {/* Alternativas */}
            <div className="space-y-2 mb-6">
              {Object.entries(currentQuestao.alternativas).map(([key, value], idx) => {
                const isSelected = selectedAnswer === key;
                const isCorrectAnswer = key === currentQuestao.resposta_correta;
                
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer transition-all",
                        !showResult && "hover:border-primary/50",
                        showResult && isCorrectAnswer && "border-green-500 bg-green-500/10",
                        showResult && isSelected && !isCorrectAnswer && "border-red-500 bg-red-500/10"
                      )}
                      onClick={() => handleAnswer(key)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <span className="font-bold text-sm uppercase">{key})</span>
                        <span className="text-sm flex-1">{value}</span>
                        {showResult && isCorrectAnswer && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        {showResult && isSelected && !isCorrectAnswer && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Resultado */}
        {showResult && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Feedback */}
            <Card className={cn(
              "border-2",
              isCorrect ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-bold">
                    {isCorrect ? "Parabéns, você acertou!" : "Ops, você errou."}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Comentário */}
            <Card ref={comentarioRef}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm">Explicação</h3>
                </div>
                <div className="text-sm whitespace-pre-line">
                  {currentQuestao.comentario
                    ?.replace(/\s*---\s*/g, '\n\n')
                    ?.replace(/\\n/g, '\n')
                    ?.split('\n\n')
                    .map((paragrafo, idx) => {
                      const letraCorreta = currentQuestao.resposta_correta?.toUpperCase();
                      const isCorrectAlternative = paragrafo.trim().toUpperCase().startsWith(`ALTERNATIVA ${letraCorreta}:`);
                      const isWrongAlternative = /^ALTERNATIVA\s+[A-D]:/i.test(paragrafo.trim()) && !isCorrectAlternative;
                      const isIntroText = idx === 0 || paragrafo.toLowerCase().includes('resposta correta') || paragrafo.toLowerCase().includes('art.');
                      
                      return (
                        <p 
                          key={idx} 
                          className={cn(
                            "mb-3",
                            isCorrectAlternative && "text-green-400 font-medium",
                            isWrongAlternative && "text-red-400/80",
                            isIntroText && !isCorrectAlternative && !isWrongAlternative && "text-blue-400"
                          )}
                        >
                          {paragrafo}
                        </p>
                      );
                    })
                  }
                </div>
                
                {/* Botões Ver Exemplo e Ver Artigo */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {currentQuestao.exemplo_pratico && (
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => {
                        stopAllAudio();
                        setShowExemplo(true);
                        // Não reproduzir áudio automaticamente - usuário pode usar botão manual
                      }}
                      className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/40"
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      Ver Exemplo Prático
                    </Button>
                  )}
                  
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      stopAllAudio();
                      setShowArtigo(true);
                    }}
                    className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 border border-blue-500/40"
                  >
                    <Scale className="w-4 h-4 mr-1" />
                    Ver Artigo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Botões Navegação */}
            <div className="flex gap-2">
              {currentIndex > 0 && (
                <Button 
                  variant="outline" 
                  size="default"
                  onClick={handlePrevious}
                  className="shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Voltar
                </Button>
              )}
              <Button className="flex-1" size="lg" onClick={handleNext}>
                {currentIndex < questoes.length - 1 ? "Próxima Questão" : "Finalizar"}
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Audio elements */}
      <audio 
        ref={audioEnunciadoRef} 
        onEnded={() => setIsPlayingEnunciado(false)}
        onPause={() => setIsPlayingEnunciado(false)}
        onPlay={() => setIsPlayingEnunciado(true)}
      />
      <audio 
        ref={audioComentarioRef} 
        onEnded={() => setIsPlayingComentario(false)}
        onPause={() => setIsPlayingComentario(false)}
        onPlay={() => setIsPlayingComentario(true)}
      />
      <audio 
        ref={audioExemploRef} 
        onEnded={() => setIsPlayingExemplo(false)}
        onPause={() => setIsPlayingExemplo(false)}
        onPlay={() => setIsPlayingExemplo(true)}
      />

      {/* Drawer de Exemplo Prático */}
      <Drawer open={showExemplo} onOpenChange={(open) => {
        setShowExemplo(open);
        if (!open && audioExemploRef.current) {
          audioExemploRef.current.pause();
          audioExemploRef.current.currentTime = 0;
          setIsPlayingExemplo(false);
        }
      }}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Exemplo Prático
            </DrawerTitle>
            <DrawerDescription>
              Veja como esse conceito se aplica na prática
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-3">
            {/* Texto do exemplo */}
            <div className="bg-muted/50 rounded-xl p-4 border">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {currentQuestao?.exemplo_pratico}
              </p>
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Entendi
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer Ver Artigo */}
      <Drawer open={showArtigo} onOpenChange={setShowArtigo}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-500" />
              Art. {artigo}
            </DrawerTitle>
            <DrawerDescription>
              Texto completo do artigo com a base legal destacada
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
            <div className="bg-muted/50 rounded-xl p-4 border">
              {artigoTexto ? (
                <>
                  {isLoadingGrifos && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 mb-3">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Identificando base legal com IA...</span>
                    </div>
                  )}
                  <div 
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightCitedText(artigoTexto, artigoGrifos) 
                    }}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm">Carregando artigo...</span>
                </div>
              )}
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Fechar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default QuestoesArtigosLeiResolver;
