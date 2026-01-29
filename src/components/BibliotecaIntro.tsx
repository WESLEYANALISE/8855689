import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BibliotecaIntroProps {
  titulo: string;
  sobre: string;
  capaUrl: string | null;
  totalLivros?: number;
  onAcessar: () => void;
}

export const BibliotecaIntro = ({
  titulo,
  sobre,
  capaUrl,
  totalLivros,
  onAcessar
}: BibliotecaIntroProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 px-4 py-8 flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl animate-scale-in">
          {/* Capa */}
          <div className="relative h-[220px] overflow-hidden">
            {capaUrl ? (
              <img 
                src={capaUrl} 
                alt={titulo} 
                className="w-full h-full object-cover"
                loading="eager"
                decoding="sync"
                fetchPriority="high"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                <BookOpen className="w-24 h-24 text-accent opacity-50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-xl font-bold text-white mb-2 text-center">
                {titulo}
              </h1>
              {totalLivros && (
                <p className="text-white/90 text-sm font-medium bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg text-center mx-auto w-fit">
                  📚 {totalLivros} {totalLivros === 1 ? 'livro disponível' : 'livros disponíveis'}
                </p>
              )}
            </div>
          </div>

          {/* Botão Acessar - Centralizado */}
          <div className="p-4 flex justify-center">
            <Button 
              onClick={onAcessar} 
              size="default" 
              className="w-full px-8 py-5 text-base font-semibold bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 transform hover:scale-105 transition-all shadow-lg"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Acessar Biblioteca
            </Button>
          </div>

          {/* Sobre */}
          <div className="px-4 pb-5">
            <h2 className="text-base font-bold mb-2 flex items-center justify-center gap-2 text-accent">
              <BookOpen className="w-4 h-4" />
              Sobre esta Biblioteca
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed text-center">
              {sobre}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};