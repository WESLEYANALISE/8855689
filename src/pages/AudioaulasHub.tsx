import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Headphones, Brain, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useInstantCache } from "@/hooks/useInstantCache";

interface CategoryData {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  count: number;
  gradient: string;
}

interface AudioaulasContagens {
  audioaulas: number;
  flashcards: number;
  resumos: number;
}

const AudioaulasHub = () => {
  const navigate = useNavigate();

  // Cache instantâneo para todas as contagens consolidadas
  const { data: contagens } = useInstantCache<AudioaulasContagens>({
    cacheKey: "audioaulas-hub-contagens",
    queryFn: async () => {
      // Buscar todas as contagens em paralelo
      const [audioaulasRes, flashcardsRes, resumosRes] = await Promise.all([
        supabase
          .from("AUDIO-AULA" as any)
          .select("*", { count: "exact", head: true })
          .not("url_audio", "is", null),
        supabase
          .from("FLASHCARDS - ARTIGOS LEI" as any)
          .select("*", { count: "exact", head: true })
          .not('"audio-pergunta"', "is", null),
        supabase
          .from("RESUMO" as any)
          .select("*", { count: "exact", head: true })
          .not("url_audio_resumo", "is", null),
      ]);

      return {
        audioaulas: audioaulasRes.count || 0,
        flashcards: flashcardsRes.count || 0,
        resumos: resumosRes.count || 0,
      };
    },
  });

  const categories: CategoryData[] = useMemo(() => [
    {
      id: "audioaulas",
      title: "Estudos",
      description: "Aulas narradas",
      icon: Headphones,
      count: contagens?.audioaulas || 0,
      gradient: "from-violet-600 to-purple-700",
    },
    {
      id: "flashcards",
      title: "Artigos",
      description: "Flashcards",
      icon: Brain,
      count: contagens?.flashcards || 0,
      gradient: "from-pink-600 to-rose-700",
    },
    {
      id: "resumos",
      title: "Resumos",
      description: "Práticos",
      icon: BookOpen,
      count: contagens?.resumos || 0,
      gradient: "from-blue-600 to-cyan-700",
    },
  ], [contagens]);

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/audioaulas/categoria/${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-6 max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-xl font-bold text-foreground mb-6">Escolha uma categoria</h1>

        {/* Categories Grid - Side by side */}
        <div className="grid grid-cols-3 gap-3">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`
                  relative overflow-hidden cursor-pointer
                  bg-gradient-to-br ${category.gradient}
                  border-0 shadow-xl hover:shadow-2xl
                  transform hover:scale-[1.03] transition-all duration-300
                  animate-fade-in
                `}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'backwards'
                }}
              >
                <div className="p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{category.title}</h3>
                  <p className="text-white/70 text-xs mt-0.5">{category.description}</p>
                  <span className="text-xs font-semibold text-white/90 bg-white/20 px-2 py-0.5 rounded-full mt-2">
                    {category.count}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AudioaulasHub;
