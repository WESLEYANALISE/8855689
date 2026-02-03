import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, Clock, Flag, Loader2, CheckCircle2, XCircle, Zap, Trophy, Volume2, VolumeX, Pause, PlayCircle, Sparkles, BookOpen, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

interface Questao {
  id: number;
  area: string;
  enunciado: string;
  alternativaA: string;
  alternativaB: string;
  alternativaC: string;
  alternativaD: string;
  alternativaE?: string;
  resposta: string;
  comentario: string;
  url_audio_comentario?: string;
  numeroQuestao: number;
  questaoNarrada: string | null;
  alternativasNarradas: string | null;
}

const SimuladosRealizar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const exame = searchParams.get("exame");
  const ano = searchParams.get("ano");
  const areas = searchParams.get("areas")?.split(",");
  const quantidade = parseInt(searchParams.get("quantidade") || "20");

  const [showModoDialog, setShowModoDialog] = useState(true);
  const [modoResposta, setModoResposta] = useState<"imediato" | "final" | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respostas, setRespostas] = useState<{ [key: number]: string }>({});
  const [marcadas, setMarcadas] = useState<Set<number>>(new Set());
  const [showFinalizarDialog, setShowFinalizarDialog] = useState(false);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [respostasConfirmadas, setRespostasConfirmadas] = useState<{ [key: number]: boolean }>({});
  const [mostrarComentario, setMostrarComentario] = useState<{ [key: number]: boolean }>({});
  const [comentarioExpandido, setComentarioExpandido] = useState<{ [key: number]: boolean }>({});
  const [animarErro, setAnimarErro] = useState(false);
  const [narracaoAutomatica, setNarracaoAutomatica] = useState(false);
  const [audioAtualTocando, setAudioAtualTocando] = useState<'enunciado' | 'alternativas' | null>(null);
  
  // Estados para questões dinâmicas
  const [questoesState, setQuestoesState] = useState<Questao[]>([]);
  
  // Estados de geração
  const [gerandoComentario, setGerandoComentario] = useState(false);
  const [gerandoNarracao, setGerandoNarracao] = useState(false);
  
  // Estados de áudio
  const [isPlayingComentario, setIsPlayingComentario] = useState(false);
  const [feedbackAudioUrls, setFeedbackAudioUrls] = useState<{ correta?: string; incorreta?: string }>({});
  
  // Refs
  const audioEnunciadoRef = useRef<HTMLAudioElement>(null);
  const audioAlternativasRef = useRef<HTMLAudioElement>(null);
  const audioComentarioRef = useRef<HTMLAudioElement>(null);
  const feedbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const comentarioRef = useRef<HTMLDivElement>(null);

  // ÁUDIO DESATIVADO - Feedback de voz não é mais carregado
  // useEffect para carregar áudios de feedback foi removido

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTempoDecorrido((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Detectar origem TJSP via URL
  const origemTJSP = searchParams.get("origem") === "tjsp";
  const areaFiltro = searchParams.get("area");

  const { data: questoes, isLoading } = useQuery({
    queryKey: ["simulado-questoes", exame, ano, areas, quantidade, origemTJSP, areaFiltro],
    queryFn: async () => {
      if (origemTJSP) {
        let query = supabase.from("SIMULADO-TJSP" as any).select("*");
        if (areaFiltro) {
          query = query.eq('Materia', areaFiltro);
        }
        const { data, error } = await query;
        if (error) throw error;
        
        return data.map((q: any) => ({
          id: q.id,
          area: q.area || "N/A",
          enunciado: q.enunciado || "",
          alternativaA: q.alternativa_a || "",
          alternativaB: q.alternativa_b || "",
          alternativaC: q.alternativa_c || "",
          alternativaD: q.alternativa_d || "",
          alternativaE: q.alternativa_e || "",
          resposta: q.resposta || "",
          comentario: q.comentario || "",
          url_audio_comentario: q.url_audio_comentario || null,
          numeroQuestao: q.numero_questao || 0,
          questaoNarrada: q.questao_narrada || null,
          alternativasNarradas: q.alternativas_narradas || null,
        }));
      }

      let query = supabase.from("SIMULADO-OAB" as any).select("*");
      if (exame && ano) {
        query = query.eq("Exame", exame).eq("Ano", parseInt(ano));
      } else if (areas && areas.length > 0) {
        query = query.in("area", areas).limit(quantidade);
      }

      const { data, error } = await query as any;
      if (error) throw error;

      return data
        .map((q: any) => ({
          id: q.id,
          area: q.area || "N/A",
          enunciado: q["Enunciado"] || "",
          alternativaA: q["Alternativa A"] || "",
          alternativaB: q["Alternativa B"] || "",
          alternativaC: q["Alternativa C"] || "",
          alternativaD: q["Alternativa D"] || "",
          resposta: q.resposta || "",
          comentario: q.comentario || "",
          url_audio_comentario: q.url_audio_comentario || null,
          numeroQuestao: q["Numero da questao"] || 0,
          questaoNarrada: q["Questao Narrada"] || null,
          alternativasNarradas: q["Alternativas Narradas"] || null,
        }))
        .filter((q: any) => q.enunciado && q.alternativaA);
    },
  });

  // Sincronizar questoesState com questoes
  useEffect(() => {
    if (questoes && questoes.length > 0) {
      setQuestoesState(questoes);
    }
  }, [questoes]);

  // Função para parar todos os áudios
  const pausarTodosAudios = useCallback(() => {
    audioEnunciadoRef.current?.pause();
    audioAlternativasRef.current?.pause();
    audioComentarioRef.current?.pause();
    if (feedbackAudioRef.current) {
      feedbackAudioRef.current.pause();
    }
    setIsPlayingComentario(false);
  }, []);

  // Função para tocar áudio
  const tocarAudio = (tipo: 'enunciado' | 'alternativas', audioRef: React.RefObject<HTMLAudioElement>, url: string) => {
    pausarTodosAudios();
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play()
        .then(() => {
          setAudioAtualTocando(tipo);
        })
        .catch(err => console.error(`Erro ao tocar ${tipo}:`, err));
    }
  };

  // Função para tocar feedback beep (Web Audio API)
  const playFeedbackSound = (type: 'correct' | 'error'): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
          resolve();
          return;
        }
        
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = 'sine';
        
        if (type === 'correct') {
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.08);
          oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.16);
        } else {
          oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(262, audioContext.currentTime + 0.12);
        }
        
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.25);
        
        setTimeout(() => {
          audioContext.close();
          resolve();
        }, 300);
      } catch (err) {
        resolve();
      }
    });
  };

  // Função para tocar feedback de voz
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

  // Scroll para o comentário
  const scrollToComentario = () => {
    setTimeout(() => {
      comentarioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // Narrar comentário automaticamente
  const narrarComentarioAutomatico = useCallback(async (questao: Questao) => {
    if (!questao?.comentario || !audioComentarioRef.current) return;
    
    let url = questao.url_audio_comentario;
    
    if (url && audioComentarioRef.current) {
      audioComentarioRef.current.src = url;
      audioComentarioRef.current.play().then(() => {
        setIsPlayingComentario(true);
      }).catch(err => console.log('Autoplay comentário bloqueado:', err));
    }
  }, []);

  // Função para gerar narração do simulado
  const gerarNarracaoSimulado = async (questao: Questao, tipo: 'enunciado' | 'alternativas'): Promise<string | null> => {
    try {
      setGerandoNarracao(true);
      
      const body: any = {
        questaoId: questao.id,
        tipo,
        tabela: origemTJSP ? 'SIMULADO-TJSP' : 'SIMULADO-OAB'
      };

      if (tipo === 'enunciado') {
        body.texto = questao.enunciado;
      } else {
        body.alternativas = {
          A: questao.alternativaA,
          B: questao.alternativaB,
          C: questao.alternativaC,
          D: questao.alternativaD,
          E: questao.alternativaE
        };
      }

      const { data, error } = await supabase.functions.invoke('gerar-audio-simulado', { body });
      
      if (error) throw error;
      
      console.log(`[SimuladosRealizar] Áudio ${tipo} gerado:`, data.url_audio);
      
      // Atualizar estado local
      setQuestoesState(prev => prev.map(q => 
        q.id === questao.id 
          ? { 
              ...q, 
              [tipo === 'enunciado' ? 'questaoNarrada' : 'alternativasNarradas']: data.url_audio 
            }
          : q
      ));
      
      return data.url_audio;
    } catch (err) {
      console.error(`Erro ao gerar áudio ${tipo}:`, err);
      return null;
    } finally {
      setGerandoNarracao(false);
    }
  };

  // Scroll to top quando mudar de questão e tocar narração
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (narracaoAutomatica && questoesState && questoesState[currentIndex]) {
      const questaoAtual = questoesState[currentIndex];
      
      if (questaoAtual.resposta?.toLowerCase() === 'anulada') {
        return;
      }

      pausarTodosAudios();

      // Verificar se precisa gerar narração
      const iniciarNarracao = async () => {
        let urlEnunciado = questaoAtual.questaoNarrada;
        
        // Se não tem narração, gerar
        if (!urlEnunciado) {
          urlEnunciado = await gerarNarracaoSimulado(questaoAtual, 'enunciado');
        }
        
        // Tocar se tem URL
        if (urlEnunciado && audioEnunciadoRef.current) {
          tocarAudio('enunciado', audioEnunciadoRef, urlEnunciado);
        }
      };
      
      iniciarNarracao();
    }
  }, [currentIndex, narracaoAutomatica, questoesState]);

  // Tocar alternativas após enunciado
  const handleEnunciadoEnd = async () => {
    if (narracaoAutomatica && questoesState && questoesState[currentIndex]) {
      const questaoAtual = questoesState[currentIndex];
      
      let urlAlternativas = questaoAtual.alternativasNarradas;
      
      // Se não tem narração das alternativas, gerar
      if (!urlAlternativas) {
        urlAlternativas = await gerarNarracaoSimulado(questaoAtual, 'alternativas');
      }
      
      if (urlAlternativas && audioAlternativasRef.current) {
        tocarAudio('alternativas', audioAlternativasRef, urlAlternativas);
      }
    }
  };

  const handleResposta = (alternativa: string) => {
    if (!questoesState) return;
    const questaoAtual = questoesState[currentIndex];
    if (questaoAtual.resposta?.toLowerCase() === 'anulada') return;
    setRespostas({ ...respostas, [currentIndex]: alternativa });
  };

  const confirmarResposta = async () => {
    if (!questoesState) return;
    
    const questaoAtual = questoesState[currentIndex];
    const respostaUsuario = respostas[currentIndex];
    const acertou = respostaUsuario === questaoAtual.resposta;
    
    pausarTodosAudios();
    
    // 1. Tocar beep
    await playFeedbackSound(acertou ? 'correct' : 'error');
    
    // 2. Tocar feedback de voz
    await playVoiceFeedback(acertou);
    
    // Animar erro
    if (!acertou) {
      setAnimarErro(true);
      setTimeout(() => setAnimarErro(false), 400);
    }
    
    setRespostasConfirmadas({ ...respostasConfirmadas, [currentIndex]: true });
    setMostrarComentario({ ...mostrarComentario, [currentIndex]: true });
    
    // 3. Gerar comentário automaticamente se não existir
    if (!questaoAtual.comentario || !questaoAtual.url_audio_comentario) {
      gerarComentario();
    }
  };

  // Gerar comentário com IA
  const gerarComentario = async () => {
    if (!questoesState || gerandoComentario) return;
    
    const questaoAtual = questoesState[currentIndex];
    setGerandoComentario(true);
    
    try {
      toast.info("Gerando comentário com IA...");
      
      const alternativas = [
        { letra: 'A', texto: questaoAtual.alternativaA },
        { letra: 'B', texto: questaoAtual.alternativaB },
        { letra: 'C', texto: questaoAtual.alternativaC },
        { letra: 'D', texto: questaoAtual.alternativaD },
      ];
      
      const { data, error } = await supabase.functions.invoke('gerar-comentario-oab', {
        body: {
          questaoId: questaoAtual.id,
          enunciado: questaoAtual.enunciado,
          alternativas,
          resposta_correta: questaoAtual.resposta,
          area: questaoAtual.area
        }
      });
      
      if (error) throw error;
      
      // Atualizar estado local
      setQuestoesState(prev => prev.map(q => 
        q.id === questaoAtual.id 
          ? { ...q, comentario: data.comentario, url_audio_comentario: data.url_audio }
          : q
      ));
      
      toast.success("Comentário gerado com sucesso!");
      
      // Narrar automaticamente
      if (data.url_audio && audioComentarioRef.current) {
        audioComentarioRef.current.src = data.url_audio;
        audioComentarioRef.current.play().then(() => {
          setIsPlayingComentario(true);
        }).catch(err => console.log('Erro ao tocar áudio:', err));
      }
      
    } catch (err) {
      console.error('Erro ao gerar comentário:', err);
      toast.error("Erro ao gerar comentário");
    } finally {
      setGerandoComentario(false);
    }
  };

  const handleMarcar = () => {
    const newMarcadas = new Set(marcadas);
    if (marcadas.has(currentIndex)) {
      newMarcadas.delete(currentIndex);
    } else {
      newMarcadas.add(currentIndex);
    }
    setMarcadas(newMarcadas);
  };

  const handleFinalizar = () => {
    if (!questoesState) return;
    
    let acertos = 0;
    let respostasParaResultado: { [key: number]: string } = {};
    
    questoesState.forEach((questao, index) => {
      if (respostas[index]) {
        respostasParaResultado[index] = respostas[index];
        if (respostas[index] === questao.resposta) {
          acertos++;
        }
      }
    });

    const resultadoData = {
      respostas: respostasParaResultado,
      acertos,
      total: questoesState.length,
      tempoDecorrido,
      questoes: questoesState.map(q => ({
        id: q.id,
        area: q.area,
        enunciado: q.enunciado,
        alternativaA: q.alternativaA,
        alternativaB: q.alternativaB,
        alternativaC: q.alternativaC,
        alternativaD: q.alternativaD,
        resposta: q.resposta,
        comentario: q.comentario,
        url_audio_comentario: q.url_audio_comentario,
      })),
    };

    sessionStorage.setItem('simuladoResultado', JSON.stringify(resultadoData));
    navigate('/simulados/resultado');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando questões...</p>
        </div>
      </div>
    );
  }

  if (!questoesState || questoesState.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <p className="text-muted-foreground mb-4">Nenhuma questão encontrada</p>
        <Button onClick={() => navigate(origemTJSP ? '/simulados/tjsp' : '/oab')}>Voltar</Button>
      </div>
    );
  }

  // Dialog de escolha de modo
  if (showModoDialog && modoResposta === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-bold mb-2">Modo de Resposta</h2>
            <p className="text-muted-foreground text-sm">Como você deseja receber o feedback?</p>
          </div>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-start gap-1"
              onClick={() => {
                setModoResposta("imediato");
                setShowModoDialog(false);
              }}
            >
              <span className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Feedback Imediato
              </span>
              <span className="text-xs text-muted-foreground">
                Veja se acertou ou errou após cada questão
              </span>
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-start gap-1"
              onClick={() => {
                setModoResposta("final");
                setShowModoDialog(false);
              }}
            >
              <span className="font-semibold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Resultado Final
              </span>
              <span className="text-xs text-muted-foreground">
                Veja todas as respostas ao finalizar o simulado
              </span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const questaoAtual = questoesState[currentIndex];
  const alternativas = [
    { letra: "A", texto: questaoAtual.alternativaA },
    { letra: "B", texto: questaoAtual.alternativaB },
    { letra: "C", texto: questaoAtual.alternativaC },
    { letra: "D", texto: questaoAtual.alternativaD },
  ];

  if (questaoAtual.alternativaE) {
    alternativas.push({ letra: "E", texto: questaoAtual.alternativaE });
  }

  const progresso = ((currentIndex + 1) / questoesState.length) * 100;
  const isQuestaoAnulada = questaoAtual.resposta?.toLowerCase() === 'anulada';

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      {/* Áudios ocultos */}
      <audio ref={audioEnunciadoRef} onEnded={handleEnunciadoEnd} onPause={() => setAudioAtualTocando(null)} />
      <audio ref={audioAlternativasRef} onEnded={() => setAudioAtualTocando(null)} onPause={() => setAudioAtualTocando(null)} />
      <audio ref={audioComentarioRef} onEnded={() => setIsPlayingComentario(false)} onPause={() => setIsPlayingComentario(false)} />

      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur pb-4 -mx-4 px-4 pt-2">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(origemTJSP ? '/simulados/tjsp' : '/oab')}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {formatTime(tempoDecorrido)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (narracaoAutomatica) pausarTodosAudios();
                setNarracaoAutomatica(!narracaoAutomatica);
              }}
            >
              {narracaoAutomatica ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowFinalizarDialog(true)}>
              Finalizar
            </Button>
          </div>
        </div>
        
        <Progress value={progresso} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Questão {currentIndex + 1} de {questoesState.length}
        </p>
      </div>

      {/* Questão */}
      <div className="max-w-3xl mx-auto space-y-4">
        <Card className={cn("p-4 md:p-6", animarErro && "animate-shake border-destructive")}>
          {/* Área e número */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
              {questaoAtual.area}
            </span>
            <div className="flex items-center gap-2">
              {questaoAtual.numeroQuestao > 0 && (
                <span className="text-xs text-muted-foreground">
                  Q{questaoAtual.numeroQuestao}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarcar}
                className={cn(marcadas.has(currentIndex) && "text-amber-500")}
              >
                <Flag className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Enunciado */}
          <div className="mb-6">
            <div className="flex items-start gap-2">
              <p className="text-sm md:text-base leading-relaxed flex-1">
                {questaoAtual.enunciado}
              </p>
              {gerandoNarracao && !questaoAtual.questaoNarrada ? (
                <div className="flex-shrink-0 p-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    let url = questaoAtual.questaoNarrada;
                    if (!url) {
                      url = await gerarNarracaoSimulado(questaoAtual, 'enunciado');
                    }
                    if (url) {
                      tocarAudio('enunciado', audioEnunciadoRef, url);
                    }
                  }}
                  className="flex-shrink-0"
                >
                  {audioAtualTocando === 'enunciado' ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>

          {/* Questão Anulada */}
          {isQuestaoAnulada && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-amber-500 text-sm font-medium">
                ⚠️ Esta questão foi ANULADA pela banca examinadora
              </p>
            </div>
          )}

          {/* Alternativas */}
          <div className="space-y-2">
            {alternativas.map((alt) => {
              const isSelected = respostas[currentIndex] === alt.letra;
              const isConfirmed = respostasConfirmadas[currentIndex];
              const isCorrect = alt.letra === questaoAtual.resposta;
              const showCorrectAnswer = isConfirmed && modoResposta === "imediato" && isCorrect;
              const showWrongAnswer = isConfirmed && modoResposta === "imediato" && isSelected && !isCorrect;

              return (
                <button
                  key={alt.letra}
                  onClick={() => !isConfirmed && !isQuestaoAnulada && handleResposta(alt.letra)}
                  disabled={isConfirmed || isQuestaoAnulada}
                  className={cn(
                    "w-full p-3 md:p-4 rounded-lg border text-left transition-all",
                    "hover:border-primary/50 hover:bg-primary/5",
                    isSelected && !isConfirmed && "border-primary bg-primary/10",
                    showCorrectAnswer && "border-green-500 bg-green-500/10",
                    showWrongAnswer && "border-destructive bg-destructive/10",
                    isQuestaoAnulada && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-sm font-medium",
                      isSelected && !isConfirmed && "bg-primary text-primary-foreground border-primary",
                      showCorrectAnswer && "bg-green-500 text-white border-green-500",
                      showWrongAnswer && "bg-destructive text-white border-destructive"
                    )}>
                      {alt.letra}
                      {showWrongAnswer && <XCircle className="w-5 h-5 text-white" />}
                      {showCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </span>
                    <span className={cn("text-sm md:text-base break-words", isSelected && "font-medium")}>
                      {alt.texto}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Botão Responder - Modo Imediato */}
          {modoResposta === "imediato" && respostas[currentIndex] && !respostasConfirmadas[currentIndex] && !isQuestaoAnulada && (
            <div className="mt-4">
              <Button onClick={confirmarResposta} className="w-full">
                Responder
              </Button>
            </div>
          )}

          {/* Feedback e Comentário - Modo Imediato */}
          {modoResposta === "imediato" && respostasConfirmadas[currentIndex] && (
            <>
              <div className="mt-4 p-3 md:p-4 bg-muted/50 rounded-lg border border-border">
                <h4 className="font-semibold mb-2 text-sm md:text-base flex items-center gap-2">
                  {respostas[currentIndex] === questaoAtual.resposta ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-green-500">Resposta Correta!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-destructive" />
                      <span className="text-destructive">
                        Resposta Incorreta. Correta: {questaoAtual.resposta}
                      </span>
                    </>
                  )}
                </h4>
              </div>

              {/* Botão Ver Comentário */}
              <div ref={comentarioRef} className="mt-4 space-y-3">
                {!comentarioExpandido[currentIndex] && (
                  <Button
                    onClick={() => setComentarioExpandido({ ...comentarioExpandido, [currentIndex]: true })}
                    variant="outline"
                    className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    disabled={gerandoComentario && !questaoAtual.comentario}
                  >
                    {gerandoComentario && !questaoAtual.comentario ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando comentário...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Ver Comentário
                      </>
                    )}
                  </Button>
                )}

                {/* Comentário Expandido com Animação */}
                <AnimatePresence>
                  {comentarioExpandido[currentIndex] && questaoAtual.comentario && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-blue-400 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Comentário
                          </h4>
                          <div className="flex items-center gap-2">
                            {questaoAtual.url_audio_comentario && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (isPlayingComentario) {
                                    audioComentarioRef.current?.pause();
                                    setIsPlayingComentario(false);
                                  } else if (audioComentarioRef.current && questaoAtual.url_audio_comentario) {
                                    audioComentarioRef.current.src = questaoAtual.url_audio_comentario;
                                    audioComentarioRef.current.play();
                                    setIsPlayingComentario(true);
                                  }
                                }}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                {isPlayingComentario ? <Pause className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setComentarioExpandido({ ...comentarioExpandido, [currentIndex]: false })}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ChevronDown className="w-4 h-4 rotate-180" />
                            </Button>
                          </div>
                        </div>
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
                              strong: ({ children }) => <strong className="text-blue-300 font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="text-blue-200">{children}</em>,
                              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 text-sm">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 text-sm">{children}</ol>,
                              li: ({ children }) => <li className="text-sm">{children}</li>,
                            }}
                          >
                            {questaoAtual.comentario}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </Card>

        {/* Navegação */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button
            onClick={() => setCurrentIndex((prev) => Math.min(questoesState.length - 1, prev + 1))}
            disabled={currentIndex === questoesState.length - 1}
            className="flex-1"
          >
            Próxima
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Dialog de Finalização */}
      <AlertDialog open={showFinalizarDialog} onOpenChange={setShowFinalizarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Simulado?</AlertDialogTitle>
            <AlertDialogDescription>
              Você respondeu {Object.keys(respostas).length} de {questoesState.length} questões.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalizar}>Finalizar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SimuladosRealizar;
