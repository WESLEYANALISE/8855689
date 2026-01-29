import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Home, RotateCw, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface AulaResultadoProps {
  titulo: string;
  acertos: number;
  total: number;
  onRefazer: () => void;
}

export const AulaResultado = ({ titulo, acertos, total, onRefazer }: AulaResultadoProps) => {
  const navigate = useNavigate();
  const porcentagem = Math.round((acertos / total) * 100);
  const aprovado = porcentagem >= 70;

  useEffect(() => {
    if (aprovado) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
    }
  }, [aprovado]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="max-w-2xl w-full p-8 space-y-6 animate-scale-in border-2 border-primary/20">
        <div className="text-center space-y-4">
          <div className={`inline-block rounded-2xl p-4 shadow-lg ${
            aprovado ? "bg-gradient-to-br from-green-500 to-green-600" : "bg-gradient-to-br from-amber-500 to-amber-600"
          }`}>
            <Trophy className="w-16 h-16 text-white" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold">
            {aprovado ? "Parabéns!" : "Quase lá!"}
          </h1>
          
          <p className="text-muted-foreground text-lg">
            Você completou a aula: <span className="font-semibold text-foreground">{titulo}</span>
          </p>
        </div>

        <div className="bg-card/50 rounded-xl p-8 border-2 border-primary/20">
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {porcentagem}%
            </div>
            
            <div className="text-lg text-muted-foreground">
              Você acertou <span className="font-bold text-foreground">{acertos}</span> de <span className="font-bold text-foreground">{total}</span> questões
            </div>

            <div className="flex justify-center gap-1 pt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 ${
                    i < Math.floor(porcentagem / 20)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {aprovado ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-center text-sm">
              🎉 <strong>Aprovado!</strong> Você demonstrou domínio sobre o conteúdo!
            </p>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <p className="text-center text-sm">
              💪 Continue estudando! Você pode refazer a aula para melhorar sua nota.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onRefazer}
            className="gap-2"
          >
            <RotateCw className="w-5 h-5" />
            Refazer Aula
          </Button>

          <Button
            size="lg"
            onClick={() => navigate("/chat-professora")}
            className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Home className="w-5 h-5" />
            Voltar ao Início
          </Button>
        </div>
      </Card>
    </div>
  );
};
