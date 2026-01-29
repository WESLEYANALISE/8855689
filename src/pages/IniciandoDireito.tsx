import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCursosCache } from "@/hooks/useCursosCache";

interface AreaData {
  area: string;
  temasCount: number;
  color: string;
  glow: string;
  description: string;
  icon: string;
}

const CORES_AREAS: Record<string, { color: string; glow: string; description: string; icon: string }> = {
  "Direito Penal": { 
    color: "from-red-500 to-rose-600", 
    glow: "shadow-red-500/20",
    description: "Fundamentos do Direito Penal, crimes e suas penalidades",
    icon: "⚖️"
  },
  "Direito Civil": { 
    color: "from-blue-500 to-cyan-600", 
    glow: "shadow-blue-500/20",
    description: "Relações entre particulares, contratos e responsabilidades",
    icon: "📋"
  },
  "Direito do Trabalho": { 
    color: "from-amber-500 to-orange-600", 
    glow: "shadow-amber-500/20",
    description: "Relações trabalhistas, direitos e deveres",
    icon: "💼"
  },
  "Direito Constitucional": { 
    color: "from-emerald-500 to-green-600", 
    glow: "shadow-emerald-500/20",
    description: "Fundamentos da Constituição Federal",
    icon: "🏛️"
  }
};

const LEARNING_TOPICS = [
  "Fundamentos essenciais de cada área do Direito",
  "Conceitos práticos aplicáveis ao dia a dia",
  "Estrutura e organização do sistema jurídico brasileiro",
  "Base sólida para aprofundamento em temas específicos",
  "Metodologia didática e acessível para todos os níveis"
];

