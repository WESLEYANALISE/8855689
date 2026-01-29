import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

interface DeputadoCardProps {
  deputado: {
    id: number;
    nome: string;
    siglaPartido: string;
    siglaUf: string;
    urlFoto?: string;
    email?: string;
  };
  onClick?: () => void;
  index?: number;
}

export const DeputadoCard = ({ deputado, onClick, index = 0 }: DeputadoCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:scale-105 hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500/50 bg-gradient-to-br from-gray-900/95 to-gray-800/95 animate-fade-in"
      onClick={onClick}
      style={{
        animationDelay: `${index * 0.08}s`,
        animationFillMode: 'backwards'
      }}
    >
      <CardContent className="p-4">
        <div className="flex gap-4 items-start">
          {deputado.urlFoto ? (
            <img
              src={deputado.urlFoto}
              alt={deputado.nome}
              className="w-20 h-20 rounded-lg object-cover shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gray-700 flex items-center justify-center">
              <User className="w-10 h-10 text-gray-400" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-white line-clamp-2 mb-1">
              {deputado.nome}
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs font-medium">
                {deputado.siglaPartido}
              </span>
              <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-medium">
                {deputado.siglaUf}
              </span>
            </div>
            
            {deputado.email && (
              <p className="text-xs text-gray-400 truncate">{deputado.email}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
