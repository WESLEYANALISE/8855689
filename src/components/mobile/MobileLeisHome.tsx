import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Landmark, Users, Gavel, BookText, HandCoins, FileText, FilePlus, Scroll, ChevronRight } from "lucide-react";
import { LeisBottomNav } from "@/components/leis/LeisBottomNav";

// Categorias do Vade Mecum com cores vibrantes
const categoriasVadeMecum = [
  { id: "constituicao", title: "Constituição Federal", icon: Landmark, route: "/codigos/constituicao", color: "from-amber-500 to-amber-700", bgColor: "bg-amber-500" },
  { id: "codigos", title: "Códigos", icon: Scale, route: "/codigos", color: "from-blue-500 to-blue-700", bgColor: "bg-blue-500" },
  { id: "estatutos", title: "Estatutos", icon: Users, route: "/estatutos", color: "from-emerald-500 to-emerald-700", bgColor: "bg-emerald-500" },
  { id: "sumulas", title: "Súmulas", icon: BookText, route: "/sumulas", color: "from-purple-500 to-purple-700", bgColor: "bg-purple-500" },
  { id: "previdenciario", title: "Previdenciário", icon: HandCoins, route: "/previdenciario", color: "from-orange-500 to-orange-700", bgColor: "bg-orange-500" },
  { id: "leis-ordinarias", title: "Leis Ordinárias", icon: FileText, route: "/leis-ordinarias", color: "from-cyan-500 to-cyan-700", bgColor: "bg-cyan-500" },
  { id: "pec", title: "PEC", icon: FilePlus, route: "/vade-mecum/legislacao", color: "from-indigo-500 to-indigo-700", bgColor: "bg-indigo-500" },
];

export const MobileLeisHome = memo(() => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'legislacao' | 'explicacao' | 'procurar' | 'resenha' | 'push'>('legislacao');

  const handleTabChange = (tab: 'legislacao' | 'explicacao' | 'procurar' | 'resenha' | 'push') => {
    setActiveTab(tab);
    if (tab === 'procurar') navigate('/pesquisar?tipo=legislacao');
    else if (tab === 'resenha') navigate('/vade-mecum/resenha-diaria');
    else if (tab === 'push') navigate('/vade-mecum/push-legislacao');
    else if (tab === 'explicacao') navigate('/vade-mecum/sobre');
  };

  return (
    <div className="relative min-h-[500px] pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-amber-500/20 rounded-xl">
          <Scale className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h2 className="font-playfair text-xl font-bold text-amber-100">Vade Mecum X</h2>
          <p className="text-white/70 text-xs">Legislação completa <span className="text-primary font-semibold">2026</span></p>
        </div>
      </div>

      {/* Grid de Categorias - Estilo igual ao Estudos */}
      <div className="grid grid-cols-2 gap-3">
        {categoriasVadeMecum.map((categoria) => {
          const Icon = categoria.icon;
          return (
            <button
              key={categoria.id}
              onClick={() => navigate(categoria.route)}
              className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] bg-gradient-to-br ${categoria.color} shadow-lg h-[100px]`}
            >
              {/* Ícone de fundo decorativo */}
              <div className="absolute -right-3 -bottom-3 opacity-20">
                <Icon className="w-20 h-20 text-white" />
              </div>
              
              {/* Ícone principal */}
              <div className="bg-white/20 rounded-xl p-2 w-fit mb-2 group-hover:bg-white/30 transition-colors">
                <Icon className="w-5 h-5 text-white" />
              </div>
              
              {/* Título */}
              <h3 className="font-semibold text-white text-sm leading-tight pr-6">
                {categoria.title}
              </h3>
              
              {/* Seta */}
              <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>

      {/* Menu de Rodapé */}
      <LeisBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
});

MobileLeisHome.displayName = 'MobileLeisHome';

export default MobileLeisHome;
