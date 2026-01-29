import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SenadorCardProps {
  senador: {
    codigo?: string;
    nome?: string;
    nomeCompleto?: string;
    foto?: string;
    partido?: string;
    uf?: string;
    email?: string;
  };
  index?: number;
}

export const SenadorCard = ({ senador }: SenadorCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="bg-card border-border hover:border-amber-500/50 transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02] animate-fade-in"
      onClick={() => senador.codigo && navigate(`/senado/senador/${senador.codigo}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {senador.foto ? (
            <img
              src={senador.foto}
              alt={senador.nome}
              className="w-16 h-16 rounded-full object-cover border-2 border-amber-500/30"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
              <User className="w-8 h-8 text-amber-400" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {senador.nome}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                {senador.partido}
              </span>
              <span className="text-sm text-muted-foreground">
                {senador.uf}
              </span>
            </div>
            {senador.email && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {senador.email}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