export default function IniciandoDireito() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  
  const { cursos, loading: cursosLoading } = useCursosCache();

  useEffect(() => {
    if (!cursosLoading && cursos.length > 0) {
      processarAreas();
    }
  }, [cursos, cursosLoading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    // Observar todas as seções
    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [loading]);

  const processarAreas = () => {
    const areasMap = new Map<string, number>();
    
    cursos.forEach((curso: any) => {
      if (curso.area) {
        areasMap.set(curso.area, (areasMap.get(curso.area) || 0) + 1);
      }
    });

    const areasProcessadas: AreaData[] = Array.from(areasMap.entries()).map(([area, count]) => ({
      area,
      temasCount: count,
      color: CORES_AREAS[area]?.color || "from-gray-500 to-gray-600",
      glow: CORES_AREAS[area]?.glow || "shadow-gray-500/20",
      description: CORES_AREAS[area]?.description || "Explore os fundamentos desta área do Direito",
      icon: CORES_AREAS[area]?.icon || "📚"
    }));

    setAreas(areasProcessadas);
    setLoading(false);
  };

  const handleAreaClick = (area: string) => {
    navigate(`/iniciando-direito/${encodeURIComponent(area)}/sobre`);
  };

  const scrollToModules = () => {
    document.getElementById('modulos')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4">
        <div className="text-center space-y-3 md:space-y-4">
          <GraduationCap className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground text-sm md:text-base">Carregando módulos do curso...</p>
        </div>
      </div>
    );
  }

  const totalTemas = areas.reduce((acc, area) => acc + area.temasCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <section 
        id="hero-section"
        data-animate
        className={`relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-rose-800 pt-16 md:pt-20 pb-24 md:pb-32 px-3 md:px-4 transition-all duration-1000 ${
          visibleElements.has('hero-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08),transparent_40%)]" />
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 animate-fade-in text-xs md:text-sm">
              <GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4 text-white animate-pulse" />
              <span className="text-white font-medium">Comece sua jornada jurídica</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight animate-scale-in px-2">
              Iniciando o Direito
            </h1>
            
            <p className="text-base md:text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto animate-fade-in px-2" style={{ animationDelay: '0.2s' }}>
              Sua jornada no mundo jurídico começa aqui
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 pt-2 md:pt-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-2xl md:text-3xl font-bold text-white">{areas.length}</div>
                <div className="text-xs md:text-sm text-white/80">Áreas</div>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-2xl md:text-3xl font-bold text-white">{totalTemas}+</div>
                <div className="text-xs md:text-sm text-white/80">Temas</div>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-2xl md:text-3xl font-bold text-white">2026</div>
                <div className="text-xs md:text-sm text-white/80">Atualizado</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Módulos do Curso */}
      <section 
        id="modulos" 
        data-animate
        className={`py-12 md:py-16 px-3 md:px-4 transition-all duration-1000 ${
          visibleElements.has('modulos') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-3 md:space-y-4 mb-8 md:mb-12 px-2">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground flex items-center justify-center gap-2 md:gap-3 animate-fade-in">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-primary animate-pulse" />
              Módulos do Curso
            </h2>
            <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Explore cada área do Direito de forma estruturada e didática
            </p>
          </div>

          <div className="grid gap-3 md:gap-4 lg:gap-6 pb-16 md:pb-20">
            {areas.map((area, index) => (
              <Card 
                key={area.area}
                id={`card-${index}`}
                data-animate
                className={`group cursor-pointer transition-all duration-500 hover:scale-[1.01] md:hover:scale-[1.02] hover:shadow-xl md:hover:shadow-2xl border-2 overflow-hidden ${
                  visibleElements.has(`card-${index}`) 
                    ? 'opacity-100 translate-x-0' 
                    : index % 2 === 0 
                      ? 'opacity-0 -translate-x-10' 
                      : 'opacity-0 translate-x-10'
                }`}
                style={{
                  transitionDelay: `${index * 0.15}s`
                }}
                onClick={() => handleAreaClick(area.area)}
              >
                <div className={`h-1.5 md:h-2 bg-gradient-to-r ${area.color}`} />
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex gap-3 md:gap-4 items-start">
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br ${area.color} flex items-center justify-center text-xl md:text-2xl lg:text-3xl shadow-lg ${area.glow} transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-300`}>
                        {area.icon}
                      </div>
                      <span className={`absolute -top-1 -right-1 md:-top-2 md:-right-2 text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full bg-gradient-to-r ${area.color} text-white whitespace-nowrap shadow-md`}>
                        Módulo {index + 1}
                      </span>
                    </div>
                    
                    <div className="flex-1 space-y-1.5 md:space-y-2 min-w-0">
                      <h3 className="text-base md:text-lg lg:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {area.area}
                      </h3>
                      
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2 md:line-clamp-none">
                        {area.description}
                      </p>
                      
                      <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground pt-1">
                        <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                        <span className="font-medium">{area.temasCount} temas disponíveis</span>
                      </div>
                    </div>
                    
                    <ArrowRight className="hidden sm:block w-5 h-5 md:w-6 md:h-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 self-center" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* O que você vai aprender */}
      <section 
        id="learning-section"
        data-animate
        className={`py-12 md:py-16 px-3 md:px-4 bg-muted/30 transition-all duration-1000 ${
          visibleElements.has('learning-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-3 md:space-y-4 mb-8 md:mb-12 px-2">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground animate-fade-in">
              O que você vai aprender
            </h2>
            <p className="text-sm md:text-base lg:text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Desenvolva uma base sólida no conhecimento jurídico
            </p>
          </div>

          <div className="grid gap-3 md:gap-4 pb-16 md:pb-20">
            {LEARNING_TOPICS.map((topic, index) => (
              <div 
                key={index}
                id={`topic-${index}`}
                data-animate
                className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 lg:p-6 bg-card rounded-lg md:rounded-xl border shadow-sm hover:shadow-lg hover:scale-[1.01] md:hover:scale-[1.02] transition-all duration-300 ${
                  visibleElements.has(`topic-${index}`) 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 -translate-x-5'
                }`}
                style={{
                  transitionDelay: `${index * 0.1}s`
                }}
              >
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0 mt-0.5 animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }} />
                <p className="text-foreground text-sm md:text-base lg:text-lg leading-relaxed">{topic}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre o Curso */}
      <section 
        id="about-section"
        data-animate
        className={`py-12 md:py-16 px-3 md:px-4 transition-all duration-1000 ${
          visibleElements.has('about-section') ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="container mx-auto max-w-4xl pb-16 md:pb-20">
          <Card className="border-2 hover:shadow-xl md:hover:shadow-2xl transition-shadow duration-500">
            <CardContent className="p-6 md:p-8 lg:p-12 space-y-4 md:space-y-6">
              <div className="text-center space-y-3 md:space-y-4">
                <GraduationCap className="w-10 h-10 md:w-12 md:h-12 text-primary mx-auto animate-pulse" />
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
                  Sobre este Curso
                </h2>
              </div>
              
              <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none text-muted-foreground space-y-3 md:space-y-4">
                <p className="text-center leading-relaxed text-sm md:text-base">
                  O curso <strong className="text-foreground">Iniciando o Direito</strong> foi desenvolvido para proporcionar 
                  uma base sólida e acessível sobre as principais áreas do Direito brasileiro. 
                  Com uma metodologia didática e exemplos práticos, você compreenderá os 
                  conceitos fundamentais de cada área.
                </p>
                
                <p className="text-center leading-relaxed text-sm md:text-base">
                  Ideal para estudantes, concurseiros e qualquer pessoa interessada em 
                  entender melhor o sistema jurídico nacional.
                </p>
              </div>

              <div className="text-center pt-4 md:pt-6">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={scrollToModules}
                  className="font-semibold hover:scale-105 transition-transform duration-300 text-sm md:text-base"
                >
                  <ArrowRight className="mr-2 w-4 h-4 md:w-5 md:h-5 rotate-180" />
                  Voltar aos Módulos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
