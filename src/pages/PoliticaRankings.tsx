import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { 
  DollarSign, 
  FileText, 
  Calendar, 
  Users,
  Mic,
  Handshake,
  TrendingDown,
  ArrowRight,
  TrendingUp,
  Vote,
  Wallet,
  GitCompare
} from "lucide-react";
import { PoliticianTypeTabs, PoliticianType } from "@/components/PoliticianTypeTabs";

const rankingsDeputados = [
  {
    tipo: "despesas",
    titulo: "Maiores Gastadores",
    descricao: "Deputados que mais usaram a cota parlamentar",
    icon: DollarSign,
    cor: "red"
  },
  {
    tipo: "mandato",
    titulo: "Gastos do Mandato",
    descricao: "Total gasto desde fevereiro de 2023",
    icon: Wallet,
    cor: "orange"
  },
  {
    tipo: "menos-despesas",
    titulo: "Mais Econômicos",
    descricao: "Deputados que menos gastaram recursos públicos",
    icon: TrendingDown,
    cor: "green"
  },
  {
    tipo: "proposicoes",
    titulo: "Mais Proposições",
    descricao: "Deputados mais produtivos em projetos de lei",
    icon: FileText,
    cor: "blue"
  },
  {
    tipo: "presenca",
    titulo: "Mais Presentes",
    descricao: "Deputados com maior participação em eventos",
    icon: Calendar,
    cor: "purple"
  },
  {
    tipo: "comissoes",
    titulo: "Mais Comissões",
    descricao: "Deputados mais ativos em órgãos e comissões",
    icon: Users,
    cor: "amber"
  },
  {
    tipo: "discursos",
    titulo: "Mais Discursos",
    descricao: "Deputados que mais discursaram em plenário",
    icon: Mic,
    cor: "pink"
  },
  {
    tipo: "frentes",
    titulo: "Mais Frentes Parlamentares",
    descricao: "Deputados em mais frentes suprapartidárias",
    icon: Handshake,
    cor: "cyan"
  },
];

const rankingsSenadores = [
  {
    tipo: "despesas",
    titulo: "Maiores Gastadores",
    descricao: "Senadores que mais usaram recursos públicos",
    icon: DollarSign,
    cor: "red"
  },
  {
    tipo: "materias",
    titulo: "Mais Proposições",
    descricao: "Senadores mais produtivos em matérias",
    icon: FileText,
    cor: "blue"
  },
  {
    tipo: "discursos",
    titulo: "Mais Discursos",
    descricao: "Senadores que mais discursaram",
    icon: Mic,
    cor: "pink"
  },
  {
    tipo: "comissoes",
    titulo: "Mais Comissões",
    descricao: "Senadores mais ativos em comissões",
    icon: Users,
    cor: "amber"
  },
  {
    tipo: "votacoes",
    titulo: "Mais Votações",
    descricao: "Senadores que mais participaram de votações",
    icon: Vote,
    cor: "purple"
  },
];

const getColorClasses = (cor: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    red: { bg: "bg-red-500/20", text: "text-red-400", border: "hover:border-red-500/30" },
    green: { bg: "bg-green-500/20", text: "text-green-400", border: "hover:border-green-500/30" },
    blue: { bg: "bg-blue-500/20", text: "text-blue-400", border: "hover:border-blue-500/30" },
    purple: { bg: "bg-purple-500/20", text: "text-purple-400", border: "hover:border-purple-500/30" },
    amber: { bg: "bg-amber-500/20", text: "text-amber-400", border: "hover:border-amber-500/30" },
    pink: { bg: "bg-pink-500/20", text: "text-pink-400", border: "hover:border-pink-500/30" },
    cyan: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "hover:border-cyan-500/30" },
    orange: { bg: "bg-orange-500/20", text: "text-orange-400", border: "hover:border-orange-500/30" },
  };
  return colors[cor] || colors.amber;
};

const PoliticaRankings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('tipo') as PoliticianType) || 'deputados';
  const [politicianType, setPoliticianType] = useState<PoliticianType>(initialType);

  const rankings = politicianType === 'deputados' ? rankingsDeputados : rankingsSenadores;
  const basePath = politicianType === 'deputados' ? '/politica/rankings' : '/politica/rankings/senadores';

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-background to-background pointer-events-none" />

      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-4 relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 animate-fade-in">
          <div className="bg-amber-500/20 backdrop-blur-sm rounded-2xl p-3 shadow-lg ring-2 ring-amber-500/30 hover:scale-105 transition-transform">
            <TrendingUp className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Todos os Rankings</h1>
            <p className="text-muted-foreground text-sm">{rankings.length} categorias • Estou te vendo 👁️</p>
          </div>
        </div>

        {/* Tabs de alternância */}
        <div className="animate-fade-in">
          <PoliticianTypeTabs selected={politicianType} onChange={setPoliticianType} />
        </div>

        {/* Lista de Rankings */}
        <div className="space-y-3">
          {rankings.map((ranking) => {
            const Icon = ranking.icon;
            const colors = getColorClasses(ranking.cor);
            
            return (
              <div key={`${politicianType}-${ranking.tipo}`} className="animate-fade-in">
                <Card
                  className={`overflow-hidden cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all border-border/50 ${colors.border}`}
                  onClick={() => navigate(`${basePath}/${ranking.tipo}`)}
                >
                  <div className="flex items-center gap-4 h-16">
                    {/* Ícone */}
                    <div className={`w-16 h-16 flex-shrink-0 flex items-center justify-center ${colors.bg} rounded-l-lg`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {ranking.titulo}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {ranking.descricao}
                      </p>
                    </div>

                    {/* Seta */}
                    <div className="pr-4">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Card Comparador */}
        <div className="animate-fade-in">
          <Card
            className="overflow-hidden cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all border-border/50 hover:border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10"
            onClick={() => navigate('/politica/comparador')}
          >
            <div className="flex items-center gap-4 h-16">
              <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-emerald-500/20 rounded-l-lg">
                <GitCompare className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  Comparar Políticos
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  Compare gastos e atividades lado a lado
                </p>
              </div>
              <div className="pr-4">
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </Card>
        </div>

        {/* Footer Info */}
        <p className="text-xs text-muted-foreground text-center pt-4 animate-fade-in">
          📊 Dados oficiais da {politicianType === 'deputados' ? 'Câmara dos Deputados' : 'Senado Federal'}
        </p>
      </div>
    </div>
  );
};

export default PoliticaRankings;
