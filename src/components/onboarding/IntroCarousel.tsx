import { useState, useCallback } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { 
  BookOpen, Video, Library, ClipboardList, MessageCircle, Sparkles,
  ChevronRight, X, Brain, Scale, GraduationCap, Gavel
} from 'lucide-react';

// Imagens de fundo
import capaFaculdade from '@/assets/landing/welcome-1.png';
import estudosSection from '@/assets/landing/estudos-section.webp';
import oabSection from '@/assets/landing/oab-section.webp';
import bibliotecaSection from '@/assets/landing/biblioteca-section-opt.webp';
import concursoSection from '@/assets/landing/concurso-section.webp';
import evelynSection from '@/assets/landing/evelyn-ai-section.webp';

interface IntroCarouselProps {
  onComplete: () => void;
}

const slides = [
  {
    image: capaFaculdade,
    icon: GraduationCap,
    title: 'Sua jornada jurídica começa agora',
    description: 'O Direito Premium é a plataforma completa para estudantes, concurseiros, OAB e advogados. Tudo que você precisa em um só lugar.',
    features: ['Plataforma completa', 'Para todos os perfis', '100% online'],
  },
  {
    image: estudosSection,
    icon: Brain,
    title: 'Ferramentas inteligentes de estudo',
    description: 'Aprenda de forma eficiente com tecnologia de ponta aplicada ao Direito.',
    features: ['Flashcards', 'Mapas Mentais', 'Resumos com IA', 'Dicionário Jurídico'],
  },
  {
    image: oabSection,
    icon: Scale,
    title: 'Videoaulas e Trilhas OAB',
    description: 'Prepare-se para a OAB com aulas completas, trilhas organizadas e questões comentadas por especialistas.',
    features: ['Videoaulas', 'Trilhas OAB', 'Questões comentadas', 'Áudio-aulas'],
  },
  {
    image: bibliotecaSection,
    icon: Library,
    title: 'Biblioteca e Vade Mecum',
    description: 'Acesse o maior acervo jurídico digital com legislação sempre atualizada.',
    features: ['Vade Mecum completo', 'Legislação atualizada', 'Súmulas', 'Livros clássicos'],
  },
  {
    image: concursoSection,
    icon: ClipboardList,
    title: 'Questões e Simulados',
    description: 'Pratique diariamente com nosso banco de questões e simulados no estilo OAB e concursos.',
    features: ['Banco de questões', 'Simulados OAB', 'Prática diária', 'Estatísticas'],
  },
  {
    image: evelynSection,
    icon: MessageCircle,
    title: 'Conheça a Evelyn',
    description: 'Sua assistente jurídica com IA disponível 24h no WhatsApp. Tire dúvidas, peça resumos e tenha ajuda instantânea nos estudos.',
    features: ['IA no WhatsApp', 'Disponível 24h', 'Tira dúvidas', 'Resumos instantâneos'],
    isFinal: true,
  },
];

const swipeThreshold = 50;

const IntroCarousel = ({ onComplete }: IntroCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = useCallback((newDirection: number) => {
    const next = current + newDirection;
    if (next < 0 || next >= slides.length) return;
    setDirection(newDirection);
    setCurrent(next);
  }, [current]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.x < -swipeThreshold) paginate(1);
    else if (info.offset.x > swipeThreshold) paginate(-1);
  }, [paginate]);

  const slide = slides[current];
  const isLast = current === slides.length - 1;
  const SlideIcon = slide.icon;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col overflow-hidden"
    >
      {/* Skip button */}
      {!isLast && (
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 z-50 flex items-center gap-1 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm font-medium hover:bg-white/20 transition-colors"
        >
          Pular
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Slide content */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'tween', duration: 0.35, ease: 'easeInOut' }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 flex flex-col"
        >
          {/* Background image */}
          <div className="absolute inset-0">
            <img
              src={slide.image}
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex-1 flex flex-col justify-end pb-32 px-6 md:px-12 max-w-2xl mx-auto w-full">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="space-y-4"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 backdrop-blur-sm flex items-center justify-center border border-red-500/30">
                <SlideIcon className="w-7 h-7 text-red-400" />
              </div>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight font-playfair">
                {slide.title}
              </h2>

              {/* Description */}
              <p className="text-base md:text-lg text-white/75 leading-relaxed">
                {slide.description}
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                {slide.features.map((f) => (
                  <span
                    key={f}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/90 backdrop-blur-sm border border-white/10"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pb-8 px-6 md:px-12">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {/* Dots */}
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? 'w-8 bg-red-500' : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Next / CTA */}
          {isLast ? (
            <motion.button
              onClick={onComplete}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-red-500/30"
            >
              <Sparkles className="w-4 h-4" />
              Começar a Usar
            </motion.button>
          ) : (
            <button
              onClick={() => paginate(1)}
              className="px-5 py-3 rounded-full bg-white/10 backdrop-blur-sm text-white font-medium text-sm flex items-center gap-1.5 hover:bg-white/20 transition-colors"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default IntroCarousel;
