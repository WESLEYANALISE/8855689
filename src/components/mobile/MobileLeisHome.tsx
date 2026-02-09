import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Landmark, Users, Gavel, BookText, HandCoins, FileText, FilePlus, Scroll, ChevronRight } from "lucide-react";
import { LeisBottomNav } from "@/components/leis/LeisBottomNav";

// Categorias do Vade Mecum com cores vibrantes (ordem exata do Vade Mecum)
const categoriasVadeMecum = [
  { id: "constituicao", title: "Constituição", icon: Landmark, route: "/constituicao", color: "from-amber-500 to-amber-700" },
  { id: "codigos", title: "Códigos", icon: Scale, route: "/codigos", color: "from-red-500 to-red-700" },
  { id: "legislacao-penal", title: "Legislação Penal", icon: Gavel, route: "/legislacao-penal-especial", color: "from-orange-500 to-orange-700" },
  { id: "estatutos", title: "Estatutos", icon: Users, route: "/estatutos", color: "from-sky-500 to-sky-700" },
  { id: "previdenciario", title: "Previdenciário", icon: HandCoins, route: "/previdenciario", color: "from-emerald-500 to-emerald-700" },
  { id: "sumulas", title: "Súmulas", icon: BookText, route: "/sumulas", color: "from-slate-500 to-slate-700" },
  { id: "leis-ordinarias", title: "Leis Ordinárias", icon: FileText, route: "/leis-ordinarias", color: "from-cyan-500 to-cyan-700" },
  { id: "pec", title: "PEC", icon: FilePlus, route: "/novas-leis", color: "from-rose-500 to-rose-700" },
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
        <div className="p-2 bg-amber-500/20 rounded-xl">
          <Scale className="w-5 h-5 text-amber-100" />
        </div>
        <div>
          <h3 className="font-playfair text-xl md:text-lg font-bold text-amber-100 tracking-tight flex items-center gap-2">
            Vade Mecum <span className="w-px h-4 bg-amber-100/50" /> <span className="font-normal">Comentado</span>
          </h3>
          <p className="text-white/70 text-xs">Legislação 2026</p>
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
