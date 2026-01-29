import { useNavigate } from "react-router-dom";
import { Headphones, Brain, BookOpen, Flame } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface AreaItem {
  area: string;
  count: number;
  tipo: string;
}

interface AudioaulasCarouselEmAltaProps {
  areas: AreaItem[];
}

const AudioaulasCarouselEmAlta = ({ areas }: AudioaulasCarouselEmAltaProps) => {
  const navigate = useNavigate();

  const gradientColors = [
    "from-rose-600 to-rose-800",
    "from-purple-600 to-purple-800",
    "from-blue-600 to-blue-800",
    "from-cyan-600 to-cyan-800",
    "from-emerald-600 to-emerald-800",
    "from-orange-600 to-orange-800",
    "from-pink-600 to-pink-800",
    "from-indigo-600 to-indigo-800",
  ];

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "flashcards": return Brain;
      case "resumos": return BookOpen;
      default: return Headphones;
    }
  };

  // Sort by count and take top items
  const sortedAreas = [...areas].sort((a, b) => b.count - a.count).slice(0, 12);

  if (sortedAreas.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-bold">Em Alta</h2>
      </div>

      <ScrollArea className="w-full whitespace-nowrap pb-2">
        <div className="flex gap-3">
          {sortedAreas.map((item, index) => {
            const Icon = getIcon(item.tipo);
            const gradient = gradientColors[index % gradientColors.length];

            return (
              <div
                key={`${item.tipo}-${item.area}`}
                onClick={() => navigate(`/audioaulas/${item.tipo}/${encodeURIComponent(item.area)}`)}
                className="flex-shrink-0 cursor-pointer group"
              >
                <div className={`relative w-28 h-36 rounded-2xl bg-gradient-to-br ${gradient} overflow-hidden transition-all hover:scale-105 hover:shadow-xl`}>
                  {/* Decorative elements */}
                  <div className="absolute top-2 right-2 w-10 h-10 bg-white/10 rounded-full" />
                  <div className="absolute bottom-8 left-2 w-6 h-6 bg-white/10 rounded-full" />
                  
                  {/* Icon */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
                    <Icon className="w-16 h-16 text-white" />
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white font-bold text-xs truncate">{item.area}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Icon className="w-3 h-3 text-white/80" />
                      <span className="text-white/80 text-xs">{item.count}</span>
                    </div>
                  </div>

                  {/* Play indicator on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default AudioaulasCarouselEmAlta;
