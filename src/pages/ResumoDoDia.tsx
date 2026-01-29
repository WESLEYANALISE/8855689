import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, Loader2, Mic, RefreshCw, FileText, BookOpen, ExternalLink, Newspaper, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDeviceType } from "@/hooks/use-device-type";
import { ScrollArea } from "@/components/ui/scroll-area";

// Vídeo de introdução para boletim jurídico
import introVideoJuridico from "@/assets/intro-boletim-juridico.mp4";

// URL da música de fundo
const BACKGROUND_MUSIC_URL = "https://files.catbox.moe/08cl4u.mp3";

interface EmojiData {
  posicao: number;
  emoji: string;
}

interface Slide {
  ordem: number;
  titulo: string;
  subtitulo?: string;
  imagem_url: string;
  texto_narrado: string;
  resumo_curto?: string;
  noticia_id: number;
  hora_publicacao?: string;
  emojis?: EmojiData[];
  url_audio?: string;
}

interface Termo {
  termo: string;
  definicao: string;
}

interface ResumoDiario {
  id: string;
  tipo: string;
  data: string;
  texto_resumo: string;
  slides: Slide[];
  url_audio: string;
  url_audio_abertura?: string;
  url_audio_fechamento?: string;
  total_noticias: number;
  hora_corte: string;
  termos?: Termo[];
}

