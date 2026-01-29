import { memo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { LivroCarouselCard } from "@/components/LivroCarouselCard";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface BibliotecaItem {
  id: number;
  Tema: string | null;
  "Capa-livro": string | null;
}

interface AreaLivrosCarouselProps {
  area: string;
  livros: BibliotecaItem[];
  totalLivros: number;
  onVerTodos: (area: string) => void;
  onLivroClick: (id: number) => void;
}

// Animation variants para cascata
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
};

export const AreaLivrosCarousel = memo(({
  area,
  livros,
  totalLivros,
  onVerTodos,
  onLivroClick,
}: AreaLivrosCarouselProps) => {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    skipSnaps: true,
  });

  return (
    <div className="space-y-3">
      {/* Header with area name and "Ver Todos" button */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-foreground">
            {area}
          </h2>
          {livros.length < totalLivros && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Mostrando {livros.length} de {totalLivros} livros
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          onClick={() => onVerTodos(area)}
          className="bg-accent/20 hover:bg-accent/30 text-accent font-medium text-sm group shrink-0"
        >
          Ver Todos
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      {/* Carousel of books with cascade animation */}
      <div className="overflow-hidden" ref={emblaRef}>
        <motion.div 
          className="flex gap-3 pl-1"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {livros.map((livro, index) => (
            <motion.div key={livro.id} variants={cardVariants}>
              <LivroCarouselCard
                titulo={livro.Tema || "Sem título"}
                capaUrl={livro["Capa-livro"]}
                onClick={() => onLivroClick(livro.id)}
                numero={index + 1}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison para evitar re-renders desnecessários
  return (
    prevProps.area === nextProps.area &&
    prevProps.livros.length === nextProps.livros.length &&
    prevProps.totalLivros === nextProps.totalLivros &&
    prevProps.livros[0]?.id === nextProps.livros[0]?.id
  );
});
