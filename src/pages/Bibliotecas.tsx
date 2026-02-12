import { useNavigate } from "react-router-dom";
import { GraduationCap, Book, Scale, Mic, Users, Briefcase, BookOpen, Languages, Library, Gavel, ChevronRight } from "lucide-react";
import { BibliotecaBottomNav } from "@/components/biblioteca/BibliotecaBottomNav";
import { useState, useEffect, memo } from "react";
import type { ElementType } from "react";
import heroBibliotecas from "@/assets/biblioteca-office-sunset.jpg";
import capaLideranca from "@/assets/capa-lideranca.jpg";
import capaForaDaToga from "@/assets/capa-fora-da-toga.jpg";
import capaEstudos from "@/assets/sala-aula-direito.webp";
import capaClassicos from "@/assets/capa-classicos.jpg";
import capaOratoria from "@/assets/capa-oratoria.jpg";
import capaPesquisaCientifica from "@/assets/capa-pesquisa-cientifica.jpg";
import capaPortugues from "@/assets/capa-portugues.jpg";
import capaOab from "@/assets/capa-biblioteca-oab.jpg";
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
    description: "Materiais de estudo organizados por área do Direito. Ideal para estudantes de graduação, concursos e OAB.",
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
    description: "Obras clássicas da literatura jurídica para enriquecer seus conhecimentos fundamentais.",
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
    description: "Biblioteca oficial da OAB com materiais jurídicos essenciais para aprovação.",
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
    description: "Domine a arte da comunicação e persuasão para tribunais e audiências.",
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
    description: "Gramática e redação jurídica para aprimorar sua escrita profissional.",
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
    description: "Desenvolva habilidades de liderança e gestão para sua carreira jurídica.",
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
    description: "Leituras complementares para ampliar sua visão além do jurídico.",
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
    description: "Metodologia e ferramentas para produção acadêmica e científica.",
    icon: BookOpen,
    color: "#14b8a6",
    route: "/biblioteca-pesquisa-cientifica",
    bibliotecaName: "Biblioteca de Pesquisa Científica",
    key: "pesquisa",
    localCapa: capaPesquisaCientifica,
  }
];

// Componente de card memoizado para performance
const BibliotecaCard = memo(({ 
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
  const isLeft = index % 2 === 0;
  const Icon = item.icon;
  const capaUrl = item.localCapa;
  
  return (
    <div
      className={`relative flex items-center animate-fade-in ${
        isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Marcador Martelo no centro */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg animate-pulse"
          style={{ 
            background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`,
            boxShadow: `0 4px 20px ${item.color}50`
          }}
        >
          <Gavel className="w-5 h-5 text-white" />
        </div>
      </div>
      
      {/* Card da Biblioteca - Formato Livro */}
      <div className="w-full">
        <button
          onClick={onClick}
          className="w-full rounded-2xl overflow-hidden text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            boxShadow: `0 4px 20px ${item.color}30`
          }}
        >
          {/* Capa estilo livro - aspect ratio 3:4 */}
          <div className="aspect-[3/4] w-full overflow-hidden relative group">
            {capaUrl ? (
              <img 
                src={capaUrl} 
                alt={item.title}
                className="w-full h-full object-cover"
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
              className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-sm"
              style={{ backgroundColor: `${item.color}90` }}
            >
              <Book className="w-3 h-3 text-white" />
              <span className="text-xs font-bold text-white">
                {count}
              </span>
              <span className="text-[10px] text-white/80">livros</span>
            </div>
            
            {/* Gradiente apenas na parte inferior para texto */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/90 to-transparent" />
            
            {/* Conteúdo sobre a capa */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              {/* Título */}
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5" style={{ color: item.color }} />
                <h3 className="font-bold text-lg text-white">
                  {item.title}
                </h3>
              </div>
              
              {/* Botão Acessar abaixo, alinhado à direita */}
              <div className="flex justify-end">
                <div 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium backdrop-blur-sm"
                  style={{ backgroundColor: `${item.color}cc` }}
                >
                  <span>Acessar</span>
                  <ChevronRight className="w-3.5 h-3.5 animate-bounceRight" />
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
});

BibliotecaCard.displayName = 'BibliotecaCard';

const Bibliotecas = () => {
  const navigate = useNavigate();

  // Verificar se a imagem já está em cache para exibição INSTANTÂNEA
  const [imageLoaded, setImageLoaded] = useState(() => {
    // Verifica primeiro no cache do useInstantCache
    if (isImagePreloaded(heroBibliotecas)) return true;
    // Fallback: verifica se está no cache do browser
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

  // Buscar contagens
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
        {/* Header padrão fixo (colado no topo) */}
        <StandardPageHeader title="Biblioteca Jurídica" position="fixed" backPath="/" />
        
        {/* Hero section */}
        <div className="pt-14 pb-4 px-4">
          <div className="max-w-lg mx-auto">
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
                <p className="text-sm text-muted-foreground">
                  Completa
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Stats */}
        <div className="px-4 py-4">
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

        {/* Timeline de Bibliotecas */}
        <div className="px-4 pb-24 pt-4">
          <div className="max-w-lg mx-auto relative">
            {/* Linha central da timeline */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-b from-amber-500/80 via-amber-600/60 to-amber-700/40 rounded-full" />
            </div>
            
            <div className="space-y-6">
              {bibliotecasItems.map((item, index) => (
                <BibliotecaCard
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
      <BibliotecaBottomNav activeTab="acervo" />
    </div>
  );
};

export default Bibliotecas;