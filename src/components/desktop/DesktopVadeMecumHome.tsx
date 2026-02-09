import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, BookOpen, FileText, Gavel, BookText, HandCoins, Scroll, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

// Categorias do Vade Mecum
const categorias = [
  { 
    id: "codigos", 
    title: "Códigos", 
    description: "Constituição Federal, Código Civil, Código Penal, CPC, CPP e mais", 
    icon: Scale, 
    route: "/vade-mecum?categoria=codigos",
    color: "bg-blue-500/20",
    iconColor: "text-blue-400"
  },
  { 
    id: "estatutos", 
    title: "Estatutos", 
    description: "ECA, Estatuto do Idoso, Estatuto da OAB, Estatuto da Cidade", 
    icon: BookOpen, 
    route: "/vade-mecum?categoria=estatutos",
    color: "bg-emerald-500/20",
    iconColor: "text-emerald-400"
  },
  { 
    id: "legislacao-penal", 
    title: "Legislação Penal", 
    description: "Lei de Drogas, Armas, Crimes Ambientais, Maria da Penha", 
    icon: Gavel, 
    route: "/vade-mecum?categoria=legislacao-penal",
    color: "bg-red-500/20",
    iconColor: "text-red-400"
  },
  { 
    id: "sumulas", 
    title: "Súmulas", 
    description: "Súmulas do STF, STJ, TST, TSE e Súmulas Vinculantes", 
    icon: BookText, 
    route: "/resumos-juridicos/artigos-lei/sumulas",
    color: "bg-purple-500/20",
    iconColor: "text-purple-400"
  },
  { 
    id: "previdenciario", 
    title: "Previdenciário", 
    description: "Lei de Benefícios (8.213), Lei de Custeio (8.212)", 
    icon: HandCoins, 
    route: "/resumos-juridicos/artigos-lei/previdenciario",
    color: "bg-amber-500/20",
    iconColor: "text-amber-400"
  },
  { 
    id: "novas-leis", 
    title: "Novas Leis", 
    description: "Legislação recentemente publicada e atualizada", 
    icon: Scroll, 
    route: "/novas-leis",
    color: "bg-cyan-500/20",
    iconColor: "text-cyan-400"
  },
];

export const DesktopVadeMecumHome = memo(() => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 pt-8 pb-16">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-md rounded-3xl shadow-lg ring-1 ring-blue-800/30">
          <Scale className="w-10 h-10 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vade Mecum Comentado</h1>
          <p className="text-lg text-muted-foreground mt-2">Legislação brasileira completa e atualizada</p>
        </div>
        
        {/* Barra de busca */}
        <div 
          onClick={() => navigate('/pesquisar?tipo=legislacao')}
          className="max-w-md mx-auto flex items-center gap-3 px-5 py-4 bg-card/90 backdrop-blur-sm rounded-2xl cursor-pointer border border-border/50 hover:border-primary/30 hover:bg-card transition-colors duration-150 shadow-lg mt-6"
        >
          <Search className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">Buscar artigo, lei ou código...</span>
        </div>
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-3 gap-4">
        {categorias.map((categoria) => {
          const Icon = categoria.icon;
          return (
            <button
              key={categoria.id}
              onClick={() => navigate(categoria.route)}
              className="group bg-card/90 backdrop-blur-sm rounded-2xl p-6 text-left transition-all duration-150 hover:bg-card hover:scale-[1.02] border border-border/50 hover:border-primary/30 shadow-lg relative overflow-hidden"
            >
              <div className={`${categoria.color} rounded-xl p-3 w-fit mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${categoria.iconColor}`} />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-lg">
                {categoria.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {categoria.description}
              </p>
              <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </button>
          );
        })}
      </div>

      {/* CTA para ver tudo */}
      <div className="flex justify-center">
        <Button
          onClick={() => navigate('/vade-mecum')}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl px-8 py-6 font-medium transition-all shadow-lg"
        >
          <Scale className="w-5 h-5 mr-2" />
          <span>Acessar Vade Mecum Completo</span>
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
});

DesktopVadeMecumHome.displayName = 'DesktopVadeMecumHome';

export default DesktopVadeMecumHome;
