import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownSlidesProps {
  title: string;
  slides: Array<{
    title: string;
    content: string;
  }>;
}

export const MarkdownSlides = ({ title, slides }: MarkdownSlidesProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  return (
    <div className="my-6 space-y-4">
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      
      <Card className="p-6 min-h-[300px] relative bg-card">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h4 className="text-lg font-semibold mb-4">{slides[currentSlide].title}</h4>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{slides[currentSlide].content}</ReactMarkdown>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={prevSlide}
          disabled={currentSlide === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        
        <span className="text-sm text-muted-foreground">
          {currentSlide + 1} / {slides.length}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
