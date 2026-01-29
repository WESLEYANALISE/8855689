import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ChevronRight, Trophy, RotateCcw, BookOpen, Loader2, PlayCircle, StopCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
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
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  resposta_correta: string;
  comentario: string;
  subtema: string;
  exemplo_pratico?: string;
  url_audio?: string;
  url_audio_comentario?: string;
  url_audio_exemplo?: string;
  url_imagem_exemplo?: string;
}

interface QuestoesConcursoProps {
  questoes: Questao[];
  onFinish: () => void;
  area: string;
  tema: string;
  autoplayAudio?: boolean;
}

const QuestoesConcurso = ({ questoes, onFinish, area, tema, autoplayAudio = true }: QuestoesConcursoProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [finished, setFinished] = useState(false);
  const [showExemplo, setShowExemplo] = useState(false);
  const [questoesState, setQuestoesState] = useState<Questao[]>(questoes);
  
  // Estados de áudio do enunciado
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Estados de áudio do comentário
  const [audioComentarioLoading, setAudioComentarioLoading] = useState(false);
  const [isPlayingComentario, setIsPlayingComentario] = useState(false);
  
  // Estados de áudio do exemplo
  const [audioExemploLoading, setAudioExemploLoading] = useState(false);
  const [isPlayingExemplo, setIsPlayingExemplo] = useState(false);
  
  // Estados gerais
  const [shakeError, setShakeError] = useState(false);
  const [narrationLoading, setNarrationLoading] = useState(false);
  // Removido: imagemLoading (não gera mais imagens)
  
  // Estados do modo automático
  const [modoAutomatico, setModoAutomatico] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState<'enunciado' | 'comentario' | 'exemplo' | 'aguardando' | null>(null);
  const autoModeRef = useRef<boolean>(false);
  const pausadoPorInteracaoRef = useRef<boolean>(false);
  
  // URLs de áudio de feedback de voz (cache)
  const [feedbackAudioUrls, setFeedbackAudioUrls] = useState<{ correta?: string; incorreta?: string }>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const comentarioRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioComentarioRef = useRef<HTMLAudioElement>(null);
  const audioExemploRef = useRef<HTMLAudioElement>(null);
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const feedbackAudioRef = useRef<HTMLAudioElement | null>(null);

  // Carregar URLs de áudio de feedback de voz ao montar
  useEffect(() => {
    const carregarFeedbackAudios = async () => {
      try {
        const [resCorreta, resIncorreta] = await Promise.all([
          supabase.functions.invoke('gerar-audio-feedback', { body: { tipo: 'correta' } }),
          supabase.functions.invoke('gerar-audio-feedback', { body: { tipo: 'incorreta' } })
        ]);
        
        setFeedbackAudioUrls({
          correta: resCorreta.data?.url_audio,
          incorreta: resIncorreta.data?.url_audio
        });
        console.log('[QuestoesConcurso] Áudios de feedback carregados');
      } catch (err) {
        console.error('[QuestoesConcurso] Erro ao carregar áudios de feedback:', err);
      }
    };
    
    carregarFeedbackAudios();
  }, []);

  // Função para tocar som de feedback instantâneo (beep via Web Audio API)
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
          // Som de acerto: acordes ascendentes (alegre)
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // Dó
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.08); // Mi
          oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.16); // Sol
        } else {
          // Som de erro: tom descendente (triste)
          oscillator.frequency.setValueAtTime(330, audioContext.currentTime); // Mi
          oscillator.frequency.setValueAtTime(262, audioContext.currentTime + 0.12); // Dó grave
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
        console.error('Erro ao tocar som:', err);
        resolve();
      }
    });
  };
  
  // Função para reproduzir feedback de voz ("Resposta correta!" ou "Resposta incorreta!")
  const playVoiceFeedback = (isCorrect: boolean): Promise<void> => {
    return new Promise((resolve) => {
      const url = isCorrect ? feedbackAudioUrls.correta : feedbackAudioUrls.incorreta;
      
      if (!url) {
        console.log('[QuestoesConcurso] URL de feedback de voz não disponível');
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

  // Função para scroll suave até o comentário
  const scrollToComentario = () => {
    setTimeout(() => {
      comentarioRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 100);
  };

  const currentQuestion = questoesState[currentIndex];
  const progress = ((currentIndex + 1) / questoesState.length) * 100;
  const isCorrect = selectedAnswer === currentQuestion?.resposta_correta;

  // Shake animation variants
  const shakeVariants = {
    shake: {
      x: [0, -8, 8, -8, 8, -4, 4, 0],
      transition: { duration: 0.5 }
    },
    idle: { x: 0 }
  };

  // Função para narrar texto dinamicamente (usado apenas para feedback automático)
  const narrarTexto = useCallback(async (texto: string): Promise<void> => {
    return new Promise(async (resolve) => {
      try {
        if (narrationAudioRef.current) {
          narrationAudioRef.current.pause();
          narrationAudioRef.current = null;
        }

        setNarrationLoading(true);
        
        const { data, error } = await supabase.functions.invoke('gerar-narracao', {
          body: { texto }
        });

        if (error || !data?.audioBase64) {
          console.error('Erro ao gerar narração:', error);
          setNarrationLoading(false);
          resolve();
          return;
        }

        const audioUrl = `data:audio/mpeg;base64,${data.audioBase64}`;
        const audio = new Audio(audioUrl);
        narrationAudioRef.current = audio;
        
        audio.onended = () => {
          setNarrationLoading(false);
          resolve();
        };
        
        audio.onerror = () => {
          setNarrationLoading(false);
          resolve();
        };

        await audio.play();
      } catch (err) {
        console.error('Erro na narração:', err);
        setNarrationLoading(false);
        resolve();
      }
    });
  }, []);

  // Scroll para o topo ao mudar de questão
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);

  // Função para parar todos os áudios
  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (audioComentarioRef.current) {
      audioComentarioRef.current.pause();
      setIsPlayingComentario(false);
    }
    if (audioExemploRef.current) {
      audioExemploRef.current.pause();
      setIsPlayingExemplo(false);
    }
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current = null;
    }
    if (feedbackAudioRef.current) {
      feedbackAudioRef.current.pause();
      feedbackAudioRef.current = null;
    }
  }, []);

  // Removido: geração de imagem do exemplo prático (exibe apenas texto)

  // Gerar áudio genérico (enunciado, comentário ou exemplo)
  const gerarAudioGenerico = useCallback(async (questaoId: number, texto: string, tipo: 'enunciado' | 'comentario' | 'exemplo') => {
    const setLoading = tipo === 'enunciado' ? setAudioLoading 
      : tipo === 'comentario' ? setAudioComentarioLoading 
      : setAudioExemploLoading;

    setLoading(true);
    console.log(`Gerando áudio ${tipo} para questão ${questaoId}...`);

    // Adicionar prefixo "Exemplo prático" ou "Explicação" conforme o tipo
    const textoParaNarrar = tipo === 'exemplo' 
      ? `Exemplo prático. ${texto}` 
      : tipo === 'comentario' 
        ? `Explicação. ${texto}` 
        : texto;

    try {
      const { data, error } = await supabase.functions.invoke('gerar-audio-generico', {
        body: { questaoId, texto: textoParaNarrar, tipo }
      });

      if (error) {
        console.error(`Erro ao gerar áudio ${tipo}:`, error);
        setLoading(false);
        return null;
      }

      if (data?.url_audio) {
        const coluna = tipo === 'enunciado' ? 'url_audio' 
          : tipo === 'comentario' ? 'url_audio_comentario' 
          : 'url_audio_exemplo';
        
        setQuestoesState(prev => prev.map(q => 
          q.id === questaoId ? { ...q, [coluna]: data.url_audio } : q
        ));
        console.log(`Áudio ${tipo} gerado: ${data.url_audio}, cached: ${data.cached}`);
        return data.url_audio;
      }
    } catch (err) {
      console.error(`Erro ao chamar função de áudio ${tipo}:`, err);
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  // Função para narrar comentário automaticamente
  const narrarComentarioAutomatico = useCallback(async () => {
    if (!currentQuestion?.comentario || !audioComentarioRef.current) return;
    
    let url = currentQuestion.url_audio_comentario;
    
    // Se não tem URL, gerar
    if (!url) {
      url = await gerarAudioGenerico(currentQuestion.id, currentQuestion.comentario, 'comentario');
    }
    
    // Reproduzir automaticamente
    if (url && audioComentarioRef.current) {
      audioComentarioRef.current.src = url;
      audioComentarioRef.current.play().then(() => {
        setIsPlayingComentario(true);
      }).catch((err) => {
        console.log('Autoplay comentário bloqueado:', err);
      });
    }
  }, [currentQuestion, gerarAudioGenerico]);

  // Pausar modo automático quando drawer abrir
  useEffect(() => {
    if (showExemplo && currentQuestion?.exemplo_pratico) {
      // Pausar modo automático se estiver ativo
      if (modoAutomatico) {
        autoModeRef.current = false;
        pausadoPorInteracaoRef.current = true;
      }
      
      stopAllAudio();
    }
  }, [showExemplo, currentQuestion?.id]);

  // Retomar modo automático quando fechar drawer
  useEffect(() => {
    if (!showExemplo && pausadoPorInteracaoRef.current && modoAutomatico) {
      // Retomar após fechar o drawer
      pausadoPorInteracaoRef.current = false;
      autoModeRef.current = true;
      // O modo automático vai continuar de onde parou
    }
  }, [showExemplo, modoAutomatico]);

  // ============ MODO AUTOMÁTICO ============

  // Aguardar tempo em ms
  const aguardarMs = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // Reproduz áudio e retorna Promise quando terminar
  const reproduzirAudioEAguardar = useCallback((url: string, audioElement: HTMLAudioElement | null): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioElement || !url) return resolve();
      
      const onEnded = () => {
        audioElement.removeEventListener('ended', onEnded);
        audioElement.removeEventListener('error', onError);
        resolve();
      };
      
      const onError = () => {
        audioElement.removeEventListener('ended', onEnded);
        audioElement.removeEventListener('error', onError);
        resolve();
      };
      
      audioElement.addEventListener('ended', onEnded);
      audioElement.addEventListener('error', onError);
      
      audioElement.src = url;
      audioElement.play().catch(() => {
        audioElement.removeEventListener('ended', onEnded);
        audioElement.removeEventListener('error', onError);
        resolve();
      });
    });
  }, []);

  // Função para obter ou gerar áudio
  const obterOuGerarAudio = useCallback(async (questao: Questao, tipo: 'enunciado' | 'comentario' | 'exemplo'): Promise<string | null> => {
    if (tipo === 'enunciado') {
      if (questao.url_audio) return questao.url_audio;
      return await gerarAudioGenerico(questao.id, questao.enunciado, 'enunciado');
    }
    if (tipo === 'comentario') {
      if (questao.url_audio_comentario) return questao.url_audio_comentario;
      return await gerarAudioGenerico(questao.id, questao.comentario, 'comentario');
    }
    if (tipo === 'exemplo' && questao.exemplo_pratico) {
      if (questao.url_audio_exemplo) return questao.url_audio_exemplo;
      return await gerarAudioGenerico(questao.id, questao.exemplo_pratico, 'exemplo');
    }
    return null;
  }, [gerarAudioGenerico]);

  // Pré-carregar áudios das próximas questões
  const preCarregarProximos = useCallback(async (indiceAtual: number) => {
    for (let i = indiceAtual + 1; i <= Math.min(indiceAtual + 2, questoesState.length - 1); i++) {
      if (!autoModeRef.current) break;
      const q = questoesState[i];
      if (!q.url_audio) {
        await gerarAudioGenerico(q.id, q.enunciado, 'enunciado');
      }
      if (!q.url_audio_comentario && q.comentario) {
        await gerarAudioGenerico(q.id, q.comentario, 'comentario');
      }
      if (q.exemplo_pratico && !q.url_audio_exemplo) {
        await gerarAudioGenerico(q.id, q.exemplo_pratico, 'exemplo');
      }
    }
  }, [questoesState, gerarAudioGenerico]);

  // Função principal de narração automática
  const iniciarModoAutomatico = useCallback(async () => {
    setModoAutomatico(true);
    autoModeRef.current = true;
    pausadoPorInteracaoRef.current = false;
    
    stopAllAudio();
    
    // Iniciar pré-carregamento em background
    preCarregarProximos(currentIndex);
    
    for (let i = currentIndex; i < questoesState.length && autoModeRef.current; i++) {
      // Atualizar índice
      if (i !== currentIndex) {
        setCurrentIndex(i);
        setSelectedAnswer(null);
        setShowResult(false);
        setShowExemplo(false);
        await aguardarMs(300);
      }
      
      const questao = questoesState[i];
      
      // ETAPA 1: Narrar enunciado
      if (!autoModeRef.current) break;
      setEtapaAtual('enunciado');
      const urlEnunciado = await obterOuGerarAudio(questao, 'enunciado');
      if (urlEnunciado && autoModeRef.current) {
        setIsPlaying(true);
        await reproduzirAudioEAguardar(urlEnunciado, audioRef.current);
        setIsPlaying(false);
      }
      
      if (!autoModeRef.current) break;
      
      // ETAPA 2: Responder automaticamente (marca a correta)
      setEtapaAtual('aguardando');
      await aguardarMs(800);
      
      if (!autoModeRef.current) break;
      
      // Marcar resposta correta
      setSelectedAnswer(questao.resposta_correta);
      setShowResult(true);
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      
      // Atualiza estatísticas no banco
      try {
        await supabase.rpc("incrementar_stats_questao", {
          p_questao_id: questao.id,
          p_correta: true
        });
      } catch (error) {
        console.error("Erro ao atualizar stats:", error);
      }
      
      await aguardarMs(500);
      
      if (!autoModeRef.current) break;
      
      // ETAPA 3: Narrar comentário
      setEtapaAtual('comentario');
      const urlComentario = await obterOuGerarAudio(questao, 'comentario');
      if (urlComentario && autoModeRef.current) {
        setIsPlayingComentario(true);
        await reproduzirAudioEAguardar(urlComentario, audioComentarioRef.current);
        setIsPlayingComentario(false);
      }
      
      if (!autoModeRef.current) break;
      
      // ETAPA 4: Narrar exemplo (se existir)
      if (questao.exemplo_pratico) {
        setEtapaAtual('exemplo');
        const urlExemplo = await obterOuGerarAudio(questao, 'exemplo');
        if (urlExemplo && autoModeRef.current) {
          setIsPlayingExemplo(true);
          await reproduzirAudioEAguardar(urlExemplo, audioExemploRef.current);
          setIsPlayingExemplo(false);
        }
      }
      
      if (!autoModeRef.current) break;
      
      // Pequena pausa antes da próxima
      await aguardarMs(1000);
      
      // Pré-carregar próximas questões
      if (autoModeRef.current) {
        preCarregarProximos(i);
      }
    }
    
    // Finalizar modo automático
    setModoAutomatico(false);
    autoModeRef.current = false;
    setEtapaAtual(null);
    
    // Se terminou todas as questões
    if (currentIndex >= questoesState.length - 1 || !autoModeRef.current) {
      setFinished(true);
    }
  }, [currentIndex, questoesState, stopAllAudio, obterOuGerarAudio, reproduzirAudioEAguardar, preCarregarProximos]);

  // Parar modo automático
  const pararModoAutomatico = useCallback(() => {
    autoModeRef.current = false;
    setModoAutomatico(false);
    setEtapaAtual(null);
    stopAllAudio();
  }, [stopAllAudio]);

  // ============ FIM MODO AUTOMÁTICO ============

  // Play/toggle áudio do enunciado
  const toggleAudioEnunciado = async () => {
    if (!audioRef.current) return;

    if (audioComentarioRef.current) {
      audioComentarioRef.current.pause();
      setIsPlayingComentario(false);
    }
    if (audioExemploRef.current) {
      audioExemploRef.current.pause();
      setIsPlayingExemplo(false);
    }
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      let url = currentQuestion?.url_audio;
      
      if (!url && !audioLoading) {
        url = await gerarAudioGenerico(currentQuestion.id, currentQuestion.enunciado, 'enunciado');
      }
      
      if (url) {
        if (audioRef.current.src !== url) {
          audioRef.current.src = url;
        }
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(console.error);
      }
    }
  };

  // Play/toggle áudio do comentário
  const toggleAudioComentario = async () => {
    if (!audioComentarioRef.current) return;

    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (audioExemploRef.current) {
      audioExemploRef.current.pause();
      setIsPlayingExemplo(false);
    }
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
    }

    if (isPlayingComentario) {
      audioComentarioRef.current.pause();
      setIsPlayingComentario(false);
    } else {
      let url = currentQuestion?.url_audio_comentario;
      
      if (!url && !audioComentarioLoading && currentQuestion?.comentario) {
        url = await gerarAudioGenerico(currentQuestion.id, currentQuestion.comentario, 'comentario');
      }
      
      if (url) {
        if (audioComentarioRef.current.src !== url) {
          audioComentarioRef.current.src = url;
        }
        audioComentarioRef.current.play().then(() => {
          setIsPlayingComentario(true);
        }).catch(console.error);
      }
    }
  };

  // Play/toggle áudio do exemplo
  const toggleAudioExemplo = async () => {
    if (!audioExemploRef.current) return;

    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (audioComentarioRef.current) {
      audioComentarioRef.current.pause();
      setIsPlayingComentario(false);
    }
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
    }

    if (isPlayingExemplo) {
      audioExemploRef.current.pause();
      setIsPlayingExemplo(false);
    } else {
      let url = currentQuestion?.url_audio_exemplo;
      
      if (!url && !audioExemploLoading && currentQuestion?.exemplo_pratico) {
        url = await gerarAudioGenerico(currentQuestion.id, currentQuestion.exemplo_pratico, 'exemplo');
      }
      
      if (url) {
        if (audioExemploRef.current.src !== url) {
          audioExemploRef.current.src = url;
        }
        audioExemploRef.current.play().then(() => {
          setIsPlayingExemplo(true);
        }).catch(console.error);
      }
    }
  };

  const alternatives = [
    { key: "A", value: currentQuestion?.alternativa_a },
    { key: "B", value: currentQuestion?.alternativa_b },
    { key: "C", value: currentQuestion?.alternativa_c },
    { key: "D", value: currentQuestion?.alternativa_d },
  ];

  const handleSelectAnswer = async (answer: string) => {
    if (showResult) return;
    
    // Se está em modo automático, parar
    if (modoAutomatico) {
      pararModoAutomatico();
    }
    
    stopAllAudio();
    
    setSelectedAnswer(answer);
    setShowResult(true);

    const correct = answer === currentQuestion.resposta_correta;
    
    // Animação de erro se incorreto
    if (!correct) {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
    }
    
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1)
    }));

    // 1. Scroll imediato para o comentário (ANTES dos áudios)
    scrollToComentario();

    // 2. Som de beep (acerto/erro)
    await playFeedbackSound(correct ? 'correct' : 'error');
    
    // 3. Voz "Parabéns, você acertou!" ou "Ops, você errou."
    await playVoiceFeedback(correct);

    // Atualizar estatísticas globais da questão (em background)
    supabase.rpc("incrementar_stats_questao", {
      p_questao_id: currentQuestion.id,
      p_correta: correct
    }).then(({ error }) => {
      if (error) console.error("Erro ao atualizar stats globais:", error);
    });

    // Registrar estatísticas do usuário (em background)
    supabase.rpc("registrar_resposta_usuario", {
      p_area: area,
      p_tema: tema,
      p_correta: correct
    }).then(({ error }) => {
      if (error) console.error("Erro ao registrar stats do usuário:", error);
    });
    
    // Não narrar comentário automaticamente - usuário pode usar botão manual
  };

  const handleNext = () => {
    stopAllAudio();
    setNarrationLoading(false);
    
    if (currentIndex < questoesState.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExemplo(false);
    } else {
      setFinished(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      stopAllAudio();
      setNarrationLoading(false);
      setCurrentIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExemplo(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore({ correct: 0, wrong: 0 });
    setFinished(false);
    setShowExemplo(false);
    stopAllAudio();
    pararModoAutomatico();
  };

  if (finished) {
    const percentage = Math.round((score.correct / questoesState.length) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex flex-col items-center justify-center p-6 gap-6"
      >
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center",
          percentage >= 70 ? "bg-emerald-500/20" : percentage >= 50 ? "bg-amber-500/20" : "bg-destructive/20"
        )}>
          <Trophy className={cn(
            "w-10 h-10",
            percentage >= 70 ? "text-emerald-500" : percentage >= 50 ? "text-amber-500" : "text-destructive"
          )} />
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Quiz Finalizado!</h2>
          <p className="text-muted-foreground mb-4">{tema}</p>
        </div>

        <div className="flex gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-emerald-500">{score.correct}</div>
            <div className="text-sm text-muted-foreground">Acertos</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-destructive">{score.wrong}</div>
            <div className="text-sm text-muted-foreground">Erros</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">{percentage}%</div>
            <div className="text-sm text-muted-foreground">Aproveitamento</div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Refazer
          </Button>
          <Button onClick={onFinish}>
            Continuar
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div 
        ref={containerRef} 
        className="flex-1 flex flex-col overflow-y-auto"
        variants={shakeVariants}
        animate={shakeError ? "shake" : "idle"}
      >
        {/* Progress */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Questão {currentIndex + 1} de {questoesState.length}
            </span>
            <span className="font-medium">
              {score.correct} ✓ / {score.wrong} ✗
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Subtema */}
              {currentQuestion?.subtema && (
                <div className="text-xs text-yellow-500 font-medium mb-2 uppercase tracking-wide">
                  {currentQuestion.subtema}
                </div>
              )}

              {/* Enunciado */}
              <div className="bg-card rounded-xl p-4 border mb-4">
                <p className="text-sm leading-relaxed">{currentQuestion?.enunciado}</p>
              </div>

              {/* Alternativas */}
              <div className="space-y-2">
                {alternatives.map((alt, index) => {
                  const isSelected = selectedAnswer === alt.key;
                  const isCorrectAnswer = alt.key === currentQuestion?.resposta_correta;
                  
                  let bgClass = "bg-card hover:bg-accent";
                  let borderClass = "border-border";
                  
                  if (showResult) {
                    if (isCorrectAnswer) {
                      bgClass = "bg-emerald-500/10";
                      borderClass = "border-emerald-500";
                    } else if (isSelected && !isCorrectAnswer) {
                      bgClass = "bg-destructive/10";
                      borderClass = "border-destructive";
                    }
                  } else if (isSelected) {
                    bgClass = "bg-primary/10";
                    borderClass = "border-primary";
                  }

                  return (
                    <motion.button
                      key={alt.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.2 }}
                      onClick={() => handleSelectAnswer(alt.key)}
                      disabled={showResult || modoAutomatico}
                      className={cn(
                        "w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left",
                        bgClass,
                        borderClass,
                        !showResult && !modoAutomatico && "active:scale-[0.98]"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0",
                        showResult && isCorrectAnswer 
                          ? "bg-emerald-500 text-white" 
                          : showResult && isSelected && !isCorrectAnswer
                          ? "bg-destructive text-white"
                          : isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}>
                        {showResult && isCorrectAnswer ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : showResult && isSelected && !isCorrectAnswer ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          alt.key
                        )}
                      </div>
                      <span className="text-sm flex-1 pt-1">{alt.value}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Comentário */}
              {showResult && currentQuestion?.comentario && (
                <motion.div
                  ref={comentarioRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-4 p-4 rounded-xl border",
                    isCorrect ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-amber-500" />
                      )}
                      <span className="font-semibold text-sm">
                        {isCorrect ? "Parabéns! Resposta correta!" : "Resposta incorreta"}
                      </span>
                      {narrationLoading && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Botão Ver Exemplo */}
                    {currentQuestion?.exemplo_pratico && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setShowExemplo(true)}
                        className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/40"
                      >
                        <BookOpen className="w-4 h-4 mr-1" />
                        Ver Exemplo
                      </Button>
                    )}
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {currentQuestion.comentario
                      ?.replace(/\s*---\s*/g, '\n\n')
                      ?.replace(/\\n/g, '\n')
                      ?.split('\n\n')
                      .map((paragrafo, idx) => {
                        const letraCorreta = currentQuestion.resposta_correta?.toUpperCase();
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
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        {showResult && !modoAutomatico && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-t bg-background"
          >
            <div className="flex gap-2">
              {/* Botão Voltar - só aparece se não for a primeira questão */}
              {currentIndex > 0 && (
                <Button 
                  variant="outline" 
                  size="default"
                  onClick={handlePrevious}
                  className="shrink-0"
                >
                  <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                  Voltar
                </Button>
              )}
              
              {/* Botão Próxima/Finalizar */}
              <Button onClick={handleNext} className="flex-1" size="lg">
                {currentIndex < questoesState.length - 1 ? (
                  <>
                    Próxima Questão
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    Ver Resultado
                    <Trophy className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Audio elements */}
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
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
            {/* Texto do exemplo (apenas texto, sem imagem) */}
            <div className="bg-muted/50 rounded-xl p-4 border">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {currentQuestion?.exemplo_pratico}
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
    </>
  );
};

export default QuestoesConcurso;
