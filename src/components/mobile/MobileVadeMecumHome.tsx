import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, BookOpen, FileText, Gavel, BookText, HandCoins, Scroll, ChevronRight } from "lucide-react";

// Categorias do Vade Mecum
const categorias = [
  { 
    id: "codigos", 
    title: "Códigos", 
    description: "CF, CC, CP, CPC, CPP...", 
    icon: Scale, 
    route: "/vade-mecum?categoria=codigos",
    color: "bg-blue-500/20",
    iconColor: "text-blue-400"
  },
  { 
    id: "estatutos", 
    title: "Estatutos", 
    description: "ECA, Idoso, OAB...", 
    icon: BookOpen, 
    route: "/vade-mecum?categoria=estatutos",
    color: "bg-emerald-500/20",
    iconColor: "text-emerald-400"
  },
  { 
    id: "legislacao-penal", 
    title: "Legislação Penal", 
    description: "Drogas, Armas, Ambiental...", 
    icon: Gavel, 
    route: "/vade-mecum?categoria=legislacao-penal",
    color: "bg-red-500/20",
    iconColor: "text-red-400"
  },
  { 
    id: "sumulas", 
    title: "Súmulas", 
    description: "STF, STJ, TST...", 
    icon: BookText, 
    route: "/resumos-juridicos/artigos-lei/sumulas",
    color: "bg-purple-500/20",
    iconColor: "text-purple-400"
  },
  { 
    id: "previdenciario", 
    title: "Previdenciário", 
    description: "Lei 8.212, 8.213...", 
    icon: HandCoins, 
    route: "/resumos-juridicos/artigos-lei/previdenciario",
    color: "bg-amber-500/20",
    iconColor: "text-amber-400"
  },
  { 
    id: "novas-leis", 
    title: "Novas Leis", 
    description: "Legislação atualizada", 
    icon: Scroll, 
    route: "/novas-leis",
    color: "bg-cyan-500/20",
    iconColor: "text-cyan-400"
  },
];

export const MobileVadeMecumHome = memo(() => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 px-1 pt-4 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-900/40 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-blue-800/30">
          <Scale className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Vade Mecum</h2>
          <p className="text-sm text-muted-foreground">Legislação comentada e atualizada</p>
        </div>
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-2 gap-3">
        {categorias.map((categoria) => {
          const Icon = categoria.icon;
          return (
            <button
              key={categoria.id}
              onClick={() => navigate(categoria.route)}
              className="group bg-card/90 backdrop-blur-sm rounded-2xl p-4 text-left transition-all duration-150 hover:bg-card hover:scale-[1.02] border border-border/50 hover:border-primary/30 shadow-lg relative overflow-hidden"
            >
              <div className={`${categoria.color} rounded-xl p-2.5 w-fit mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${categoria.iconColor}`} />
              </div>
              <h3 className="font-semibold text-foreground mb-1 text-sm">
                {categoria.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {categoria.description}
              </p>
              <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>

      {/* CTA para ver tudo */}
      <button
        onClick={() => navigate('/vade-mecum')}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl p-4 font-medium transition-all shadow-lg flex items-center justify-center gap-2"
      >
        <Scale className="w-5 h-5" />
        <span>Acessar Vade Mecum Completo</span>
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
});

MobileVadeMecumHome.displayName = 'MobileVadeMecumHome';

export default MobileVadeMecumHome;
