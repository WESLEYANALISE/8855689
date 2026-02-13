import { memo, useState } from "react";
import { BookOpen, ArrowRight, Book } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RecomendacaoHomeSectionProps {
  isDesktop: boolean;
  navigate: (path: string) => void;
  handleLinkHover: (path: string) => void;
}

type TabType = 'classicos' | 'oratoria' | 'lideranca';

interface Livro {
  id: number;
  livro: string | null;
  autor: string | null;
  imagem: string | null;
}

const tabs: { id: TabType; label: string; table: string; route: string }[] = [
  { id: 'classicos', label: 'Clássicos', table: 'BIBLIOTECA-CLASSICOS', route: '/biblioteca/classicos' },
  { id: 'oratoria', label: 'Oratória', table: 'BIBLIOTECA-ORATORIA', route: '/biblioteca/oratoria' },
  { id: 'lideranca', label: 'Liderança', table: 'BIBLIOTECA-LIDERANÇA', route: '/biblioteca/lideranca' },
];

export const RecomendacaoHomeSection = memo(({ isDesktop, navigate, handleLinkHover }: RecomendacaoHomeSectionProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('classicos');

  const { data: classicos = [], isLoading: loadingClassicos } = useQuery({
    queryKey: ['recomendacao-classicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('BIBLIOTECA-CLASSICOS')
        .select('id, livro, autor, imagem')
        .order('id', { ascending: true })
        .limit(12);
      if (error) throw error;
      return data as Livro[];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: oratoria = [], isLoading: loadingOratoria } = useQuery({
    queryKey: ['recomendacao-oratoria'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('BIBLIOTECA-ORATORIA')
        .select('id, livro, autor, imagem')
        .order('id', { ascending: true })
        .limit(12);
      if (error) throw error;
      return data as Livro[];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: lideranca = [], isLoading: loadingLideranca } = useQuery({
    queryKey: ['recomendacao-lideranca'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('BIBLIOTECA-LIDERANÇA')
        .select('id, livro, autor, imagem')
        .order('id', { ascending: true })
        .limit(12);
      if (error) throw error;
      return data as Livro[];
    },
    staleTime: 1000 * 60 * 30,
  });

  const currentData = activeTab === 'classicos' ? classicos : activeTab === 'oratoria' ? oratoria : lideranca;
  const isLoading = activeTab === 'classicos' ? loadingClassicos : activeTab === 'oratoria' ? loadingOratoria : loadingLideranca;
  const currentTab = tabs.find(t => t.id === activeTab)!;

  const getDetailRoute = (id: number) => {
    switch (activeTab) {
      case 'classicos': return `/biblioteca/classicos/${id}`;
      case 'oratoria': return `/biblioteca/oratoria/${id}`;
      case 'lideranca': return `/biblioteca/lideranca/${id}`;
    }
  };

  return (
    <div className="space-y-3" data-tutorial="recomendacao-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <BookOpen className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <h3 className="font-playfair text-xl md:text-lg font-bold text-amber-100 tracking-tight">
              Recomendação
            </h3>
            <p className="text-white/70 text-xs">
              Obras essenciais para você
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(currentTab.route)}
          onMouseEnter={() => handleLinkHover(currentTab.route)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
        >
          <span>Ver tudo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Container com gradiente */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-red-800/30">
        {/* Tabs */}
        <div className="flex items-center justify-center mb-4">
          <div className="grid grid-cols-3 gap-1 bg-black/30 rounded-full p-1 w-full max-w-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-2 py-2 rounded-full text-[11px] font-medium transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-white text-red-900 shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Book className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Carrossel */}
        {isLoading ? (
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="flex-shrink-0 w-28 h-44 rounded-xl" />
            ))}
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {currentData.map((livro) => (
                <button
                  key={livro.id}
                  onClick={() => navigate(getDetailRoute(livro.id))}
                  className="flex-shrink-0 w-28 group"
                >
                  <div className="relative w-full h-40 rounded-xl overflow-hidden bg-secondary mb-2">
                    {livro.imagem ? (
                      <img
                        src={livro.imagem}
                        alt={livro.livro || ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-800/50 to-red-950">
                        <Book className="w-8 h-8 text-white/40" />
                      </div>
                    )}
                  </div>
                  <h4 className="text-xs font-medium text-white line-clamp-2 text-left group-hover:text-amber-100 transition-colors">
                    {livro.livro}
                  </h4>
                  {livro.autor && (
                    <p className="text-[10px] text-white/50 line-clamp-1 text-left mt-0.5">
                      {livro.autor}
                    </p>
                  )}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>
    </div>
  );
});

RecomendacaoHomeSection.displayName = 'RecomendacaoHomeSection';

export default RecomendacaoHomeSection;