export default function ResumoDoDia() {
  const { tipo } = useParams<{ tipo: string }>();
  const [searchParams] = useSearchParams();
  const dataParam = searchParams.get('data');
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  
  // Refs para áudio e vídeo
  const audioRef = useRef<HTMLAudioElement>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement>(null);
  const transitionAudioRef = useRef<HTMLAudioElement>(null);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlayingTransition, setIsPlayingTransition] = useState(false);
  
  // Estado para vídeo de introdução (boletim jurídico)
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  
  const [resumo, setResumo] = useState<ResumoDiario | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const [activeTab, setActiveTab] = useState<'resumos' | 'termos' | 'noticia'>('resumos');
  const [noticiaSubTab, setNoticiaSubTab] = useState<'formatada' | 'original' | 'analise'>('formatada');
  const [visibleEmojis, setVisibleEmojis] = useState<{ emoji: string; id: number; x: number; y: number }[]>([]);
  const lastEmojiTimeRef = useRef<number>(0);

  // Estados para fila de áudios
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentSegmentDuration, setCurrentSegmentDuration] = useState(0);
  const [accumulatedProgress, setAccumulatedProgress] = useState(0);
  const pendingAudioIndexRef = useRef<number | null>(null);

  // Estados para progresso de geração
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [currentGenSlide, setCurrentGenSlide] = useState(0);
  const [totalGenSlides, setTotalGenSlides] = useState(0);

  useEffect(() => {
    fetchResumo();
  }, [tipo, dataParam]);

  // Pré-carregar vídeo de introdução para reprodução instantânea (boletim jurídico)
  useEffect(() => {
    if (tipo === 'juridica') {
      const video = document.createElement('video');
      video.src = introVideoJuridico;
      video.preload = 'auto';
      video.muted = true;
      video.load(); // Força o download imediato
    }
  }, [tipo]);

  // Montar fila de áudios quando resumo carregar
  useEffect(() => {
    if (resumo) {
      // Verificar se tem áudios individuais (novo formato)
      const hasIndividualAudios = resumo.url_audio_abertura && resumo.slides?.some(s => s.url_audio);
      
      if (hasIndividualAudios) {
        const queue: string[] = [];
        
        // Abertura
        if (resumo.url_audio_abertura) {
          queue.push(resumo.url_audio_abertura);
        }
        
        // Cada slide
        resumo.slides.forEach(slide => {
          if (slide.url_audio) {
            queue.push(slide.url_audio);
          }
        });
        
        // Fechamento
        if (resumo.url_audio_fechamento) {
          queue.push(resumo.url_audio_fechamento);
        }
        
        setAudioQueue(queue);
        console.log(`Fila de áudios montada: ${queue.length} segmentos`);
        
        // Calcular duração total de todos os áudios
        const calculateTotalDuration = async () => {
          let total = 0;
          for (const url of queue) {
            try {
              const audio = new Audio(url);
              await new Promise<void>((resolve) => {
                audio.addEventListener('loadedmetadata', () => {
                  total += audio.duration || 0;
                  resolve();
                });
                audio.addEventListener('error', () => resolve());
              });
            } catch {
              // Ignora erros
            }
          }
          setTotalDuration(total);
        };
        calculateTotalDuration();
      } else {
        // Fallback para formato antigo (áudio único)
        if (resumo.url_audio) {
          setAudioQueue([resumo.url_audio]);
        }
      }
    }
  }, [resumo]);

  // Efeito para mostrar emojis durante a reprodução
  useEffect(() => {
    if (!isPlaying || !resumo || !audioRef.current || !currentSegmentDuration || showIntroVideo) return;
    
    const currentSlideData = resumo.slides[currentSlide];
    if (!currentSlideData?.emojis?.length) return;

    const currentTime = audioRef.current.currentTime;
    const slideProgress = currentTime / currentSegmentDuration;

    currentSlideData.emojis.forEach((emojiData) => {
      const threshold = 0.08;
      if (Math.abs(slideProgress - emojiData.posicao) < threshold) {
        if (Date.now() - lastEmojiTimeRef.current < 500) return;
        
        const newEmoji = {
          emoji: emojiData.emoji,
          id: Date.now(),
          x: Math.random() > 0.5 ? (2 + Math.random() * 10) : (85 + Math.random() * 13),
          y: 15 + Math.random() * 55
        };
        
        setVisibleEmojis(prev => [...prev, newEmoji]);
        lastEmojiTimeRef.current = Date.now();
        
        setTimeout(() => {
          setVisibleEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
        }, 2500);
      }
    });
  }, [isPlaying, progress, currentSlide, resumo, currentSegmentDuration]);

  const fetchResumo = async () => {
    try {
      let dataAlvo: string;
      
      if (dataParam && dataParam !== 'ontem' && /^\d{4}-\d{2}-\d{2}$/.test(dataParam)) {
        dataAlvo = dataParam;
      } else {
        const hoje = new Date();
        hoje.setHours(hoje.getHours() - 3);
        
        if (dataParam === 'ontem') {
          hoje.setDate(hoje.getDate() - 1);
        }
        
        dataAlvo = hoje.toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('resumos_diarios')
        .select('*')
        .eq('tipo', tipo)
        .eq('data', dataAlvo)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const slidesData = data.slides as unknown;
        const termosData = (data as any).termos as unknown;
        const slidesOrdenados = Array.isArray(slidesData) 
          ? (slidesData as Slide[]).sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
          : [];
        setResumo({
          ...data,
          slides: slidesOrdenados,
          termos: Array.isArray(termosData) ? (termosData as Termo[]) : []
        });
      }
    } catch (error) {
      console.error('Erro ao buscar resumo:', error);
    } finally {
      setLoading(false);
    }
  };

  const gerarResumo = async () => {
    setGenerating(true);
    setGenerationProgress(0);
    setGenerationMessage('Iniciando geração...');
    setCurrentGenSlide(0);
    setTotalGenSlides(0);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/gerar-resumo-diario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ tipo, data: dataParam, forceRegenerate: true, stream: true })
      });

      if (!response.ok) throw new Error('Erro na requisição');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream não disponível');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          
          const eventMatch = line.match(/event: (\w+)/);
          const dataMatch = line.match(/data: (.+)/s);
          
          if (eventMatch && dataMatch) {
            const event = eventMatch[1];
            try {
              const data = JSON.parse(dataMatch[1]);
              
              if (event === 'progress') {
                setGenerationProgress(data.progress || 0);
                setGenerationMessage(data.message || '');
                if (data.currentSlide) setCurrentGenSlide(data.currentSlide);
                if (data.totalSlides) setTotalGenSlides(data.totalSlides);
              } else if (event === 'complete') {
                if (data.resumo) {
                  const slidesOrdenados = Array.isArray(data.resumo.slides) 
                    ? data.resumo.slides.sort((a: Slide, b: Slide) => (a.ordem || 0) - (b.ordem || 0))
                    : [];
                  setResumo({
                    ...data.resumo,
                    slides: slidesOrdenados,
                    termos: Array.isArray(data.resumo.termos) ? data.resumo.termos : []
                  });
                }
                toast.success('Boletim gerado com sucesso!');
              } else if (event === 'error') {
                toast.error(data.message || 'Erro ao gerar boletim');
              }
            } catch (e) {
              console.error('Erro ao parsear SSE:', e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao gerar resumo:', error);
      toast.error('Erro ao gerar resumo');
    } finally {
      setGenerating(false);
      setGenerationProgress(0);
      setGenerationMessage('');
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      backgroundAudioRef.current?.pause();
    } else {
      // Carregar primeiro áudio se necessário
      if (audioQueue.length > 0 && !audioRef.current.src) {
        audioRef.current.src = audioQueue[0];
      }
      audioRef.current.play().catch(err => {
        console.error('Erro ao reproduzir áudio:', err);
        toast.error('Erro ao reproduzir áudio');
      });
      // Iniciar música de fundo
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.volume = 0.12;
        backgroundAudioRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(!isPlaying);
  };

  // Quando um segmento de áudio termina
  const handleAudioEnded = () => {
    const nextIndex = currentAudioIndex + 1;
    
    // Se era o áudio de abertura (index 0) e é boletim jurídico, esconder vídeo de intro
    if (currentAudioIndex === 0 && tipo === 'juridica' && resumo?.url_audio_abertura) {
      setShowIntroVideo(false);
    }
    
    // Acumular tempo do segmento que acabou
    setAccumulatedProgress(prev => prev + currentSegmentDuration);
    
    if (nextIndex < audioQueue.length) {
      const hasAbertura = resumo?.url_audio_abertura ? 1 : 0;
      const hasFechamento = resumo?.url_audio_fechamento ? 1 : 0;
      const slideIndex = nextIndex - hasAbertura;
      
      // Verificar se o PRÓXIMO áudio é um slide (não é fechamento)
      const isNextSlide = nextIndex >= hasAbertura && 
                          nextIndex < audioQueue.length - hasFechamento;
      
      // Atualizar slide visualmente
      if (slideIndex >= 0 && slideIndex < (resumo?.slides.length || 0)) {
        setCurrentSlide(slideIndex);
      }
      
      setCurrentAudioIndex(nextIndex);
      pendingAudioIndexRef.current = nextIndex;
      
      // Tocar transição sempre que o próximo for um slide
      if (isNextSlide && transitionAudioRef.current) {
        setIsPlayingTransition(true);
        transitionAudioRef.current.currentTime = 0;
        transitionAudioRef.current.play().catch(() => {
          // Se falhar, continuar sem transição
          proceedToNextAudio(nextIndex);
        });
      } else {
        // Próximo é fechamento, ir direto
        proceedToNextAudio(nextIndex);
      }
    } else {
      // Terminou todos os áudios
      setIsPlaying(false);
      setCurrentAudioIndex(0);
      setAccumulatedProgress(0);
      setShowIntroVideo(false);
      pendingAudioIndexRef.current = null;
      
      // Parar música de fundo
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current.currentTime = 0;
      }
    }
  };

  // Função para prosseguir para o próximo áudio (recebe índice como parâmetro)
  const proceedToNextAudio = (index: number) => {
    if (audioRef.current && index < audioQueue.length) {
      audioRef.current.src = audioQueue[index];
      audioRef.current.play().catch(console.error);
    }
  };

  // Quando o áudio de transição termina
  const handleTransitionEnded = () => {
    setIsPlayingTransition(false);
    // Usar o índice salvo na ref (evita problema de closure)
    if (pendingAudioIndexRef.current !== null) {
      proceedToNextAudio(pendingAudioIndexRef.current);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    
    const currentTime = audioRef.current.currentTime;
    const segmentDuration = audioRef.current.duration || 0;
    
    setProgress(currentTime);
    setCurrentSegmentDuration(segmentDuration);
    
    // Para o formato antigo (áudio único), manter lógica de sincronização por tempo
    if (audioQueue.length === 1 && resumo?.slides.length) {
      const totalDur = segmentDuration;
      const totalSlides = resumo.slides.length;
      const timePerSlide = totalDur / totalSlides;
      const expectedSlide = Math.min(
        Math.floor(currentTime / timePerSlide),
        totalSlides - 1
      );
      if (expectedSlide !== currentSlide && expectedSlide >= 0) {
        setCurrentSlide(expectedSlide);
      }
      setDuration(totalDur);
    }
  };

  // Calcular progresso do slide atual (0-100%)
  const getSlideProgress = () => {
    if (!currentSegmentDuration) return 0;
    return (progress / currentSegmentDuration) * 100;
  };

  // Calcular progresso geral baseado na fila
  const getOverallProgress = () => {
    if (audioQueue.length <= 1) {
      return duration ? (progress / duration) * 100 : 0;
    }
    // Para múltiplos áudios, usar índice
    const baseProgress = (currentAudioIndex / audioQueue.length) * 100;
    const segmentProgress = currentSegmentDuration ? (progress / currentSegmentDuration) * (100 / audioQueue.length) : 0;
    return baseProgress + segmentProgress;
  };

  // Frase motivacional baseada no progresso
  const getMotivationalPhrase = () => {
    const overallProgress = getOverallProgress();
    if (overallProgress < 25) return "Acompanhe as notícias de hoje";
    if (overallProgress < 50) return "Continue se atualizando";
    if (overallProgress < 75) return "Você já está na metade!";
    if (overallProgress < 90) return "Quase lá! Falta pouco";
    return "Você está atualizado!";
  };

  const goToSlide = (index: number) => {
    if (!audioRef.current || !resumo?.slides.length) return;
    
    // Para formato com áudios individuais
    if (audioQueue.length > 1) {
      const hasAbertura = resumo.url_audio_abertura ? 1 : 0;
      const audioIndex = index + hasAbertura;
      
      if (audioIndex < audioQueue.length) {
        setCurrentAudioIndex(audioIndex);
        setCurrentSlide(index);
        audioRef.current.src = audioQueue[audioIndex];
        if (isPlaying) {
          audioRef.current.play().catch(console.error);
        }
      }
    } else {
      // Formato antigo
      const totalDur = audioRef.current.duration || 0;
      const timePerSlide = totalDur / resumo.slides.length;
      audioRef.current.currentTime = index * timePerSlide;
      setCurrentSlide(index);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tipoNome = tipo === 'politica' ? 'Boletim Político' : 'Boletim Jurídico';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Tela de entrada se não há resumo
  if (!resumo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(tipo === 'politica' ? '/politica/noticias' : '/noticias-juridicas')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">{tipoNome}</h1>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center p-8 pt-20">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6"
          >
            <Mic className="w-12 h-12 text-primary" />
          </motion.div>
          
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-center mb-2"
          >
            Boletim de Hoje
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-center mb-8 max-w-sm"
          >
            Gere um resumo narrado com as 20 principais notícias {tipo === 'politica' ? 'políticas' : 'jurídicas'} de hoje
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-sm"
          >
            {generating ? (
              <div className="space-y-4">
                {/* Barra de progresso */}
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${generationProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                
                {/* Contador de slides */}
                {totalGenSlides > 0 && (
                  <div className="text-center">
                    <span className="text-2xl font-bold text-primary">
                      {currentGenSlide}/{totalGenSlides}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">áudios</span>
                  </div>
                )}
                
                {/* Mensagem de status */}
                <p className="text-sm text-muted-foreground text-center min-h-[40px]">
                  {generationMessage}
                </p>
                
                {/* Porcentagem */}
                <p className="text-xs text-muted-foreground/70 text-center">
                  {generationProgress}% concluído
                </p>
              </div>
            ) : (
              <Button 
                size="lg" 
                onClick={gerarResumo}
                disabled={generating}
                className="gap-2 w-full"
              >
                <Mic className="w-5 h-5" />
                Gerar Resumo de Hoje
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    );
  }
  // Dados do slide atual
  const currentSlideData = resumo.slides[currentSlide];
  const termos = resumo.termos || [];

  // Desktop Layout
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-black text-white flex flex-col">
        {/* Áudio principal (narração) */}
        <audio
          ref={audioRef}
          src={audioQueue[0] || resumo.url_audio}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
            console.error('Erro ao carregar áudio:', e);
            toast.error('Áudio com problema. Clique em regenerar.');
          }}
          onCanPlay={() => {
            if (!hasAutoPlayed && audioQueue.length > 0) {
              audioRef.current?.play().catch(() => {});
              if (backgroundAudioRef.current) {
                backgroundAudioRef.current.volume = 0.12;
                backgroundAudioRef.current.play().catch(() => {});
              }
              // Iniciar vídeo de introdução para boletim jurídico
              if (tipo === 'juridica' && resumo?.url_audio_abertura && currentAudioIndex === 0) {
                setShowIntroVideo(true);
                introVideoRef.current?.play().catch(() => {});
              }
              setHasAutoPlayed(true);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setCurrentSegmentDuration(audioRef.current.duration);
            }
          }}
        />

        {/* Áudio de fundo */}
        <audio
          ref={backgroundAudioRef}
          src={BACKGROUND_MUSIC_URL}
          loop={true}
          preload="auto"
        />

        {/* Áudio de transição entre notícias */}
        <audio
          ref={transitionAudioRef}
          src="/audio/transicao-boletim.mp3"
          onEnded={handleTransitionEnded}
          preload="auto"
        />



        {/* Breadcrumb Header */}
        <div className="bg-card/30 border-b border-border/50 p-4">
          <div className="max-w-7xl mx-auto px-8 flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(tipo === 'politica' ? '/politica/noticias' : '/noticias-juridicas')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <nav className="flex items-center gap-2 text-sm">
              <button 
                onClick={() => navigate('/')} 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Início
              </button>
              <span className="text-muted-foreground">›</span>
              <button 
                onClick={() => navigate(tipo === 'politica' ? '/politica/noticias' : '/noticias-juridicas')} 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {tipo === 'politica' ? 'Notícias Políticas' : 'Notícias Jurídicas'}
              </button>
              <span className="text-muted-foreground">›</span>
              <span className="text-foreground font-medium">{tipoNome}</span>
            </nav>
          </div>
        </div>

        {/* Conteúdo principal - Layout Desktop */}
        <div className="flex-1 flex w-full">
          {/* Sidebar esquerda - Lista de notícias - Colada à esquerda */}
          <div className="w-80 flex-shrink-0 border-r border-border/30 bg-card/20 ml-4">
            <div className="p-4 border-b border-border/30">
              <h3 className="text-sm font-bold text-foreground">Notícias do Boletim</h3>
              <p className="text-xs text-muted-foreground">{resumo.slides.length} notícias</p>
            </div>
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="py-1">
                {resumo.slides.map((slide, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      goToSlide(idx);
                      if (isPlaying) {
                        audioRef.current?.pause();
                        setIsPlaying(false);
                      }
                    }}
                    className={cn(
                      "w-full flex gap-3 p-3 text-left transition-all border-l-4",
                      idx === currentSlide 
                        ? "bg-primary/15 border-l-primary" 
                        : "hover:bg-secondary/30 border-l-transparent"
                    )}
                  >
                    <div className="w-20 h-14 rounded-md overflow-hidden flex-shrink-0">
                      <img
                        src={slide.imagem_url || '/placeholder.svg'}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs font-medium line-clamp-2 leading-tight",
                        idx === currentSlide ? "text-primary" : "text-foreground"
                      )}>
                        {slide.titulo}
                      </p>
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        {slide.hora_publicacao || '—'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Área principal - Player maior */}
          <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto">
            <div className="flex-1 flex flex-col items-center justify-start p-8 w-full">
              {/* Indicador de notícia */}
              <div className="w-full flex items-center justify-between mb-4">
                <span className="text-foreground font-semibold">
                  Notícia {currentSlide + 1}
                </span>
                <span className="text-muted-foreground text-sm">
                  {resumo.slides.length - currentSlide - 1 > 0 
                    ? `Faltam ${resumo.slides.length - currentSlide - 1}` 
                    : 'Última notícia'}
                </span>
              </div>

              {/* Imagem principal - clicável para pausar */}
              <div 
                className="relative w-full aspect-video rounded-xl overflow-hidden bg-card/50 cursor-pointer group"
                onClick={() => {
                  if (isPlaying) {
                    audioRef.current?.pause();
                  } else {
                    audioRef.current?.play();
                  }
                }}
              >
                <div className="absolute inset-0 bg-primary/10 blur-3xl scale-150 opacity-20" />
                
                <AnimatePresence mode="wait">
                  {/* Vídeo de introdução durante áudio de abertura */}
                  {tipo === 'juridica' && showIntroVideo ? (
                    <motion.video
                      key="intro-video"
                      ref={introVideoRef}
                      src={introVideoJuridico}
                      muted
                      playsInline
                      loop
                      autoPlay
                      preload="auto"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="relative w-full h-full object-cover"
                      onLoadedData={(e) => {
                        const video = e.currentTarget;
                        video.currentTime = 0;
                        video.play().catch(() => {});
                      }}
                    />
                  ) : (
                    <motion.img
                      key={`img-${currentSlide}`}
                      src={currentSlideData?.imagem_url || '/placeholder.svg'}
                      alt={currentSlideData?.titulo}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      className="relative w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Overlay de pausa/play */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isPlaying ? (
                    <Pause className="w-16 h-16 text-white drop-shadow-lg" />
                  ) : (
                    <Play className="w-16 h-16 text-white drop-shadow-lg ml-2" />
                  )}
                </div>

                {/* Barra de progresso no topo */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/40">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${getSlideProgress()}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>

                {/* Emojis flutuantes */}
                <AnimatePresence>
                  {visibleEmojis.map((emojiItem) => (
                    <motion.div
                      key={emojiItem.id}
                      className="absolute text-5xl pointer-events-none drop-shadow-lg"
                      style={{ left: `${emojiItem.x}%`, top: `${emojiItem.y}%` }}
                      initial={{ scale: 0, opacity: 0, y: 20 }}
                      animate={{ scale: 1.3, opacity: 1, y: 0 }}
                      exit={{ scale: 0.5, opacity: 0, y: -30 }}
                      transition={{ type: "spring", stiffness: 400, damping: 12 }}
                    >
                      {emojiItem.emoji}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Data */}
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-primary text-sm font-bold mt-4"
              >
                {(() => {
                  const [year, month, day] = resumo.data.split('-').map(Number);
                  return format(new Date(year, month - 1, day), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                })()}
              </motion.p>

              {/* Título */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="text-center mt-3"
                >
                  <h2 className="font-bold text-2xl leading-tight text-foreground">
                    {currentSlideData?.titulo}
                  </h2>
                  {currentSlideData?.subtitulo && (
                    <p className="text-sm text-muted-foreground leading-snug mt-2">
                      {currentSlideData.subtitulo}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Controles de áudio */}
              <div className="w-full max-w-md mt-6 bg-card/30 rounded-xl p-4 border border-border/50">
                {/* Barra de progresso geral */}
                <div className="mb-4">
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary"
                      animate={{ width: `${getOverallProgress()}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatTime(accumulatedProgress + progress)}</span>
                    <span>
                      {audioQueue.length > 1 
                        ? formatTime(totalDuration)
                        : formatTime(duration)
                      }
                    </span>
                  </div>
                </div>

                {/* Botões de controle */}
                <div className="flex items-center justify-center gap-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => goToSlide(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                  >
                    <SkipBack className="w-5 h-5" />
                  </Button>

                  <Button
                    size="icon"
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90"
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7" />
                    ) : (
                      <Play className="w-7 h-7 ml-0.5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => goToSlide(Math.min(resumo.slides.length - 1, currentSlide + 1))}
                    disabled={currentSlide === resumo.slides.length - 1}
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile/Tablet Layout (original)
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Áudio principal (narração) */}
      <audio
        ref={audioRef}
        src={audioQueue[0] || resumo.url_audio}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          console.error('Erro ao carregar áudio:', e);
          toast.error('Áudio com problema. Clique em regenerar.');
        }}
        onCanPlay={() => {
          if (!hasAutoPlayed && audioQueue.length > 0) {
            audioRef.current?.play().catch(() => {});
            // Iniciar música de fundo junto
            if (backgroundAudioRef.current) {
              backgroundAudioRef.current.volume = 0.12;
              backgroundAudioRef.current.play().catch(() => {});
            }
            // Iniciar vídeo de introdução para boletim jurídico
            if (tipo === 'juridica' && resumo?.url_audio_abertura && currentAudioIndex === 0) {
              setShowIntroVideo(true);
              introVideoRef.current?.play().catch(() => {});
            }
            setHasAutoPlayed(true);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setCurrentSegmentDuration(audioRef.current.duration);
          }
        }}
      />

      {/* Áudio de fundo - loop automático, volume baixo */}
      <audio
        ref={backgroundAudioRef}
        src={BACKGROUND_MUSIC_URL}
        loop={true}
        preload="auto"
      />

      {/* Áudio de transição entre notícias */}
      <audio
        ref={transitionAudioRef}
        src="/audio/transicao-boletim.mp3"
        onEnded={handleTransitionEnded}
        preload="auto"
      />



      {/* Alerta de formato antigo */}
      {resumo && !resumo.url_audio_abertura && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500/95 px-4 py-3 flex items-center justify-center">
          <span className="text-xs font-medium text-black text-center">
            Formato antigo detectado. Delete este boletim no Supabase para regenerar com timing perfeito.
          </span>
        </div>
      )}

      {/* Header minimalista */}
      <header className={cn(
        "sticky z-50 bg-black/90 backdrop-blur p-3 flex items-center justify-between border-b border-white/10",
        resumo && !resumo.url_audio_abertura ? "top-12" : "top-0"
      )}>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(tipo === 'politica' ? '/politica/noticias' : '/noticias-juridicas')}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm font-medium text-white/70">{tipoNome}</span>
        <div className="w-9" /> {/* Spacer para manter header centralizado */}
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Indicador de notícia ACIMA da imagem */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-base">
              Notícia {currentSlide + 1}
            </span>
            <span className="text-white/60 text-sm">
              {resumo.slides.length - currentSlide - 1 > 0 
                ? `Faltam ${resumo.slides.length - currentSlide - 1}` 
                : 'Última notícia'}
            </span>
          </div>
        </div>

        {/* Imagem/Vídeo com overlays */}
        <div className="relative px-4">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-primary/20 blur-3xl scale-150 opacity-30" />
            
            <AnimatePresence mode="wait">
              {/* Vídeo de introdução durante áudio de abertura */}
              {tipo === 'juridica' && showIntroVideo ? (
                <motion.video
                  key="intro-video"
                  ref={introVideoRef}
                  src={introVideoJuridico}
                  muted
                  playsInline
                  loop
                  autoPlay
                  preload="auto"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full h-full object-cover"
                  onLoadedData={(e) => {
                    const video = e.currentTarget;
                    video.currentTime = 0;
                    video.play().catch(() => {});
                  }}
                />
              ) : (
                <motion.img
                  key={`img-${currentSlide}`}
                  src={currentSlideData?.imagem_url || '/placeholder.svg'}
                  alt={currentSlideData?.titulo}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  className="relative w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              )}
            </AnimatePresence>

            {/* Overlay: Barra de progresso no topo */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/40">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${getSlideProgress()}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            {/* Emojis flutuantes animados */}
            <AnimatePresence>
              {visibleEmojis.map((emojiItem) => (
                <motion.div
                  key={emojiItem.id}
                  className="absolute text-4xl pointer-events-none drop-shadow-lg"
                  style={{ left: `${emojiItem.x}%`, top: `${emojiItem.y}%` }}
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1.3, opacity: 1, y: 0 }}
                  exit={{ scale: 0.5, opacity: 0, y: -30 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 12 
                  }}
                >
                  {emojiItem.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Data destacada em vermelho - ABAIXO da capa */}
        <div className="px-4 py-2 text-center">
          <motion.p 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm font-bold"
          >
            {(() => {
              const [year, month, day] = resumo.data.split('-').map(Number);
              return format(new Date(year, month - 1, day), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
            })()}
          </motion.p>
        </div>

        {/* Título e subtítulo */}
        <div className="px-4 py-2 text-left">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <h2 className="font-bold text-xl leading-tight mb-1">
                {currentSlideData?.titulo}
              </h2>
              {currentSlideData?.subtitulo && (
                <p className="text-sm text-white/60 leading-snug">
                  {currentSlideData.subtitulo}
                </p>
              )}
              <p className="text-xs text-white/40 mt-1">
                Publicada às {currentSlideData?.hora_publicacao || '—'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Thumbnails horizontais */}
        <div className="px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {resumo.slides.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={cn(
                  "flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all",
                  idx === currentSlide 
                    ? "border-primary ring-2 ring-primary/50" 
                    : "border-transparent opacity-40 hover:opacity-70"
                )}
              >
                <img
                  src={slide.imagem_url || '/placeholder.svg'}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Controles de áudio */}
        <div className="px-4 py-3 bg-white/5">
          {/* Barra de progresso geral */}
          <div className="mb-3">
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                animate={{ width: `${getOverallProgress()}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/40 mt-1">
              <span>{formatTime(accumulatedProgress + progress)}</span>
              <span>
                {audioQueue.length > 1 
                  ? formatTime(totalDuration)
                  : formatTime(duration)
                }
              </span>
            </div>
          </div>

          {/* Botões de controle */}
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => goToSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="text-white hover:bg-white/10 disabled:opacity-30"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              size="icon"
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7" />
              ) : (
                <Play className="w-7 h-7 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => goToSlide(Math.min(resumo.slides.length - 1, currentSlide + 1))}
              disabled={currentSlide === resumo.slides.length - 1}
              className="text-white hover:bg-white/10 disabled:opacity-30"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Menu de abas */}
        <div className="px-4 pt-3">
          <div className="flex bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('resumos')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === 'resumos'
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/70"
              )}
            >
              <FileText className="w-4 h-4" />
              Resumos
            </button>
            <button
              onClick={() => setActiveTab('termos')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === 'termos'
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/70"
              )}
            >
              <BookOpen className="w-4 h-4" />
              Termos
            </button>
            <button
              onClick={() => setActiveTab('noticia')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === 'noticia'
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/70"
              )}
            >
              <Newspaper className="w-4 h-4" />
              Notícia
            </button>
          </div>
        </div>

        {/* Conteúdo das abas */}
        <div className="flex-1 overflow-y-auto px-4 py-3 pb-6">
          {activeTab === 'resumos' && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`resumo-${currentSlide}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-full bg-primary/30 text-primary text-xs font-bold flex items-center justify-center">
                      {currentSlide + 1}
                    </span>
                    <h3 className="font-semibold text-sm text-white">
                      {currentSlideData?.titulo}
                    </h3>
                  </div>
                  <p className="text-base text-white/80 leading-relaxed mb-4">
                    {currentSlideData?.resumo_curto || currentSlideData?.texto_narrado || 'Resumo não disponível para esta notícia.'}
                  </p>
                  
                  {/* Link para a notícia completa */}
                  {currentSlideData?.noticia_id && (
                    <button
                      onClick={() => {
                        const route = tipo === 'politica' 
                          ? `/noticia-politica/${currentSlideData.noticia_id}`
                          : `/noticia-juridica/${currentSlideData.noticia_id}`;
                        navigate(route);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver notícia completa
                    </button>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
          
          {activeTab === 'termos' && (
            <div className="space-y-2">
              {termos.length > 0 ? (
                termos.map((termo, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">📚</span>
                      <div>
                        <h3 className="font-medium text-sm text-primary">
                          {termo.termo}
                        </h3>
                        <p className="text-xs text-white/60 mt-1">
                          {termo.definicao}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/50">
                    Nenhum termo disponível para este resumo.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'noticia' && (
            <div className="space-y-4 pb-20">
              {/* Imagem da notícia */}
              <div className="aspect-video rounded-xl overflow-hidden bg-white/5">
                <img
                  src={currentSlideData?.imagem_url || '/placeholder.svg'}
                  alt={currentSlideData?.titulo}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>

              {/* Título da notícia */}
              <h2 className="text-xl font-bold text-white leading-tight">
                {currentSlideData?.titulo}
              </h2>

              {/* Data e fonte */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-1 rounded bg-white/10 text-xs text-white/60">
                  {currentSlideData?.hora_publicacao || 'Sem data'}
                </span>
              </div>

              {/* Conteúdo baseado no subtab */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`noticia-content-${currentSlide}-${noticiaSubTab}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-white/80 leading-relaxed"
                >
                  {noticiaSubTab === 'formatada' && (
                    <p>{currentSlideData?.resumo_curto || currentSlideData?.texto_narrado || 'Conteúdo não disponível.'}</p>
                  )}
                  {noticiaSubTab === 'original' && (
                    <p>{currentSlideData?.texto_narrado || 'Conteúdo original não disponível.'}</p>
                  )}
                  {noticiaSubTab === 'analise' && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <h4 className="text-xs font-semibold text-primary mb-2">📊 Análise</h4>
                        <p className="text-sm text-white/80">
                          {currentSlideData?.subtitulo || 'Análise não disponível.'}
                        </p>
                      </div>
                      {currentSlideData?.resumo_curto && (
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <h4 className="text-xs font-semibold text-white/60 mb-2">💡 Resumo</h4>
                          <p className="text-sm text-white/70">
                            {currentSlideData.resumo_curto}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Menu de rodapé fixo para aba Notícia */}
        {activeTab === 'noticia' && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-white/10 px-4 py-3 z-50">
            <div className="flex justify-around max-w-md mx-auto">
              <button
                onClick={() => setNoticiaSubTab('formatada')}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-1 transition-colors",
                  noticiaSubTab === 'formatada'
                    ? "text-primary"
                    : "text-white/50 hover:text-white/70"
                )}
              >
                <FileText className="w-5 h-5" />
                <span className="text-xs font-medium">Formatada</span>
              </button>
              <button
                onClick={() => setNoticiaSubTab('original')}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-1 transition-colors",
                  noticiaSubTab === 'original'
                    ? "text-primary"
                    : "text-white/50 hover:text-white/70"
                )}
              >
                <Globe className="w-5 h-5" />
                <span className="text-xs font-medium">Original</span>
              </button>
              <button
                onClick={() => setNoticiaSubTab('analise')}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-1 transition-colors",
                  noticiaSubTab === 'analise'
                    ? "text-primary"
                    : "text-white/50 hover:text-white/70"
                )}
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-medium">Análise</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
