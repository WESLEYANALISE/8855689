import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  Users, 
  FileText, 
  ThumbsUp, 
  Flag, 
  DollarSign,
  Calendar,
  Building,
  Users2,
  Landmark,
  ArrowRight
} from "lucide-react";

const CamaraDeputados = () => {
  const navigate = useNavigate();

  const funcionalidades = [
    {
      id: "deputados",
      titulo: "Deputados",
      descricao: "Lista completa de deputados federais",
      icon: Users,
      path: "/camara-deputados/deputados",
      iconBg: "bg-green-600",
      glowColor: "rgb(22, 163, 74)",
    },
    {
      id: "proposicoes",
      titulo: "Proposições",
      descricao: "Projetos de lei, PECs e medidas",
      icon: FileText,
      path: "/camara-deputados/proposicoes",
      iconBg: "bg-yellow-600",
      glowColor: "rgb(202, 138, 4)",
    },
    {
      id: "votacoes",
      titulo: "Votações",
      descricao: "Resultados de votações do plenário",
      icon: ThumbsUp,
      path: "/camara-deputados/votacoes",
      iconBg: "bg-blue-600",
      glowColor: "rgb(37, 99, 235)",
    },
    {
      id: "rankings",
      titulo: "Rankings",
      descricao: "Estatísticas e desempenho dos deputados",
      icon: Landmark,
      path: "/camara-deputados/rankings",
      iconBg: "bg-amber-600",
      glowColor: "rgb(245, 158, 11)",
    },
    {
      id: "partidos",
      titulo: "Partidos",
      descricao: "Informações sobre partidos políticos",
      icon: Flag,
      path: "/camara-deputados/partidos",
      iconBg: "bg-purple-600",
      glowColor: "rgb(147, 51, 234)",
    },
    {
      id: "blocos",
      titulo: "Blocos Parlamentares",
      descricao: "Agrupamentos de partidos políticos",
      icon: Users2,
      path: "/camara-deputados/blocos",
      iconBg: "bg-rose-600",
      glowColor: "rgb(225, 29, 72)",
    },
    {
      id: "despesas",
      titulo: "Despesas",
      descricao: "Transparência nos gastos parlamentares",
      icon: DollarSign,
      path: "/camara-deputados/despesas",
      iconBg: "bg-red-600",
      glowColor: "rgb(220, 38, 38)",
    },
    {
      id: "eventos",
      titulo: "Eventos",
      descricao: "Agenda de sessões e reuniões",
      icon: Calendar,
      path: "/camara-deputados/eventos",
      iconBg: "bg-cyan-600",
      glowColor: "rgb(8, 145, 178)",
    },
    {
      id: "orgaos",
      titulo: "Órgãos e Comissões",
      descricao: "Comissões permanentes e temporárias",
      icon: Building,
      path: "/camara-deputados/orgaos",
      iconBg: "bg-indigo-600",
      glowColor: "rgb(79, 70, 229)",
    },
    {
      id: "frentes",
      titulo: "Frentes Parlamentares",
      descricao: "Frentes temáticas da Câmara",
      icon: Users2,
      path: "/camara-deputados/frentes",
      iconBg: "bg-pink-600",
      glowColor: "rgb(219, 39, 119)",
    },
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-green-600 shadow-lg shadow-green-500/30 flex items-center justify-center">
            <Landmark className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Câmara dos Deputados</h1>
            <p className="text-sm text-muted-foreground">
              Dados oficiais da Câmara Federal
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-3">
        {funcionalidades.map((func, index) => {
          const Icon = func.icon;
          return (
            <motion.div
              key={func.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.03 }}
            >
              <Card
                className="cursor-pointer hover:bg-muted/50 transition-all border-2 border-transparent hover:border-accent/50 bg-card group overflow-hidden relative"
                onClick={() => navigate(func.path)}
              >
                <div 
                  className="absolute top-0 left-0 right-0 h-1 opacity-80"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${func.glowColor}, transparent)`,
                  }}
                />
                
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${func.iconBg} shadow-lg flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-foreground">{func.titulo}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{func.descricao}</p>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CamaraDeputados;
