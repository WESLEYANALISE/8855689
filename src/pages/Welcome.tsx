import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

// Desktop (landscape) images
import estudosSection from '@/assets/landing/estudos-section.webp';
import vadeMecumSection from '@/assets/landing/vade-mecum-section.webp';
import bibliotecaSection from '@/assets/landing/biblioteca-section-opt.webp';
import evelynSection from '@/assets/landing/evelyn-ai-section.webp';
import oabSection from '@/assets/landing/oab-section.webp';
import themisFull from '@/assets/themis-full.webp';

// Mobile (portrait) images
import mobileSlide1 from '@/assets/landing/mobile-slide-1.webp';
import mobileSlide2 from '@/assets/landing/mobile-slide-2.webp';
import mobileSlide3 from '@/assets/landing/mobile-slide-3.webp';
import mobileSlide4 from '@/assets/landing/mobile-slide-4.webp';
import mobileSlide5 from '@/assets/landing/mobile-slide-5.webp';
import mobileSlide6 from '@/assets/landing/mobile-slide-6.webp';

const slides = [
  {
    desktopImage: estudosSection,
    mobileImage: mobileSlide1,
    title: 'Domine todas as matérias do Direito',
    subtitle: 'Videoaulas completas, trilhas personalizadas e aulas interativas para você estudar no seu ritmo.',
  },
  {
    desktopImage: vadeMecumSection,
    mobileImage: mobileSlide2,
    title: 'Vade Mecum Inteligente e Comentado',
    subtitle: 'Todas as leis com narração por voz, destaques coloridos, anotações pessoais e comentários de especialistas.',
  },
  {
    desktopImage: bibliotecaSection,
    mobileImage: mobileSlide3,
    title: 'A maior Biblioteca Jurídica Digital',
    subtitle: 'Mais de 1.200 livros de doutrina, legislação, OAB e concursos na palma da sua mão.',
  },
  {
    desktopImage: evelynSection,
    mobileImage: mobileSlide4,
    title: 'Evelyn: Sua Professora Particular 24h',
    subtitle: 'Tire dúvidas por áudio, texto, imagem ou PDF com a assistente que entende de Direito como ninguém.',
  },
  {
    desktopImage: oabSection,
    mobileImage: mobileSlide5,
    title: 'Aprovação na OAB e Concursos Públicos',
    subtitle: 'Simulados cronometrados, questões comentadas, 1ª e 2ª fase da OAB e concursos — tudo em um só lugar.',
  },
  {
    desktopImage: themisFull,
    mobileImage: mobileSlide6,
    title: 'Tudo para a sua aprovação',
    subtitle: 'Flashcards, mapas mentais, resumos inteligentes e mais de 10.000 questões para você dominar o Direito.',
  },
];

const Welcome = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const autoplayRef = useRef(Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }));

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplayRef.current]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  const handleJoin = useCallback(() => {
    navigate('/bem-vindo-evelyn');
  }, [navigate]);

  const handleLogin = useCallback(() => {
    navigate('/auth?mode=login');
  }, [navigate]);

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden bg-black flex flex-col">
      {/* Progress bars at top */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-1.5 px-4 pt-3">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] rounded-full bg-white/20 overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: i === selectedIndex ? '100%' : i < selectedIndex ? '100%' : '0%' }}
              transition={i === selectedIndex ? { duration: 5, ease: 'linear' } : { duration: 0.3 }}
              key={`${i}-${selectedIndex}`}
            />
          </div>
        ))}
      </div>

      {/* Carousel */}
      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, i) => (
            <div key={i} className="flex-[0_0_100%] min-w-0 relative h-full">
              <img
                src={isMobile ? slide.mobileImage : slide.desktopImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />

              {/* Text content at bottom */}
              <AnimatePresence mode="wait">
                {i === selectedIndex && (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="absolute bottom-44 left-0 right-0 px-6 z-10"
                  >
                    <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-3">
                      {slide.title}
                    </h1>
                    <p className="text-sm md:text-base text-white/70 leading-relaxed max-w-md">
                      {slide.subtitle}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed bottom buttons */}
      <div className="absolute bottom-0 left-0 right-0 z-30 px-6 pb-8 pt-4 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <Button
            size="lg"
            onClick={handleJoin}
            className="w-full text-base py-6 rounded-full shadow-lg shadow-primary/30 font-bold"
          >
            Quero ser Aluno(a)!
            <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleLogin}
            className="w-full text-base py-6 rounded-full border-white/30 text-white hover:bg-white/10 font-medium"
          >
            Já sou Aluno(a)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
