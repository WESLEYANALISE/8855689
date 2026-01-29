import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { motion } from "framer-motion";

interface ComparisonCard {
  title: string;
  description: string;
  example?: string;
  icon?: string;
}

interface ComparisonCarouselProps {
  cards: ComparisonCard[];
  title?: string;
}

export const ComparisonCarousel = ({ cards, title }: ComparisonCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!cards || cards.length === 0) return null;

  return (
    <motion.div 
      className="my-6 space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {title && (
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      )}

      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {cards.map((card, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
                  <CardContent className="p-6 space-y-4 h-full flex flex-col">
                    {card.icon && (
                      <div className="text-4xl mb-2">{card.icon}</div>
                    )}
                    
                    <div>
                      <h4 className="font-bold text-lg text-foreground mb-2">
                        {card.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    {card.example && (
                      <div className="mt-auto pt-4 border-t border-border">
                        <p className="text-xs font-semibold text-primary mb-1">
                          💡 Exemplo:
                        </p>
                        <p className="text-xs text-foreground leading-relaxed">
                          {card.example}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="flex justify-center gap-2 mt-4">
          <CarouselPrevious className="relative left-0 translate-y-0" />
          <CarouselNext className="relative right-0 translate-y-0" />
        </div>
      </Carousel>

      <div className="flex justify-center gap-2 mt-2">
        {cards.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? "bg-primary w-4"
                : "bg-primary/30"
            }`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Ir para card ${index + 1}`}
          />
        ))}
      </div>
    </motion.div>
  );
};
