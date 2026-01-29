import { Shuffle, Layers, Timer, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AudioaulasModosProps {
  onSelectMode: (mode: string) => void;
}

const AudioaulasModos = ({ onSelectMode }: AudioaulasModosProps) => {
  const modos = [
    {
      id: "aleatorio",
      icon: Shuffle,
      label: "Aleatório",
      description: "Mix de todas as áreas",
      gradient: "from-orange-500 to-red-600",
    },
    {
      id: "sequencial",
      icon: Layers,
      label: "Por Área",
      description: "Escolha seu tema",
      gradient: "from-blue-500 to-purple-600",
    },
    {
      id: "maratona",
      icon: Timer,
      label: "Maratona",
      description: "1h de conteúdo",
      gradient: "from-green-500 to-teal-600",
    },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Play className="w-5 h-5 text-accent" />
        Como você quer estudar?
      </h2>

      <div className="grid grid-cols-3 gap-3">
        {modos.map((modo) => (
          <Card
            key={modo.id}
            onClick={() => onSelectMode(modo.id)}
            className="cursor-pointer hover:scale-105 transition-all border-0 overflow-hidden group"
          >
            <CardContent className={`p-4 bg-gradient-to-br ${modo.gradient} relative`}>
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <modo.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-white text-sm">{modo.label}</h3>
                <p className="text-white/70 text-xs mt-1 line-clamp-1">{modo.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AudioaulasModos;
