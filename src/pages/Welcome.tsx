import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, Video, Brain, Library, Scale, FileText, Globe, 
  ChevronRight, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useRef, useState, useCallback, useEffect } from 'react';

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

const Welcome = () => {
  const navigate = useNavigate();
  const autoplayPlugin = useRef(Autoplay({ delay: 2500, stopOnInteraction: false }));
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 1 },
    [autoplayPlugin.current]
  );

  const handleAcessar = useCallback(() => {
    navigate('/auth');
  }, [navigate]);

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
              onClick={handleAcessar}
              className="text-lg px-10 py-6 rounded-full shadow-lg shadow-primary/20 transition-all"
            >
              Acessar
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Carrossel de Screenshots - 2.5 visíveis */}
      <section className="py-16 px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center px-6">
            <Sparkles className="inline h-6 w-6 text-primary mr-2" />
            Conheça o App
          </h2>
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {screenshots.map((img, i) => (
                <div
                  key={i}
                  className="flex-[0_0_40%] min-w-0 pl-3 first:pl-4"
                >
                  <img
                    src={img}
                    alt={`Screenshot ${i + 1} do app`}
                    className="rounded-xl border border-border shadow-lg w-full object-contain"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
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
            onClick={handleAcessar}
            className="text-xl px-12 py-7 rounded-full shadow-xl animate-pulse shadow-primary/30 transition-all"
          >
            Acessar Gratuitamente <ChevronRight className="ml-2 h-6 w-6" />
          </Button>
          <p className="text-muted-foreground mt-4 text-sm">
            Cadastro rápido e gratuito
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default Welcome;
