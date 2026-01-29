import { useNavigate } from "react-router-dom";
import { Library, Video, Target, BookOpen, Gavel, ArrowLeft, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
const OABFuncoes = () => {
  const navigate = useNavigate();
  const funcoes = [{
    id: "o-que-estudar-oab",
    title: "O que estudar para OAB",
    description: "Guia completo de conteúdos",
    icon: BookOpen,
    route: "/oab/o-que-estudar"
  }, {
    id: "biblioteca-oab",
    title: "Biblioteca OAB",
    description: "Acesse materiais de estudo para OAB",
    icon: Library,
    route: "/biblioteca-oab"
  }, {
    id: "questoes-oab",
    title: "Questões OAB",
    description: "Resolva questões de provas anteriores",
    icon: Gavel,
    route: "/simulados/personalizado"
  }, {
    id: "simulados-oab",
    title: "Simulados OAB",
    description: "Pratique com simulados completos",
    icon: Target,
    route: "/simulados/exames"
  }, {
    id: "videoaulas-oab",
    title: "Videoaulas Segunda Fase da OAB",
    description: "Assista aulas preparatórias para 2ª fase",
    icon: Video,
    route: "/videoaulas-oab"
  }];
  return <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6 pb-6">{/* Removido pb-20 para esconder rodapé */}
        {/* Header */}
        <div className="flex items-center gap-3">
          
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Estudos para a OAB</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Todas as ferramentas para sua aprovação
            </p>
          </div>
        </div>

        {/* Lista de Funções */}
        <div className="flex flex-col gap-3">
          {funcoes.map(funcao => {
          const Icon = funcao.icon;
          return <button key={funcao.id} onClick={() => navigate(funcao.route)} className="bg-gradient-to-br from-[hsl(0,75%,55%)] to-[hsl(350,70%,45%)] rounded-xl p-4 text-left transition-all hover:scale-[1.02] hover:shadow-2xl flex items-center gap-4 relative overflow-hidden shadow-xl min-h-[88px]">
                <div className="absolute inset-0 bg-gradient-to-tl from-black/60 via-black/30 to-transparent pointer-events-none" />
                <div className="bg-white/20 rounded-lg p-3 relative z-10 shadow-lg flex-shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 relative z-10 min-w-0">
                  <h3 className="text-base font-bold text-white mb-1 line-clamp-1" style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.6)'
              }}>
                    {funcao.title}
                  </h3>
                  <p className="text-white/80 text-sm line-clamp-1" style={{
                textShadow: '1px 1px 3px rgba(0,0,0,0.5)'
              }}>
                    {funcao.description}
                  </p>
                </div>
              </button>;
        })}
        </div>

        {/* Seção Sobre */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Sobre esta área</h2>
          </div>
          
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Esta seção reúne <strong className="text-foreground">todas as ferramentas necessárias</strong> para você se preparar para o Exame da Ordem dos Advogados do Brasil (OAB).
            </p>
            
            <p>
              A aprovação na OAB é fundamental para exercer a advocacia no Brasil. Aqui você encontra materiais de estudo, videoaulas específicas, simulados completos, guias de conteúdo e banco de questões de provas anteriores.
            </p>
            
            <p>
              Utilize todas as ferramentas disponíveis para <strong className="text-foreground">maximizar suas chances de aprovação</strong> e conquistar sua carteira da OAB!
            </p>
          </div>
        </Card>
      </div>
    </div>;
};
export default OABFuncoes;