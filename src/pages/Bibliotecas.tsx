import { useNavigate } from "react-router-dom";
import { GraduationCap, Book, Scale, Mic, Users, Briefcase, BookOpen, Languages, Library, ChevronRight } from "lucide-react";
import { BibliotecaTopNav } from "@/components/biblioteca/BibliotecaTopNav";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, memo } from "react";
import type { ElementType } from "react";
import heroBibliotecas from "@/assets/biblioteca-office-sunset.webp";
import capaLideranca from "@/assets/capa-lideranca.webp";
import capaForaDaToga from "@/assets/capa-fora-da-toga.webp";
import capaEstudos from "@/assets/sala-aula-direito.webp";
import capaClassicos from "@/assets/capa-classicos.webp";
import capaOratoria from "@/assets/capa-oratoria.webp";
import capaPesquisaCientifica from "@/assets/capa-pesquisa-cientifica.webp";
import capaPortugues from "@/assets/capa-portugues.webp";
import capaOab from "@/assets/capa-biblioteca-oab.webp";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StandardPageHeader } from "@/components/StandardPageHeader";
import { isImagePreloaded, markImageLoaded } from "@/hooks/useInstantCache";

interface BibliotecaItem {
  id: string;
  title: string;
  description: string;
  icon: ElementType;
  route: string;
  bibliotecaName: string;
  key: string;
  color: string;
  localCapa?: string;
}

const bibliotecasItems: BibliotecaItem[] = [
  {
    id: "estudos",
    title: "Estudos",
    description: "Materiais de estudo organizados por área do Direito.",
    icon: GraduationCap,
    color: "#10b981",
    route: "/biblioteca-estudos",
    bibliotecaName: "Biblioteca de Estudos",
    key: "estudos",
    localCapa: capaEstudos,
  },
  {
    id: "classicos",
    title: "Clássicos",
    description: "Obras clássicas da literatura jurídica.",
    icon: Book,
    color: "#f59e0b",
    route: "/biblioteca-classicos",
    bibliotecaName: "Biblioteca Clássicos",
    key: "classicos",
    localCapa: capaClassicos,
  },
  {
    id: "oab",
    title: "OAB",
    description: "Materiais essenciais para aprovação na OAB.",
    icon: Scale,
    color: "#3b82f6",
    route: "/biblioteca-oab",
    bibliotecaName: "Biblioteca da OAB",
    key: "oab",
    localCapa: capaOab,
  },
  {
    id: "oratoria",
    title: "Oratória",
    description: "A arte da comunicação e persuasão.",
    icon: Mic,
    color: "#a855f7",
    route: "/biblioteca-oratoria",
    bibliotecaName: "Biblioteca de Oratória",
    key: "oratoria",
    localCapa: capaOratoria,
  },
  {
    id: "portugues",
    title: "Português",
    description: "Gramática e redação jurídica.",
    icon: Languages,
    color: "#0ea5e9",
    route: "/biblioteca-portugues",
    bibliotecaName: "Biblioteca de Português",
    key: "portugues",
    localCapa: capaPortugues,
  },
  {
    id: "lideranca",
    title: "Liderança",
    description: "Habilidades de liderança e gestão.",
    icon: Users,
    color: "#6366f1",
    route: "/biblioteca-lideranca",
    bibliotecaName: "Biblioteca de Liderança",
    key: "lideranca",
    localCapa: capaLideranca,
  },
  {
    id: "fora",
    title: "Fora da Toga",
    description: "Leituras além do jurídico.",
    icon: Briefcase,
    color: "#ec4899",
    route: "/biblioteca-fora-da-toga",
    bibliotecaName: "Biblioteca Fora da Toga",
    key: "fora",
    localCapa: capaForaDaToga,
  },
  {
    id: "pesquisa",
    title: "Pesquisa Científica",
    description: "Metodologia e produção acadêmica.",
    icon: BookOpen,
    color: "#14b8a6",
    route: "/biblioteca-pesquisa-cientifica",
    bibliotecaName: "Biblioteca de Pesquisa Científica",
    key: "pesquisa",
    localCapa: capaPesquisaCientifica,
  }
];

