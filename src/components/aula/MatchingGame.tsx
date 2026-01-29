import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gamepad2, ChevronRight, CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import useSound from "use-sound";

interface Match {
  termo: string;
  definicao: string;
}

interface MatchingGameProps {
  matches: Match[];
  onProximo: () => void;
}

export const MatchingGame = ({ matches, onProximo }: MatchingGameProps) => {
  const [playCorrect] = useSound("/sounds/correct.mp3", { volume: 0.5 });
  const [playError] = useSound("/sounds/error.mp3", { volume: 0.3 });

  const [definicoes, setDefinicoes] = useState<string[]>([]);
  const [termoSelecionado, setTermoSelecionado] = useState<number | null>(null);
  const [acertos, setAcertos] = useState<Set<number>>(new Set());
  const [completo, setCompleto] = useState(false);
  const [draggedTermo, setDraggedTermo] = useState<number | null>(null);

  // Safety check for matches
  if (!matches || matches.length === 0) {
    return (
      <div className="min-h-screen pt-16 pb-8 px-3 flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground">Carregando jogo...</p>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    // Embaralhar definições
    const defs = [...matches.map(m => m.definicao)].sort(() => Math.random() - 0.5);
    setDefinicoes(defs);
  }, [matches]);

  const handleDragStart = (index: number) => {
    if (acertos.has(index)) return;
    setDraggedTermo(index);
    setTermoSelecionado(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (definicao: string) => {
    if (draggedTermo === null) return;
    
    const termoCorreto = matches[draggedTermo];
    
    if (termoCorreto.definicao === definicao) {
      // Acertou!
      playCorrect();
      const novosAcertos = new Set(acertos);
      novosAcertos.add(draggedTermo);
      setAcertos(novosAcertos);
      setTermoSelecionado(null);
      setDraggedTermo(null);
      
      if (novosAcertos.size === matches.length) {
        setCompleto(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } else {
      // Errou
      playError();
      setTimeout(() => {
        setTermoSelecionado(null);
        setDraggedTermo(null);
      }, 800);
    }
  };

  const handleTermoClick = (index: number) => {
    if (acertos.has(index)) return;
    if (termoSelecionado === index) {
      setTermoSelecionado(null);
      return;
    }
    setTermoSelecionado(index);
  };

  const handleDefinicaoClick = (definicao: string) => {
    if (termoSelecionado === null) return;
    
    const termoCorreto = matches[termoSelecionado];
    
    if (termoCorreto.definicao === definicao) {
      // Acertou!
      playCorrect();
      const novosAcertos = new Set(acertos);
      novosAcertos.add(termoSelecionado);
      setAcertos(novosAcertos);
      setTermoSelecionado(null);
      
      if (novosAcertos.size === matches.length) {
        setCompleto(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } else {
      // Errou
      playError();
      setTimeout(() => {
        setTermoSelecionado(null);
      }, 800);
    }
  };

  return (
    <div className="min-h-screen pt-16 pb-8 px-3 bg-gradient-to-br from-background to-accent/5">
      <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
        <Card className="p-4 md:p-5 border-2 border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-accent/10 rounded-lg p-2">
                <Gamepad2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold">Jogo de Matching</h2>
                <p className="text-xs text-muted-foreground">
                  Arraste ou clique para conectar
                </p>
              </div>
            </div>
            <div className="text-lg font-semibold bg-primary/10 px-3 py-1 rounded-lg">
              {acertos.size}/{matches.length}
            </div>
          </div>

          <div className="space-y-4">
            {/* Seção de Termos */}
            <div className="space-y-2">
              <h3 className="font-semibold text-xs uppercase text-muted-foreground px-2">
                Termos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matches.map((match, index) => (
                  <div
                    key={index}
                    draggable={!acertos.has(index)}
                    onDragStart={() => handleDragStart(index)}
                    onClick={() => handleTermoClick(index)}
                    className={`
                      p-3 rounded-lg border-2 text-sm font-medium cursor-move transition-all
                      ${acertos.has(index) 
                        ? "bg-green-500/20 border-green-500 opacity-60 cursor-not-allowed" 
                        : termoSelecionado === index
                        ? "border-primary bg-primary/10 shadow-lg scale-105"
                        : "border-border bg-card hover:border-primary/50 hover:bg-accent/5"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {acertos.has(index) && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                      <span className="line-clamp-2">{match.termo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seção de Definições */}
            <div className="space-y-2">
              <h3 className="font-semibold text-xs uppercase text-muted-foreground px-2">
                Definições
              </h3>
              <div className="space-y-2">
                {definicoes.map((def, index) => {
                  const estaAcertada = Array.from(acertos).some(
                    i => matches[i].definicao === def
                  );
                  
                  return (
                    <div
                      key={index}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(def)}
                      onClick={() => handleDefinicaoClick(def)}
                      className={`
                        p-3 rounded-lg border-2 text-sm transition-all min-h-[60px] flex items-center
                        ${estaAcertada
                          ? "bg-green-500/20 border-green-500 opacity-60 cursor-not-allowed"
                          : termoSelecionado !== null
                          ? "border-dashed border-accent/50 bg-accent/5 hover:bg-accent/10 cursor-pointer"
                          : "border-border bg-card/50 opacity-50"
                        }
                      `}
                    >
                      <span className="line-clamp-2">{def}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {!completo && (
            <p className="text-xs text-center mt-4 text-muted-foreground">
              💡 Arraste um termo até sua definição ou clique em ambos para conectar
            </p>
          )}
        </Card>

        {completo && (
          <div className="flex justify-end animate-fade-in">
            <Button
              onClick={onProximo}
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              Próximo: Flashcards
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
