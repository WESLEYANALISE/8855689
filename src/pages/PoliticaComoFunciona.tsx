import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  HelpCircle, 
  Users, 
  Building2, 
  Vote, 
  Scale, 
  FileText, 
  Gavel,
  Landmark,
  ChevronRight
} from "lucide-react";

const topicos = [
  {
    id: "deputado",
    titulo: "O que é um Deputado Federal?",
    descricao: "Função, atribuições e mandato",
    icon: Users,
    color: "from-green-500 to-emerald-600",
    glowColor: "green"
  },
  {
    id: "senador",
    titulo: "O que é um Senador?",
    descricao: "Diferenças do deputado e funções",
    icon: Building2,
    color: "from-blue-500 to-indigo-600",
    glowColor: "blue"
  },
  {
    id: "votacao",
    titulo: "Como funciona uma votação?",
    descricao: "Processo de votação no Congresso",
    icon: Vote,
    color: "from-purple-500 to-violet-600",
    glowColor: "purple"
  },
  {
    id: "cpi",
    titulo: "O que é uma CPI?",
    descricao: "Comissão Parlamentar de Inquérito",
    icon: Scale,
    color: "from-red-500 to-rose-600",
    glowColor: "red"
  },
  {
    id: "pec",
    titulo: "O que é uma PEC?",
    descricao: "Proposta de Emenda Constitucional",
    icon: FileText,
    color: "from-amber-500 to-orange-600",
    glowColor: "amber"
  },
  {
    id: "projeto-lei",
    titulo: "Como um projeto vira lei?",
    descricao: "O caminho da tramitação legislativa",
    icon: Gavel,
    color: "from-emerald-500 to-teal-600",
    glowColor: "emerald"
  },
  {
    id: "tres-poderes",
    titulo: "Quais são os três poderes?",
    descricao: "Executivo, Legislativo e Judiciário",
    icon: Landmark,
    color: "from-indigo-500 to-blue-600",
    glowColor: "indigo"
  },
  {
    id: "stf",
    titulo: "O que é o STF?",
    descricao: "Supremo Tribunal Federal",
    icon: Scale,
    color: "from-rose-500 to-pink-600",
    glowColor: "rose"
  },
];

const PoliticaComoFunciona = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header com gradiente vermelho */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/50 via-neutral-950/80 to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent" />
        
        <motion.div 
          className="relative z-10 px-4 pt-6 pb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30 flex items-center justify-center">
                <HelpCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Como Funciona?</h1>
                <p className="text-sm text-neutral-400">
                  Entenda o sistema político brasileiro
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lista de tópicos */}
      <div className="px-4 pb-24 max-w-4xl mx-auto -mt-2">
        <div className="space-y-3">
          {topicos.map((topico, index) => {
            const Icon = topico.icon;
            return (
              <motion.div
                key={topico.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 + index * 0.04 }}
              >
                <Card
                  className="cursor-pointer bg-neutral-900/80 backdrop-blur-sm border-white/5 hover:border-red-500/30 transition-all duration-300 group overflow-hidden"
                  onClick={() => navigate(`/politica/como-funciona/${topico.id}`)}
                >
                  {/* Linha decorativa no topo */}
                  <div className={`h-0.5 bg-gradient-to-r ${topico.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                  
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${topico.color} shadow-lg flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">{topico.titulo}</h3>
                      <p className="text-sm text-neutral-500 line-clamp-1">{topico.descricao}</p>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-8"
        >
          <Card className="bg-neutral-900/50 border-dashed border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white mb-1">Educação Política</h4>
                  <p className="text-xs text-neutral-500">
                    Conhecer o funcionamento do sistema político é essencial para exercer a cidadania de forma consciente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PoliticaComoFunciona;
