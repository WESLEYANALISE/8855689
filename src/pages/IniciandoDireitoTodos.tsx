import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, BookOpen, Scale } from "lucide-react";
import { useCursosCache } from "@/hooks/useCursosCache";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface TemaData {
  tema: string;
  ordem: number;
  'capa-aula': string;
  'aula-link': string;
  area: string;
}

const CORES_AREAS: Record<string, string> = {
  "Direito Penal": "bg-red-600",
  "Direito Civil": "bg-blue-600",
  "Direito Constitucional": "bg-green-600",
  "Direito Administrativo": "bg-purple-600",
  "Direito Trabalhista": "bg-yellow-600",
  "Direito Empresarial": "bg-pink-600",
  "Direito Tributário": "bg-indigo-600",
  "Direito Processual Civil": "bg-cyan-600",
  "Direito Processual Penal": "bg-orange-600",
  "Direito do Trabalho": "bg-amber-600",
  "Processo Civil": "bg-cyan-600"
};

export default function IniciandoDireitoTodos() {
  const navigate = useNavigate();
  const [temas, setTemas] = useState<TemaData[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [temasPorArea, setTemasPorArea] = useState<Record<string, TemaData[]>>({});
  const [activeTab, setActiveTab] = useState("todos");
  const [loading, setLoading] = useState(true);

  const { cursos, loading: cursosLoading } = useCursosCache();

  useEffect(() => {
    if (!cursosLoading && cursos.length > 0) {
      const areasUnicas = Array.from(new Set(cursos.map((c: any) => c.area).filter(Boolean)));
      setAreas(areasUnicas.sort());

      const todosTemas = cursos.map((c: any) => ({
        tema: c.tema,
        ordem: c.ordem,
        'capa-aula': c['capa-aula'],
        'aula-link': c['aula-link'],
        area: c.area
      })).sort((a, b) => {
        if (a.area !== b.area) {
          return a.area.localeCompare(b.area);
        }
        return a.ordem - b.ordem;
      });

      const agrupados: Record<string, TemaData[]> = {};
      todosTemas.forEach(tema => {
        if (!agrupados[tema.area]) {
          agrupados[tema.area] = [];
        }
        agrupados[tema.area].push(tema);
      });
      
      setTemas(todosTemas);
      setTemasPorArea(agrupados);
      setLoading(false);
    }
  }, [cursos, cursosLoading]);

  const temasFiltrados = activeTab === "todos" ? temas : temas.filter(t => t.area === activeTab);
  const categorias = ["todos", ...areas];

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="max-w-[600px] lg:max-w-4xl mx-auto px-4 py-4">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[600px] lg:max-w-6xl mx-auto px-4 py-4">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2 px-1">
              {categorias.map(categoria => (
                <Button 
                  key={categoria} 
                  variant={activeTab === categoria ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setActiveTab(categoria)} 
                  className="whitespace-nowrap flex-shrink-0"
                >
                  {categoria === "todos" ? "Todos" : categoria}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="py-6">
        {activeTab === "todos" ? (
          /* Carrosséis por Área */
          <div className="space-y-12">
            {areas.map((area, areaIndex) => {
              const temasArea = temasPorArea[area] || [];
              const corArea = CORES_AREAS[area] || 'bg-gray-600';
              
              return (
                <div 
                  key={area} 
                  className="animate-fade-in" 
                  style={{
                    animationDelay: `${areaIndex * 0.15}s`,
                    animationFillMode: 'backwards'
                  }}
                >
                  {/* Header da Área */}
                  <div className="flex items-center justify-between gap-3 mb-4 px-4 max-w-[600px] lg:max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${corArea} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <Scale className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg md:text-xl font-bold text-foreground truncate">{area}</h2>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {temasArea.length} {temasArea.length === 1 ? 'tema' : 'temas'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setActiveTab(area)} 
                      size="sm" 
                      variant="outline" 
                      className="gap-1 md:gap-2 hover:bg-primary hover:text-primary-foreground transition-colors flex-shrink-0 text-xs md:text-sm px-3 md:px-4"
                    >
                      <span className="hidden sm:inline">Ver todos</span>
                      <span className="sm:hidden">Ver</span>
                      <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 rotate-180" />
                    </Button>
                  </div>

                  {/* Carrossel da Área */}
                  <Carousel 
                    opts={{
                      align: "start",
                      loop: false,
                      dragFree: true
                    }} 
                    className="w-full"
                  >
                    <CarouselContent className="-ml-3 md:-ml-4 pl-4">
                      {temasArea.map((temaData, index) => (
                        <CarouselItem 
                          key={`${area}-${index}`} 
                          className="pl-3 md:pl-4 basis-[65%] md:basis-[280px]"
                        >
                          <Card 
                            className="h-full cursor-pointer transition-all duration-300 overflow-hidden shadow-xl hover:shadow-2xl hover:scale-105 bg-card border-border/50 group" 
                            onClick={() => navigate(`/iniciando-direito/${encodeURIComponent(temaData.area)}/aula/${encodeURIComponent(temaData.tema)}`)}
                          >
                            {/* Imagem de capa */}
                            <div className="relative h-[160px] overflow-hidden bg-muted">
                              {temaData['capa-aula'] ? (
                                <>
                                  <img 
                                    src={temaData['capa-aula']} 
                                    alt={temaData.tema} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                    loading={areaIndex === 0 && index < 4 ? "eager" : "lazy"} 
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                </>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <BookOpen className="w-16 h-16 text-accent/50" />
                                </div>
                              )}
                              <div className="absolute top-3 right-3">
                                <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold">
                                  Aula {temaData.ordem}
                                </div>
                              </div>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className={`${corArea} rounded-full p-4 opacity-80 group-hover:opacity-95 group-hover:scale-110 transition-all duration-300 shadow-2xl backdrop-blur-sm`}>
                                  <Play className="w-8 h-8 text-white fill-white" />
                                </div>
                              </div>
                            </div>

                            <CardContent className="p-3">
                              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-300 mb-1.5 line-clamp-2 leading-tight">
                                {temaData.tema}
                              </h3>
                              
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Play className="w-3 h-3" />
                                <span>Videoaula + Conteúdo</span>
                              </div>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                  </Carousel>
                </div>
              );
            })}
          </div>
        ) : (
          /* Timeline/Lista para área específica */
          <div className="max-w-[600px] mx-auto px-4">
            <div className="relative space-y-6">
              {/* Linha vertical */}
              <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-border" />

              {temasFiltrados.map((temaData, index) => {
                const corArea = CORES_AREAS[temaData.area] || 'bg-gray-600';
                
                return (
                  <div 
                    key={`${temaData.area}-${index}`} 
                    className="relative pl-8 animate-fade-in-up" 
                    style={{
                      animationDelay: `${index * 0.08}s`,
                      animationFillMode: 'backwards'
                    }}
                  >
                    {/* Marcador colorido */}
                    <div 
                      className={`absolute left-0 top-4 w-7 h-7 rounded-full ${corArea} border-4 border-background flex items-center justify-center shadow-xl animate-bounce-in`} 
                      style={{
                        animationDelay: `${index * 0.08 + 0.2}s`,
                        animationFillMode: 'backwards'
                      }}
                    >
                      <span className="text-xs font-bold text-white">{temaData.ordem}</span>
                    </div>
                    
                    {/* Card do tema */}
                    <button 
                      onClick={() => navigate(`/iniciando-direito/${encodeURIComponent(temaData.area)}/aula/${encodeURIComponent(temaData.tema)}`)} 
                      className="w-full text-left relative overflow-hidden backdrop-blur-sm border-2 border-border/50 rounded-lg hover:border-primary hover:shadow-2xl shadow-xl transition-all duration-300 group hover:scale-[1.02] bg-card"
                    >
                      {/* Imagem de capa */}
                        {temaData['capa-aula'] && (
                          <div className="relative h-32 overflow-hidden bg-muted">
                            <img 
                              src={temaData['capa-aula']} 
                              alt={temaData.tema} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              loading={index < 5 ? "eager" : "lazy"} 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                            <div className="absolute top-2 right-2">
                              <div className={`${corArea} text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg`}>
                                Aula {temaData.ordem}
                              </div>
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                              <div className={`${corArea} rounded-full p-3 opacity-80 group-hover:opacity-95 group-hover:scale-110 transition-all duration-300 shadow-2xl backdrop-blur-sm`}>
                                <Play className="w-6 h-6 text-white fill-white" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Conteúdo */}
                        <div className="p-3 relative z-10">
                          <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors duration-300 mb-1">
                            {temaData.tema}
                          </h3>
                          
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                            <Play className="w-3 h-3" />
                            <span>Videoaula + Conteúdo Detalhado</span>
                          </div>
                        </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {temasFiltrados.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Nenhum tema encontrado para esta área.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
