import { Card, CardContent } from "@/components/ui/card";
import { Building, Users } from "lucide-react";

interface OrgaoCardProps {
  orgao: {
    id: string;
    sigla?: string;
    nome?: string;
    apelido?: string;
    tipoOrgao?: string;
    nomePublicacao?: string;
  };
  onClick?: () => void;
}

export const OrgaoCard = ({ orgao, onClick }: OrgaoCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:scale-105 hover:shadow-xl transition-all border-2 border-transparent hover:border-indigo-500/50 bg-gradient-to-br from-gray-900/95 to-gray-800/95"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
            <Building className="w-6 h-6 text-indigo-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {orgao.sigla && (
                <span className="px-2 py-1 bg-indigo-600/20 text-indigo-400 rounded text-xs font-bold">
                  {orgao.sigla}
                </span>
              )}
              {orgao.tipoOrgao && (
                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                  {orgao.tipoOrgao}
                </span>
              )}
            </div>
            
            <p className="text-sm font-semibold text-white mb-1">
              {orgao.nome}
            </p>
            
            {orgao.apelido && orgao.apelido !== orgao.nome && (
              <p className="text-xs text-gray-400">
                {orgao.apelido}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};