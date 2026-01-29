import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Target, Lightbulb, Layers, HelpCircle, Check } from "lucide-react";

interface Etapa {
  id: string;
  nome: string;
  icon: React.ComponentType<{ className?: string }>;
  completada: boolean;
}

interface JornadaEtapasProps {
  etapaAtual: string;
  etapas: Etapa[];
  onEtapaChange: (etapa: string) => void;
  children: React.ReactNode;
}

export const JornadaEtapas = ({ 
  etapaAtual, 
  etapas, 
  onEtapaChange,
  children 
}: JornadaEtapasProps) => {
  return (
    <Tabs value={etapaAtual} onValueChange={onEtapaChange} className="w-full">
      <TabsList className="w-full h-auto flex-wrap gap-1 bg-muted/50 p-1">
        {etapas.map((etapa) => {
          const Icon = etapa.icon;
          return (
            <TabsTrigger
              key={etapa.id}
              value={etapa.id}
              className="flex-1 min-w-[60px] gap-1 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{etapa.nome}</span>
              {etapa.completada && (
                <Check className="w-3 h-3 absolute -top-1 -right-1 text-green-500 bg-background rounded-full" />
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
      
      {children}
    </Tabs>
  );
};

export const etapasConfig: Etapa[] = [
  { id: "leitura", nome: "Leitura", icon: BookOpen, completada: false },
  { id: "pratica", nome: "Prática", icon: Target, completada: false },
  { id: "conceitos", nome: "Conceitos", icon: Lightbulb, completada: false },
  { id: "flashcards", nome: "Flashcards", icon: Layers, completada: false },
  { id: "quiz", nome: "Quiz", icon: HelpCircle, completada: false },
];
