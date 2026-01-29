import { Card, CardContent } from "@/components/ui/card";
import { Flag } from "lucide-react";

interface PartidoCardProps {
  partido: {
    id: string;
    sigla?: string;
    nome?: string;
    uri?: string;
  };
  onClick?: () => void;
}

export const PartidoCard = ({ partido, onClick }: PartidoCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:scale-105 hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500/50 bg-gradient-to-br from-gray-900/95 to-gray-800/95"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
            <Flag className="w-6 h-6 text-purple-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs font-bold">
                {partido.sigla}
              </span>
            </div>
            
            <p className="text-sm font-semibold text-white">
              {partido.nome}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};