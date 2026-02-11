import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, Video, Brain, Library, Scale, FileText, Globe, 
  ChevronRight, ChevronDown, Sparkles, Lock, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useRef, useState, useCallback, useEffect } from 'react';
import type { CarouselApi } from '@/components/ui/carousel';
import { toast } from 'sonner';

import themisFull from '@/assets/themis-full.webp';
import welcome1 from '@/assets/landing/welcome-1.png';
import welcome2 from '@/assets/landing/welcome-2.png';
import welcome3 from '@/assets/landing/welcome-3.png';
import welcome4 from '@/assets/landing/welcome-4.png';
import welcome5 from '@/assets/landing/welcome-5.png';
import welcome6 from '@/assets/landing/welcome-6.png';
import welcome7 from '@/assets/landing/welcome-7.png';
import welcome8 from '@/assets/landing/welcome-8.png';

const screenshots = [welcome1, welcome2, welcome3, welcome4, welcome5, welcome6, welcome7, welcome8];

const features = [
  { icon: Video, title: 'Videoaulas', desc: 'Todas as matérias do Direito' },
  { icon: BookOpen, title: 'Jornada Jurídica', desc: 'Aulas explicativas completas' },
  { icon: Brain, title: 'Flashcards', desc: 'Memorização inteligente' },
  { icon: Library, title: 'Biblioteca', desc: '+1200 livros jurídicos' },
  { icon: Scale, title: 'OAB 1ª e 2ª Fase', desc: 'Preparação completa' },
  { icon: FileText, title: 'Vade Mecum', desc: 'Comentado e atualizado' },
  { icon: Globe, title: 'Política', desc: 'Estudos e atualidades' },
];

// YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const Welcome = () => {
  const navigate = useNavigate();
  const autoplayPlugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: true }));
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  
  // Video progress state
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on('select', () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      createPlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(tag, firstScript);

    window.onYouTubeIframeAPIReady = () => {
      createPlayer();
    };

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const createPlayer = () => {
    if (playerRef.current || !playerContainerRef.current) return;
    
    playerRef.current = new window.YT.Player(playerContainerRef.current, {
      videoId: 'vx7xFDI_MDE',
      playerVars: {
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onStateChange: onPlayerStateChange,
      },
    });
  };

  const onPlayerStateChange = (event: any) => {
    // Playing
    if (event.data === 1) {
      startProgressTracking();
    }
    // Paused or ended
    if (event.data === 2 || event.data === 0) {
      stopProgressTracking();
    }
    // Ended
    if (event.data === 0) {
      setVideoProgress(100);
      setVideoCompleted(true);
    }
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getDuration) {
        const duration = playerRef.current.getDuration();
        const currentTime = playerRef.current.getCurrentTime();
        if (duration > 0) {
          const pct = Math.min(Math.round((currentTime / duration) * 100), 100);
          setVideoProgress(pct);
          if (pct >= 95) {
            setVideoCompleted(true);
          }
        }
      }
    }, 500);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const scrollToVideo = useCallback(() => {
    videoSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Auto-play after scroll
    setTimeout(() => {
      if (playerRef.current && playerRef.current.playVideo) {
        playerRef.current.playVideo();
      }
    }, 800);
  }, []);

  const handleComecar = useCallback(() => {
    if (!videoCompleted) {
      toast.info('Assista o vídeo demonstrativo até o final para continuar', {
        description: `Progresso: ${videoProgress}%`,
        duration: 3000,
      });
      return;
    }
    navigate('/auth');
  }, [navigate, videoCompleted, videoProgress]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={themisFull} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-background" />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-primary font-serif text-lg md:text-xl mb-4 tracking-widest uppercase">
              Direito Premium
            </h2>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
              Cansado de estudar Direito{' '}
              <span className="text-primary">sem rumo?</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
              Tudo do Direito em um só lugar. Aulas, leis, flashcards e IA.
            </p>
            <Button 
              size="lg" 
              onClick={scrollToVideo}
              variant="outline"
              className="text-lg px-10 py-6 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-lg shadow-primary/20 transition-all"
            >
              <Play className="mr-2 h-5 w-5" />
              Demonstrativo
              <ChevronDown className="ml-1 h-5 w-5 animate-bounce" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Demonstrativo - YouTube Video */}
      <section ref={videoSectionRef} className="pt-4 pb-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-sm mx-auto text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            <Sparkles className="inline h-6 w-6 text-primary mr-2" />
            Demonstrativo
          </h2>
          <div className="rounded-2xl overflow-hidden border border-border shadow-2xl shadow-primary/10">
            <div ref={playerContainerRef} className="w-full aspect-[9/16]" />
          </div>

          {/* Progress bar */}
          <div className="mt-6 space-y-3">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${videoProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {videoCompleted ? '✅ Vídeo concluído!' : `${videoProgress}% assistido`}
            </p>
          </div>

          {/* CTA - Começar Agora */}
          <motion.div className="mt-8" animate={{ scale: videoCompleted ? [1, 1.05, 1] : 1 }} transition={{ repeat: videoCompleted ? Infinity : 0, duration: 1.5 }}>
            <Button
              size="lg"
              onClick={handleComecar}
              className={`text-lg px-10 py-6 rounded-full shadow-lg transition-all w-full ${
                videoCompleted
                  ? 'animate-pulse shadow-primary/30'
                  : 'opacity-80'
              }`}
            >
              {videoCompleted ? (
                <>
                  Começar Agora <ChevronRight className="ml-1 h-5 w-5" />
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Começar Agora ({videoProgress}%)
                </>
              )}
            </Button>
            {!videoCompleted && (
              <p className="text-xs text-muted-foreground mt-2">
                Assista o vídeo para desbloquear
              </p>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Carrossel de Screenshots */}
      <section className="py-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-lg mx-auto text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Conheça o App</h2>
          <Carousel
            setApi={setApi}
            plugins={[autoplayPlugin.current]}
            opts={{ loop: true }}
            className="w-full"
          >
            <CarouselContent>
              {screenshots.map((img, i) => (
                <CarouselItem key={i}>
                  <div className="px-4">
                    <img
                      src={img}
                      alt={`Screenshot ${i + 1} do app`}
                      className="rounded-2xl border border-border shadow-xl mx-auto max-h-[70vh] object-contain"
                      loading="lazy"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === current ? 'bg-primary w-6' : 'bg-muted-foreground/30'
                }`}
                onClick={() => api?.scrollTo(i)}
                aria-label={`Ir para slide ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Funcionalidades */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-center mb-12"
          >
            Tudo que você precisa
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border"
              >
                <f.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Button
            size="lg"
            onClick={handleComecar}
            className={`text-xl px-12 py-7 rounded-full shadow-xl transition-all ${
              videoCompleted ? 'animate-pulse shadow-primary/30' : 'opacity-80'
            }`}
          >
            {videoCompleted ? (
              <>Acessar Gratuitamente <ChevronRight className="ml-2 h-6 w-6" /></>
            ) : (
              <>
                <Lock className="mr-2 h-5 w-5" />
                Assista o demonstrativo ({videoProgress}%)
              </>
            )}
          </Button>
          <p className="text-muted-foreground mt-4 text-sm">
            {videoCompleted ? 'Cadastro rápido e gratuito' : 'Assista o vídeo acima para desbloquear'}
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default Welcome;
