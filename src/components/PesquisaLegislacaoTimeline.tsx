import { useNavigate } from "react-router-dom";
import { Crown, Gavel, Scale, Shield, HandCoins, BookText, FileText, AlertTriangle, ChevronRight, ArrowLeft } from "lucide-react";
import brasaoRepublica from "@/assets/brasao-republica.png";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LegislacaoBackground } from "@/components/LegislacaoBackground";
import { GerenciadorBackgroundModal } from "@/components/GerenciadorBackgroundModal";
import { useBackgroundImage } from "@/hooks/useBackgroundImage";
import { Button } from "@/components/ui/button";

interface PesquisaLegislacaoTimelineProps {
  onVoltar: () => void;
}

interface CategoryCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  color: string;
  route: string;
}

const categorias: CategoryCard[] = [
  {
    id: "constituicao",
    title: "Constituição",
    description: "A Lei Fundamental que organiza o Estado",
    icon: Crown,
    iconBg: "bg-orange-500",
    color: "#f97316",
    route: "/constituicao"
  },
  {
    id: "codigos",
    title: "Códigos",
    description: "Código Civil, Penal, Processo Civil...",
    icon: Scale,
    iconBg: "bg-red-500",
    color: "#ef4444",
    route: "/codigos"
  },
  {
    id: "legislacao-penal",
    title: "Legislação Penal",
    description: "LEP, Lei de Drogas, Maria da Penha...",
    icon: Shield,
    iconBg: "bg-red-600",
    color: "#dc2626",
    route: "/legislacao-penal-especial"
  },
  {
    id: "estatutos",
    title: "Estatutos",
    description: "ECA, Estatuto do Idoso, da Cidade...",
    icon: Gavel,
    iconBg: "bg-purple-500",
    color: "#a855f7",
    route: "/estatutos"
  },
  {
    id: "previdenciario",
    title: "Previdenciário",
    description: "Lei de Benefícios e Custeio",
    icon: HandCoins,
    iconBg: "bg-emerald-500",
    color: "#10b981",
    route: "/previdenciario"
  },
  {
    id: "sumulas",
    title: "Súmulas",
    description: "Súmulas Vinculantes, STF e STJ",
    icon: BookText,
    iconBg: "bg-blue-500",
    color: "#3b82f6",
    route: "/sumulas"
  },
  {
    id: "leis-ordinarias",
    title: "Leis Ordinárias",
    description: "Improbidade, LGPD, Licitações...",
    icon: FileText,
    iconBg: "bg-cyan-500",
    color: "#06b6d4",
    route: "/leis-ordinarias"
  },
  {
    id: "pec",
    title: "PEC",
    description: "Propostas de Emenda à Constituição",
    icon: AlertTriangle,
    iconBg: "bg-amber-500",
    color: "#f59e0b",
    route: "/pec"
  }
];

export const PesquisaLegislacaoTimeline = ({ onVoltar }: PesquisaLegislacaoTimelineProps) => {
  const navigate = useNavigate();
  const { 
    backgroundUrl, 
    opacity, 
    isGenerating, 
    generateNew, 
    deleteImage, 
    setOpacity 
  } = useBackgroundImage('legislacao');

  const handleCardClick = (card: CategoryCard) => {
    navigate(card.route);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header com brasão e background */}
      <LegislacaoBackground 
        imageUrl={backgroundUrl} 
        opacity={opacity}
        className="border-b border-border/30"
      >
        <div className="px-4 py-6 flex flex-col items-center text-center bg-gradient-to-b from-card/80 to-background relative">
          {/* Botão Voltar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onVoltar}
            className="absolute left-3 top-3 z-20 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
          
          {/* Botão de gerenciamento */}
          <div className="absolute top-3 right-3 z-20">
            <GerenciadorBackgroundModal
              backgroundUrl={backgroundUrl}
              opacity={opacity}
              isGenerating={isGenerating}
              onGenerate={generateNew}
              onDelete={deleteImage}
              onOpacityChange={setOpacity}
            />
          </div>
          
          <img 
            src={brasaoRepublica} 
            alt="Brasão da República" 
            className="w-20 h-20 object-contain mb-3"
          />
          <h1 className="text-xl font-bold text-foreground">LEGISLAÇÃO</h1>
          <p className="text-sm text-amber-400 mt-1">Navegue pela legislação brasileira</p>
        </div>
      </LegislacaoBackground>

      {/* Lista de categorias */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-3 pb-24">
          {categorias.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card)}
                className="bg-card rounded-xl p-4 cursor-pointer hover:bg-accent/10 hover:scale-[1.02] transition-all border-l-4 group shadow-lg"
                style={{ 
                  borderLeftColor: card.color,
                  opacity: 0,
                  transform: 'translateY(-20px) translateZ(0)',
                  animation: `slideDown 0.5s ease-out ${index * 0.1}s forwards`,
                  willChange: 'transform, opacity'
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`${card.iconBg} rounded-lg p-2.5 shrink-0`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground">{card.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{card.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
