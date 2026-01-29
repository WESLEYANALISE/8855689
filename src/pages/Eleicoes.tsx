import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { 
  UserCheck, 
  Users, 
  BarChart3, 
  PieChart, 
  History, 
  DollarSign, 
  BookOpen, 
  Calendar 
} from "lucide-react";

const Eleicoes = () => {
  const navigate = useNavigate();

  const funcionalidades = [
    {
      id: "situacao",
      titulo: "Situação Eleitoral",
      descricao: "Consulte a regularidade do título de eleitor",
      icon: UserCheck,
      path: "/eleicoes/situacao",
      iconBg: "bg-blue-600",
      glowColor: "rgb(37, 99, 235)",
    },
    {
      id: "candidatos",
      titulo: "Pesquisar Candidatos",
      descricao: "Busque candidatos por nome, número ou partido",
      icon: Users,
      path: "/eleicoes/candidatos",
      iconBg: "bg-emerald-600",
      glowColor: "rgb(5, 150, 105)",
    },
    {
      id: "resultados",
      titulo: "Resultados de Eleições",
      descricao: "Consulte resultados de eleições anteriores",
      icon: BarChart3,
      path: "/eleicoes/resultados",
      iconBg: "bg-purple-600",
      glowColor: "rgb(147, 51, 234)",
    },
    {
      id: "eleitorado",
      titulo: "Dados do Eleitorado",
      descricao: "Estatísticas de eleitores por região",
      icon: PieChart,
      path: "/eleicoes/eleitorado",
      iconBg: "bg-amber-600",
      glowColor: "rgb(245, 158, 11)",
    },
    {
      id: "historico",
      titulo: "Histórico de Eleições",
      descricao: "Acesse dados históricos desde 1945",
      icon: History,
      path: "/eleicoes/historico",
      iconBg: "bg-cyan-600",
      glowColor: "rgb(8, 145, 178)",
    },
    {
      id: "prestacao-contas",
      titulo: "Prestação de Contas",
      descricao: "Consulte contas de campanha e doações",
      icon: DollarSign,
      path: "/eleicoes/prestacao-contas",
      iconBg: "bg-rose-600",
      glowColor: "rgb(225, 29, 72)",
    },
    {
      id: "legislacao",
      titulo: "Legislação Eleitoral",
      descricao: "Acesso ao Código Eleitoral e súmulas",
      icon: BookOpen,
      path: "/eleicoes/legislacao",
      iconBg: "bg-indigo-600",
      glowColor: "rgb(79, 70, 229)",
    },
    {
      id: "calendario",
      titulo: "Calendário Eleitoral",
      descricao: "Datas importantes e prazos eleitorais",
      icon: Calendar,
      path: "/eleicoes/calendario",
      iconBg: "bg-orange-600",
      glowColor: "rgb(234, 88, 12)",
    },
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Eleições</h1>
        <p className="text-sm text-muted-foreground">
          Dados do TSE, consultas eleitorais e muito mais
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {funcionalidades.map((func) => {
          const Icon = func.icon;
          return (
            <Card
              key={func.id}
              className="cursor-pointer hover:scale-105 hover:shadow-2xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-accent/50 bg-gradient-to-br from-gray-900/95 to-gray-800/95 group shadow-xl overflow-hidden relative"
              onClick={() => navigate(func.path)}
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{
                  background: `linear-gradient(90deg, transparent, ${func.glowColor}, transparent)`,
                  boxShadow: `0 0 20px ${func.glowColor}`
                }}
              />
              
              <CardContent className="p-5 flex flex-col items-center text-center min-h-[180px] justify-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${func.iconBg} shadow-lg transition-transform group-hover:scale-110 mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-base mb-2 text-white">{func.titulo}</h3>
                <p className="text-xs text-gray-300 line-clamp-2">{func.descricao}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Eleicoes;
