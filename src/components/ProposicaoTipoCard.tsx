import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ProposicaoTipoCardProps {
  tipo: {
    sigla: string;
    nome: string;
    descricao: string;
    icon: LucideIcon;
    iconBg: string;
    glowColor: string;
  };
  onClick: () => void;
}

export const ProposicaoTipoCard = ({ tipo, onClick }: ProposicaoTipoCardProps) => {
  const Icon = tipo.icon;
  
  return (
    <Card
      className="cursor-pointer hover:scale-105 hover:shadow-2xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-accent/50 bg-gradient-to-br from-gray-900/95 to-gray-800/95 group shadow-xl overflow-hidden relative"
      onClick={onClick}
    >
      <div 
        className="absolute top-0 left-0 right-0 h-1 opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent, ${tipo.glowColor}, transparent)`,
          boxShadow: `0 0 20px ${tipo.glowColor}`
        }}
      />
      
      <CardContent className="p-5 flex flex-col items-center text-center min-h-[180px] justify-center">
        <div className={`flex items-center justify-center w-12 h-12 rounded-full ${tipo.iconBg} shadow-lg transition-transform group-hover:scale-110 mb-3`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-bold text-base mb-2 text-white">{tipo.nome}</h3>
        <p className="text-xs text-gray-300 line-clamp-2">{tipo.descricao}</p>
      </CardContent>
    </Card>
  );
};