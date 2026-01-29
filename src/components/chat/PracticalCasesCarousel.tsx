import { useState } from "react";
import ReactCardFlip from "react-card-flip";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Scale, Lightbulb } from "lucide-react";

interface PracticalCase {
  title: string;
  scenario: string;
  analysis: string;
  solution: string;
  legalBasis: string[];
  icon?: string;
}

interface PracticalCasesCarouselProps {
  cases: PracticalCase[];
  title?: string;
}

export const PracticalCasesCarousel = ({ cases, title }: PracticalCasesCarouselProps) => {
  const [flippedStates, setFlippedStates] = useState<boolean[]>(
    cases.map(() => false)
  );

  const handleFlip = (index: number) => {
    setFlippedStates(prev => {
      const newStates = [...prev];
      newStates[index] = !newStates[index];
      return newStates;
    });
  };

  if (cases.length === 0) return null;

  return (
    <div className="w-full py-6 my-6">
      {title && (
        <h3 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
          <Scale className="w-7 h-7 text-primary" />
          {title}
        </h3>
      )}
      
      <Carousel className="w-full">
        <CarouselContent>
          {cases.map((caseItem, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-2">
                <ReactCardFlip isFlipped={flippedStates[index]} flipDirection="horizontal">
                  {/* FRENTE: Cenário */}
                  <Card 
                    className="min-h-[400px] cursor-pointer hover:shadow-xl transition-all border-2 border-primary/30"
                    onClick={() => handleFlip(index)}
                  >
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-4xl">{caseItem.icon || "⚖️"}</span>
                        <Badge variant="outline" className="text-xs">Caso {index + 1}</Badge>
                      </div>
                      
                      <h4 className="text-xl font-bold mb-4 text-primary leading-tight">
                        {caseItem.title}
                      </h4>
                      
                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                            📋 Situação
                          </p>
                          <p className="text-base leading-relaxed">
                            {caseItem.scenario}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground text-center mt-6 pt-4 border-t">
                        👆 Clique para ver a análise jurídica
                      </p>
                    </CardContent>
                  </Card>

                  {/* VERSO: Análise + Solução */}
                  <Card 
                    className="min-h-[400px] cursor-pointer hover:shadow-xl transition-all border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-background"
                    onClick={() => handleFlip(index)}
                  >
                    <CardContent className="p-6 flex flex-col h-full space-y-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-3xl">💡</span>
                        <Badge className="text-xs">Análise</Badge>
                      </div>

                      <div className="flex-1 space-y-4 overflow-y-auto">
                        <div>
                          <p className="text-sm font-semibold mb-2 text-primary uppercase tracking-wide flex items-center gap-1">
                            <Lightbulb className="w-4 h-4" />
                            Análise Jurídica
                          </p>
                          <p className="text-base leading-relaxed">
                            {caseItem.analysis}
                          </p>
                        </div>
                        
                        <div className="bg-background/80 rounded-lg p-4 border border-primary/20">
                          <p className="text-sm font-semibold mb-2 text-primary uppercase tracking-wide">
                            ✅ Solução Fundamentada
                          </p>
                          <p className="text-base leading-relaxed mb-3">
                            {caseItem.solution}
                          </p>
                          
                          {caseItem.legalBasis && caseItem.legalBasis.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-primary/10">
                              <p className="text-xs font-semibold mb-2 text-muted-foreground">
                                📜 Base Legal:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {caseItem.legalBasis.map((basis, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {basis}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground text-center pt-4 border-t">
                        👆 Clique para voltar ao cenário
                      </p>
                    </CardContent>
                  </Card>
                </ReactCardFlip>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {cases.length > 1 && (
          <>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </>
        )}
      </Carousel>
      
      <div className="flex justify-center mt-4">
        <div className="flex gap-2">
          {cases.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all ${
                flippedStates[index] ? 'bg-primary w-4' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
