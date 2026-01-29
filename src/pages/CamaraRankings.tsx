import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { 
  Trophy, 
  FileText, 
  Calendar, 
  Users,
  DollarSign,
  ChevronRight
} from "lucide-react";

const CamaraRankings = () => {
  const navigate = useNavigate();

  const rankings = [
    {
      id: "despesas",
      titulo: "Gastos Parlamentares",
      descricao: "Cota parlamentar",
      icon: DollarSign,
      path: "/camara-deputados/ranking/despesas",
    },
    {
      id: "proposicoes",
      titulo: "Produtividade Legislativa",
      descricao: "Proposições apresentadas",
      icon: FileText,
      path: "/camara-deputados/ranking/proposicoes",
    },
    {
      id: "presenca",
      titulo: "Presença e Assiduidade",
      descricao: "Participação em eventos",
      icon: Calendar,
      path: "/camara-deputados/ranking/presenca",
    },
    {
      id: "comissoes",
      titulo: "Atuação em Comissões",
      descricao: "Órgãos e comissões",
      icon: Users,
      path: "/camara-deputados/ranking/comissoes",
    },
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      {/* Header compacto */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Rankings</h1>
          <p className="text-xs text-muted-foreground">
            Desempenho dos deputados
          </p>
        </div>
      </div>

      {/* Lista de rankings */}
      <div className="space-y-2">
        {rankings.map((ranking) => {
          const Icon = ranking.icon;
          return (
            <Card
              key={ranking.id}
              className="p-3 cursor-pointer bg-card border-border/50 hover:border-amber-500/30 transition-all group active:scale-[0.98]"
              onClick={() => navigate(ranking.path)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors flex-shrink-0">
                  <Icon className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{ranking.titulo}</h3>
                  <p className="text-[11px] text-muted-foreground">{ranking.descricao}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors flex-shrink-0" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CamaraRankings;
