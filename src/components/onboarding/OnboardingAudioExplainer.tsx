import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingAudioExplainerProps {
  autoPlay?: boolean;
}

// Texto da narração explicando por que pedimos o WhatsApp
const TEXTO_NARRACAO = `Precisamos do seu WhatsApp para conectar você à Evelyn, sua assistente jurídica. 
Com ela, você pode tirar dúvidas, receber resumos diários e acessar conteúdos exclusivos diretamente no seu celular.
É rápido, seguro e vai transformar seus estudos.`;

// URL do áudio em cache (se existir)
const AUDIO_CACHE_KEY = 'onboarding_whatsapp_explicacao';

export const OnboardingAudioExplainer = ({ autoPlay = true }: OnboardingAudioExplainerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Buscar ou gerar áudio
  useEffect(() => {
    const fetchOrGenerateAudio = async () => {
      try {
        // Primeiro, verificar se existe áudio em cache no storage
        const { data: cacheData } = await supabase
          .from('AUDIO_FEEDBACK_CACHE')
          .select('url_audio')
          .eq('tipo', AUDIO_CACHE_KEY)
          .maybeSingle();

        if (cacheData?.url_audio) {
          console.log('[OnboardingAudio] Usando áudio em cache');
          setAudioUrl(cacheData.url_audio);
          setIsLoading(false);
          return;
        }

        // Se não existe, gerar via edge function
        console.log('[OnboardingAudio] Gerando áudio...');
        const { data, error } = await supabase.functions.invoke('gerar-audio-feedback', {
          body: { 
            texto: TEXTO_NARRACAO,
            tipo: AUDIO_CACHE_KEY,
            voz: 'Aoede'
          }
        });

        if (error) {
          console.error('[OnboardingAudio] Erro ao gerar áudio:', error);
          setIsLoading(false);
          return;
        }

        if (data?.url_audio) {
          setAudioUrl(data.url_audio);
        }
      } catch (err) {
        console.error('[OnboardingAudio] Erro:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrGenerateAudio();
  }, []);

  // Auto-play quando áudio estiver pronto
  useEffect(() => {
    if (audioUrl && autoPlay && audioRef.current) {
      // Pequeno delay para garantir que o elemento está montado
      const timer = setTimeout(() => {
        audioRef.current?.play().catch(err => {
          console.log('[OnboardingAudio] Autoplay bloqueado:', err);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [audioUrl, autoPlay]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => setIsPlaying(false);

  // Se não há áudio ou está carregando, mostrar apenas o texto
  if (isLoading || !audioUrl) {
    return (
      <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {TEXTO_NARRACAO}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 space-y-3">
      {/* Controles de áudio */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="h-10 w-10 rounded-full bg-primary/20 hover:bg-primary/30"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-primary" />
          ) : (
            <Play className="w-5 h-5 text-primary ml-0.5" />
          )}
        </Button>
        
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            {isPlaying ? 'Reproduzindo explicação...' : 'Toque para ouvir'}
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="h-8 w-8"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      
      {/* Texto da narração */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {TEXTO_NARRACAO}
      </p>
      
      {/* Elemento de áudio oculto */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        preload="auto"
      />
    </div>
  );
};
