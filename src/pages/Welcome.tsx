import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Video, Brain, Library, Scale, FileText, Globe, 
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallback } from 'react';

import themisFull from '@/assets/themis-full.webp';
import welcome1 from '@/assets/landing/welcome-1.webp';
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

  const handleAcessar = useCallback(() => {
    navigate('/auth');
  }, [navigate]);

  // Triple screenshots for seamless infinite loop
  const tripledScreenshots = [...screenshots, ...screenshots, ...screenshots];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[65vh] flex flex-col items-center justify-center overflow-hidden pb-4">
        <div className="absolute inset-0">
          <img src={themisFull} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-background" />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          <h2 
            className="text-primary font-serif text-lg md:text-xl mb-4 tracking-widest uppercase opacity-0 animate-[welcomeFadeUp_0.8s_ease-out_forwards]"
          >
            Direito Premium
          </h2>
          <h1 
            className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 opacity-0 animate-[welcomeFadeUp_0.8s_ease-out_0.2s_forwards]"
          >
            Tudo que você precisa para{' '}
            <span className="text-primary">dominar o Direito</span>
          </h1>
          <p 
            className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed opacity-0 animate-[welcomeFadeUp_0.8s_ease-out_0.4s_forwards]"
          >
            A ferramenta completa para estudar Direito: aulas, leis, flashcards, IA e muito mais.
          </p>
          <div className="opacity-0 animate-[welcomeFadeUp_0.8s_ease-out_0.6s_forwards]">
            <Button 
              size="lg" 
              onClick={handleAcessar}
              className="text-lg px-10 py-6 rounded-full shadow-lg shadow-primary/20 transition-all"
            >
              Acessar
              <ChevronRight className="ml-1 h-5 w-5 animate-[bounce-right_1s_ease-in-out_infinite]" />
            </Button>
          </div>
        </div>
      </section>

      {/* Carrossel contínuo de Screenshots */}
      <section className="py-8 bg-card/50">
        <div className="overflow-hidden">
          <div
            className="flex gap-3 w-max"
            style={{
              animation: 'scroll-carousel 60s linear infinite',
              willChange: 'transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          >
            {tripledScreenshots.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Screenshot ${(i % screenshots.length) + 1} do app`}
                className="rounded-xl border border-border shadow-lg h-[280px] w-auto object-contain flex-shrink-0"
                fetchPriority="high"
                decoding="async"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 opacity-0 animate-[welcomeFadeUp_0.6s_ease-out_forwards]">
            Tudo que você precisa
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border opacity-0 animate-[welcomeFadeUp_0.4s_ease-out_forwards]"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <f.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 text-center">
        <div>
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
        </div>
      </section>

      <style>{`
        @keyframes bounce-right {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        @keyframes scroll-carousel {
          0% { transform: translateZ(0) translateX(0); }
          100% { transform: translateZ(0) translateX(-33.333%); }
        }
        @keyframes welcomeFadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Welcome;
