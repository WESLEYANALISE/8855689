import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Compass, 
  Scale, 
  Landmark, 
  Building2, 
  Crown,
  ArrowRight,
  Gavel,
  Users,
  BookOpen
} from "lucide-react";

interface InstituicaoCard {
  id: string;
  nome: string;
  sigla: string;
  descricao: string;
  icon: React.ElementType;
  cor: string;
  corBg: string;
  route: string;
}

const instituicoes: InstituicaoCard[] = [
  {
    id: "stf",
    nome: "Supremo Tribunal Federal",
    sigla: "STF",
    descricao: "Corte suprema do país - Ministros, decisões e jurisprudência",
    icon: Scale,
    cor: "text-purple-400",
    corBg: "bg-purple-500/20",
    route: "/se-aprofunde/stf"
  },
  {
    id: "stj",
    nome: "Superior Tribunal de Justiça",
    sigla: "STJ",
    descricao: "Guardião da legislação federal - Ministros e súmulas",
    icon: Gavel,
    cor: "text-blue-400",
    corBg: "bg-blue-500/20",
    route: "/se-aprofunde/stj"
  },
  {
    id: "camara",
    nome: "Câmara dos Deputados",
    sigla: "Câmara",
    descricao: "Casa do povo - Deputados, votações e proposições",
    icon: Landmark,
    cor: "text-green-400",
    corBg: "bg-green-500/20",
    route: "/se-aprofunde/camara"
  },
  {
    id: "senado",
    nome: "Senado Federal",
    sigla: "Senado",
    descricao: "Casa dos estados - Senadores e projetos de lei",
    icon: Building2,
    cor: "text-amber-400",
    corBg: "bg-amber-500/20",
    route: "/se-aprofunde/senado"
  },
  {
    id: "presidencia",
    nome: "Presidência da República",
    sigla: "Executivo",
    descricao: "Poder Executivo - Presidente, ministérios e ações",
    icon: Crown,
    cor: "text-red-400",
    corBg: "bg-red-500/20",
    route: "/se-aprofunde/presidencia"
  }
];

const SeAprofunde = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-background to-background pointer-events-none" />

      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-6 relative">
        {/* Header */}
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div 
            className="bg-purple-500/20 backdrop-blur-sm rounded-2xl p-3 shadow-lg ring-2 ring-purple-500/30"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Compass className="w-6 h-6 text-purple-400" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Se Aprofunde</h1>
            <p className="text-muted-foreground text-sm">Explore os Três Poderes em detalhes</p>
          </div>
        </motion.div>

        {/* Descrição */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card/50 border border-border/50 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">
                Conheça profundamente cada instituição: membros, notícias, obras publicadas, 
                análises e muito mais. Seu guia completo para entender o funcionamento do Estado brasileiro.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cards das Instituições */}
        <motion.div 
          className="grid gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {instituicoes.map((inst, index) => (
            <motion.div
              key={inst.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
            >
              <Card 
                className="overflow-hidden cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all border-border/50 hover:border-purple-500/30"
                onClick={() => navigate(inst.route)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    {/* Ícone */}
                    <div className={`w-14 h-14 flex-shrink-0 flex items-center justify-center ${inst.corBg} rounded-xl`}>
                      <inst.icon className={`w-7 h-7 ${inst.cor}`} />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-foreground">
                          {inst.sigla}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {inst.nome}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {inst.descricao}
                      </p>
                    </div>

                    {/* Seta */}
                    <div className="flex-shrink-0">
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Barra de cor na parte inferior */}
                  <div className={`h-1 ${inst.corBg}`} />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Seção de Estatísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="grid grid-cols-3 gap-3 mt-6"
        >
          <div className="bg-card/50 border border-border/50 rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">11</p>
            <p className="text-xs text-muted-foreground">Ministros STF</p>
          </div>
          <div className="bg-card/50 border border-border/50 rounded-xl p-4 text-center">
            <Landmark className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">513</p>
            <p className="text-xs text-muted-foreground">Deputados</p>
          </div>
          <div className="bg-card/50 border border-border/50 rounded-xl p-4 text-center">
            <Building2 className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">81</p>
            <p className="text-xs text-muted-foreground">Senadores</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SeAprofunde;