// Card estilo estante de livros
const BibliotecaGridCard = memo(({ 
  item, 
  index, 
  count, 
  onClick 
}: { 
  item: BibliotecaItem; 
  index: number; 
  count: number; 
  onClick: () => void;
}) => {
  const Icon = item.icon;
  const capaUrl = item.localCapa;
  
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden text-left transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] group animate-fade-in"
      style={{
        animationDelay: `${index * 60}ms`,
        boxShadow: `0 4px 24px ${item.color}25`,
      }}
    >
      <div className="aspect-[3/4] w-full overflow-hidden relative">
        {capaUrl ? (
          <img 
            src={capaUrl} 
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            onLoad={() => capaUrl && markImageLoaded(capaUrl)}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${item.color}60, ${item.color}30)` }}
          >
            <Icon className="w-12 h-12" style={{ color: item.color }} />
          </div>
        )}
        
        {/* Badge de contagem - topo esquerdo */}
        <div 
          className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md backdrop-blur-sm"
          style={{ backgroundColor: `${item.color}cc` }}
        >
          <Book className="w-3 h-3 text-white" />
          <span className="text-xs font-bold text-white">{count}</span>
        </div>

        {/* Borda temática sutil no hover */}
        <div 
          className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-opacity-60 transition-all duration-300 pointer-events-none"
          style={{ borderColor: `${item.color}00`, }}
        />
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 2px ${item.color}80` }}
        />
        
        {/* Gradiente inferior */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        
        {/* Conteúdo */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Icon className="w-4 h-4 flex-shrink-0" style={{ color: item.color }} />
            <h3 className="font-bold text-sm text-white leading-tight truncate">
              {item.title}
            </h3>
          </div>
          <div className="flex justify-end">
            <div 
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-[11px] font-medium backdrop-blur-sm"
              style={{ backgroundColor: `${item.color}cc` }}
            >
              Acessar
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
});

BibliotecaGridCard.displayName = 'BibliotecaGridCard';

const Bibliotecas = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredItems = bibliotecasItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [imageLoaded, setImageLoaded] = useState(() => {
    if (isImagePreloaded(heroBibliotecas)) return true;
    const img = new Image();
    img.src = heroBibliotecas;
    return img.complete && img.naturalWidth > 0;
  });

  useEffect(() => {
    if (!imageLoaded) {
      const img = new Image();
      img.src = heroBibliotecas;
      img.onload = () => {
        markImageLoaded(heroBibliotecas);
        setImageLoaded(true);
      };
    }
  }, [imageLoaded]);

  const { data: contagens } = useQuery({
    queryKey: ["contagens-bibliotecas"],
    queryFn: async () => {
      const [estudos, classicos, oab, oratoria, portugues, lideranca, fora, pesquisa] = await Promise.all([
        supabase.from("BIBLIOTECA-ESTUDOS" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-CLASSICOS" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBILIOTECA-OAB" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-ORATORIA" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-PORTUGUES" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-LIDERANÇA" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-FORA-DA-TOGA" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-PESQUISA-CIENTIFICA" as any).select("*", { count: "exact", head: true }),
      ]);
      return {
        estudos: estudos.count || 0,
        classicos: classicos.count || 0,
        oab: oab.count || 0,
        oratoria: oratoria.count || 0,
        portugues: portugues.count || 0,
        lideranca: lideranca.count || 0,
        fora: fora.count || 0,
        pesquisa: pesquisa.count || 0,
      };
    },
    staleTime: 1000 * 60 * 30,
  });

  const totalObras = contagens 
    ? Object.values(contagens).reduce((a, b) => a + b, 0) 
    : 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image - Fixed */}
      <div className="fixed inset-0">
        <img
          src={heroBibliotecas}
          alt="Bibliotecas"
          className={`w-full h-full object-cover object-[50%_30%] transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
      </div>
      
      {/* Dark gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-black/70 to-neutral-900" />
      
      {/* Content */}
      <div className="relative z-10">
        <StandardPageHeader title="Biblioteca Jurídica" position="fixed" backPath="/" />
        <div className="pt-[env(safe-area-inset-top)]" />
        <BibliotecaTopNav activeTab="acervo" />
        
        {/* Hero section */}
        <div className="pt-14 pb-2 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Library className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  <span className="bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent">
                    Biblioteca Jurídica
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground">Completa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Stats */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-center gap-6 text-sm text-foreground/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>{bibliotecasItems.length} coleções</span>
            </div>
            <div className="flex items-center gap-2">
              <Book className="w-4 h-4 text-emerald-400" />
              <span>{totalObras} obras</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="max-w-4xl mx-auto relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar biblioteca..."
              className="pl-11 h-12 text-base bg-card/50 border-amber-900/20 focus:border-amber-500/50 rounded-xl"
            />
          </div>
        </div>

        {/* Grid Estante de Livros */}
        <div className="px-3 pb-8 pt-1">
          <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map((item, index) => (
              <BibliotecaGridCard
                key={item.id}
                item={item}
                index={index}
                count={contagens?.[item.key as keyof typeof contagens] || 0}
                onClick={() => navigate(item.route)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bibliotecas;