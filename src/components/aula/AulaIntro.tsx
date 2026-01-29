import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Sparkles, BookOpen, Gamepad2, Brain, Trophy } from "lucide-react";
import { AulasListagemProntas } from "./AulasListagemProntas";

interface AulaIntroProps {
  onIniciar: (tema: string) => void;
  onSelecionarAulaPronta: (estrutura: any, aulaId: string) => void;
  isLoading: boolean;
}

export const AulaIntro = ({ onIniciar, onSelecionarAulaPronta, isLoading }: AulaIntroProps) => {
  const [tema, setTema] = useState("");

  const exemplos = [
    "Princípios Penais",
    "Contratos",
    "Direitos Fundamentais",
    "Processo Penal"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-3 sm:p-4">
      <Card className="max-w-3xl w-full p-4 sm:p-6 space-y-4 animate-fade-in border border-primary/20">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Aulas Interativas
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Crie uma nova aula ou escolha uma das aulas prontas
          </p>
        </div>

        <Tabs defaultValue="criar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="criar" className="text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Criar Nova
            </TabsTrigger>
            <TabsTrigger value="prontas" className="text-xs sm:text-sm">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Aulas Prontas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="criar" className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
              <div className="flex items-start gap-2 p-2 sm:p-3 bg-card/50 rounded-lg border border-border">
                <BookOpen className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm">Teoria</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Conceitos fundamentais</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 sm:p-3 bg-card/50 rounded-lg border border-border">
                <Gamepad2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm">Matching</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Conecte termos</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 sm:p-3 bg-card/50 rounded-lg border border-border">
                <Brain className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm">Flashcards</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Revise conceitos</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 sm:p-3 bg-card/50 rounded-lg border border-border">
                <Trophy className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm">Prova Final</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Teste com timer</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium mb-1.5 block">
                Sobre qual tema você quer criar uma aula?
              </label>
              <Textarea
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ex: Princípios do Direito Penal"
                className="min-h-[70px] sm:min-h-[80px] resize-none text-sm"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Sugestões:</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {exemplos.map((exemplo) => (
                  <Button
                    key={exemplo}
                    variant="outline"
                    size="sm"
                    onClick={() => setTema(exemplo)}
                    disabled={isLoading}
                    className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                  >
                    {exemplo}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => onIniciar(tema)}
              disabled={!tema.trim() || isLoading}
              className="w-full h-10 sm:h-12 text-sm sm:text-base bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  Criando sua aula...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Gerar Aula
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="prontas">
            <AulasListagemProntas onSelecionarAula={onSelecionarAulaPronta} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
