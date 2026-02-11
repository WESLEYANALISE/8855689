import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GraduationCap, Target, ArrowRight, ArrowLeft, Check, Scale, Briefcase } from 'lucide-react';
import { markOnboardingComplete } from '@/hooks/useOnboardingStatus';
import { markPlanChosen } from '@/pages/EscolherPlano';
import { getPreloadedVideoUrl } from '@/hooks/useOnboardingVideoPreloader';

// Imagens elegantes para cada perfil
import imgUniversitario from '@/assets/onboarding-universitario.jpg';
import imgConcurseiro from '@/assets/onboarding-concurseiro.jpg';
import imgOab from '@/assets/onboarding-oab.jpg';
import imgAdvogado from '@/assets/onboarding-advogado.jpg';

const INTENCOES = [
  {
    value: 'universitario',
    label: 'Universitário',
    description: 'Cursando Faculdade de Direito',
    icon: GraduationCap,
    image: imgUniversitario,
  },
  {
    value: 'concurseiro',
    label: 'Concurseiro',
    description: 'Estudando para Concursos Públicos',
    icon: Target,
    image: imgConcurseiro,
  },
  {
    value: 'oab',
    label: 'OAB',
    description: 'Preparando-se para o Exame da OAB',
    icon: Scale,
    image: imgOab,
  },
  {
    value: 'advogado',
    label: 'Advogado',
    description: 'Atuando Profissionalmente',
    icon: Briefcase,
    image: imgAdvogado,
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  // Iniciar vídeo muted (para autoplay funcionar) e habilitar áudio após interação
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Inicia muted para garantir autoplay
    video.muted = true;
    video.play().catch(console.warn);

    // Ao primeiro clique, habilita áudio com volume baixo
    const enableAudio = () => {
      if (video.muted) {
        video.muted = false;
        video.volume = 0.15;
      }
      document.removeEventListener('click', enableAudio);
    };

    document.addEventListener('click', enableAudio);
    return () => document.removeEventListener('click', enableAudio);
  }, [videoReady]);

  // Marca vídeo como pronto quando carregar
  const handleVideoLoaded = () => setVideoReady(true);

  // Form data - nome vem do cadastro, só precisamos da intenção
  const [nome, setNome] = useState('');
  const [intencao, setIntencao] = useState('');

  // Pre-fill nome from user metadata (já preenchido no cadastro)
  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata;
      if (metadata?.full_name) {
        setNome(metadata.full_name);
      } else if (metadata?.nome) {
        setNome(metadata.nome);
      }
    }
  }, [user]);

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleFinish = async () => {
    if (!intencao) {
      toast.error('Por favor, selecione seu objetivo');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: nome.trim(),
          intencao,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Marcar onboarding e plano como completo
      if (user?.id) {
        markOnboardingComplete(user.id);
        markPlanChosen(user.id);
      }

      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            key="welcome"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <GraduationCap className="w-12 h-12 text-primary" />
            </motion.div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-foreground">
                Bem-vindo ao <span className="text-primary">Direito X</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-md">
                Estudos Jurídicos
              </p>
            </div>

            <Button
              size="lg"
              onClick={handleNext}
              className="mt-8 gap-2"
            >
              Começar
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="objetivo"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="w-full max-w-lg space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                Qual é o seu objetivo?
              </h2>
              <p className="text-muted-foreground mt-2">
                Isso nos ajuda a personalizar seu conteúdo
              </p>
            </div>

            {/* Grid 2x2 com cards animados */}
            <div className="grid grid-cols-2 gap-3">
              {INTENCOES.map((item, index) => {
                const Icon = item.icon;
                const isSelected = intencao === item.value;
                return (
                  <motion.button
                    key={item.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    whileHover={{ 
                      scale: 1.03, 
                      boxShadow: '0 0 25px hsl(var(--primary) / 0.4)' 
                    }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIntencao(item.value)}
                    className={`relative overflow-hidden rounded-xl aspect-square transition-all ${
                      isSelected
                        ? 'ring-3 ring-primary ring-offset-2 ring-offset-background'
                        : 'ring-1 ring-border/50'
                    }`}
                  >
                    {/* Imagem de fundo */}
                    <img 
                      src={item.image} 
                      alt={item.label}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    {/* Overlay com gradiente */}
                    <div className={`absolute inset-0 transition-all duration-300 ${
                      isSelected 
                        ? 'bg-gradient-to-t from-primary/90 via-primary/50 to-primary/20' 
                        : 'bg-gradient-to-t from-black/80 via-black/50 to-transparent'
                    }`} />
                    
                    {/* Conteúdo */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                        isSelected ? 'bg-white/20' : 'bg-primary/20'
                      }`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-primary'}`} />
                      </div>
                      <h3 className="font-bold text-white text-lg">{item.label}</h3>
                      <p className="text-white/80 text-sm leading-tight">{item.description}</p>
                    </div>
                    
                    {/* Checkmark animado */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-3 right-3 bg-primary rounded-full p-1.5 shadow-lg"
                        >
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <Button
                onClick={handleFinish}
                disabled={isLoading || !intencao}
                className="flex-1 gap-2"
              >
                {isLoading ? 'Salvando...' : 'Finalizar'}
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Vídeo de fundo */}
      <video
        ref={videoRef}
        autoPlay
        loop
        playsInline
        muted
        onLoadedData={handleVideoLoaded}
        src={getPreloadedVideoUrl()}
        className="fixed inset-0 w-full h-full object-cover z-0"
        style={{ backgroundColor: 'black' }}
      />
      
      {/* Overlay escuro para legibilidade */}
      <div className="fixed inset-0 bg-black/60 z-0" />

      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {[0, 1].map((i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === step
                    ? 'bg-primary w-8'
                    : i < step
                    ? 'bg-primary/60'
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Content card */}
          <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl border border-border/50">
            <AnimatePresence mode="wait" custom={step}>
              {renderStep()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
