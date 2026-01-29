import { useNavigate } from "react-router-dom";
import { Headphones, Brain, BookOpen, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AudioaulasAreaCardProps {
  area: string;
  count: number;
  tipo: string;
  index: number;
}

const AudioaulasAreaCard = ({ area, count, tipo, index }: AudioaulasAreaCardProps) => {
  const navigate = useNavigate();

  const gradientColors = [
    { from: "from-rose-600", to: "to-rose-800", glow: "hsl(0, 70%, 50%)" },
    { from: "from-purple-600", to: "to-purple-800", glow: "hsl(270, 70%, 50%)" },
    { from: "from-blue-600", to: "to-blue-800", glow: "hsl(220, 70%, 50%)" },
    { from: "from-cyan-600", to: "to-cyan-800", glow: "hsl(190, 70%, 50%)" },
    { from: "from-emerald-600", to: "to-emerald-800", glow: "hsl(160, 70%, 50%)" },
    { from: "from-orange-600", to: "to-orange-800", glow: "hsl(30, 70%, 50%)" },
    { from: "from-pink-600", to: "to-pink-800", glow: "hsl(330, 70%, 50%)" },
  ];

  const getIcon = () => {
    switch (tipo) {
      case "flashcards": return Brain;
      case "resumos": return BookOpen;
      default: return Headphones;
    }
  };

  const Icon = getIcon();
  const colors = gradientColors[index % gradientColors.length];

  return (
    <Card
      onClick={() => navigate(`/audioaulas/${tipo}/${encodeURIComponent(area)}`)}
      className="cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all border-0 bg-card/50 backdrop-blur-sm group overflow-hidden"
    >
      <CardContent className="p-4 flex items-center gap-4">
        {/* Icon with gradient */}
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-foreground line-clamp-1">{area}</h3>
          <p className="text-muted-foreground text-xs mt-1">
            {count} {count === 1 ? "áudio" : "áudios"} disponíveis
          </p>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0" />
      </CardContent>
    </Card>
  );
};

export default AudioaulasAreaCard;
