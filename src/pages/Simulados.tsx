import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Gavel, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";

const Simulados = () => {
  const navigate = useNavigate();

  const opcoes = [
    {
      id: "exames",
      titulo: "Exames Completos da OAB",
      descricao: "Pratique com exames reais organizados por edição",
      icon: Gavel,
      path: "/simulados/exames",
      gradient: "from-[hsl(260,80%,60%)] to-[hsl(240,90%,55%)]",
    },
    {
      id: "personalizado",
      titulo: "Simulado Personalizado",
      descricao: "Escolha áreas específicas e crie seu simulado",
      icon: Gavel,
      path: "/simulados/personalizado",
      gradient: "from-[hsl(320,75%,55%)] to-[hsl(280,80%,60%)]",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-blue-950/20 to-neutral-950 pb-24">
      <PageHero
        title="Simulados OAB"
        subtitle="Escolha o tipo de simulado que deseja realizar"
        icon={Gavel}
        iconGradient="from-blue-500/20 to-blue-600/10"
        iconColor="text-blue-400"
        lineColor="via-blue-500"
        pageKey="simulados"
        showGenerateButton={true}
      />

      <div className="px-3 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {opcoes.map((opcao) => {
            const Icon = opcao.icon;
            return (
              <Card
                key={opcao.id}
                className="cursor-pointer hover:scale-[1.02] transition-all bg-card/50 backdrop-blur-sm border-white/10 hover:border-white/20 overflow-hidden group"
                onClick={() => navigate(opcao.path)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-3 min-h-[140px]">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${opcao.gradient}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-white mb-1">
                      {opcao.titulo}
                    </h3>
                    <p className="text-xs text-neutral-400">{opcao.descricao}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Simulados;
