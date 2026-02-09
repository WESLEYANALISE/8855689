import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, BookOpen, Gavel, BookText, HandCoins, Scroll, ChevronRight, FileText, Landmark, Users, Shield, Briefcase, Building2, Car, Trees, Heart } from "lucide-react";
import { LeisBottomNav } from "@/components/leis/LeisBottomNav";
import heroVadeMecumPlanalto from "@/assets/hero-vademecum-planalto.webp";

// Trilhas de legislação organizadas em pares (esquerda/direita)
const trilhasLegislacao = [
  { 
    id: "constituicao", 
    title: "Constituição Federal", 
    description: "A Lei Maior do Brasil", 
    icon: Landmark, 
    route: "/codigos/constituicao",
    color: "bg-amber-500/20",
    iconColor: "text-amber-400"
  },
  { 
    id: "codigos", 
    title: "Códigos", 
    description: "Civil, Penal, CPC, CPP, CLT...", 
    icon: Scale, 
    route: "/vade-mecum?categoria=codigos",
    color: "bg-blue-500/20",
    iconColor: "text-blue-400"
  },
  { 
    id: "estatutos", 
    title: "Estatutos", 
    description: "ECA, Idoso, OAB, Cidade...", 
    icon: Users, 
    route: "/vade-mecum?categoria=estatutos",
    color: "bg-emerald-500/20",
    iconColor: "text-emerald-400"
  },
  { 
    id: "legislacao-penal", 
    title: "Legislação Penal", 
    description: "Drogas, Armas, Maria da Penha...", 
    icon: Gavel, 
    route: "/vade-mecum?categoria=legislacao-penal",
    color: "bg-red-500/20",
    iconColor: "text-red-400"
  },
  { 
    id: "sumulas", 
    title: "Súmulas", 
    description: "STF, STJ, TST, TSE...", 
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
    color: "bg-orange-500/20",
    iconColor: "text-orange-400"
  },
  { 
    id: "administrativo", 
    title: "Administrativo", 
    description: "Licitações, Processo Adm...", 
    icon: Building2, 
    route: "/leis-ordinarias",
    color: "bg-cyan-500/20",
    iconColor: "text-cyan-400"
  },
  { 
    id: "tributario", 
    title: "Tributário", 
    description: "CTN, ICMS, ISS...", 
    icon: Briefcase, 
    route: "/leis-ordinarias",
    color: "bg-lime-500/20",
    iconColor: "text-lime-400"
  },
  { 
    id: "transito", 
    title: "Trânsito", 
    description: "CTB, Infrações...", 
    icon: Car, 
    route: "/leis-ordinarias",
    color: "bg-yellow-500/20",
    iconColor: "text-yellow-400"
  },
  { 
    id: "ambiental", 
    title: "Ambiental", 
    description: "Crimes Ambientais, Florestas...", 
    icon: Trees, 
    route: "/leis-ordinarias",
    color: "bg-green-500/20",
    iconColor: "text-green-400"
  },
  { 
    id: "consumidor", 
    title: "Consumidor", 
    description: "CDC, Práticas Abusivas...", 
    icon: Shield, 
    route: "/leis-ordinarias",
    color: "bg-pink-500/20",
    iconColor: "text-pink-400"
  },
  { 
    id: "novas-leis", 
    title: "Novas Leis", 
    description: "Legislação atualizada", 
    icon: Scroll, 
    route: "/novas-leis",
    color: "bg-indigo-500/20",
    iconColor: "text-indigo-400"
  },
];

export const MobileLeisHome = memo(() => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'legislacao' | 'explicacao' | 'procurar' | 'resenha' | 'push'>('legislacao');

  const handleTabChange = (tab: 'legislacao' | 'explicacao' | 'procurar' | 'resenha' | 'push') => {
    setActiveTab(tab);
    
    // Navegação baseada na aba selecionada
    if (tab === 'procurar') {
      navigate('/pesquisar?tipo=legislacao');
    } else if (tab === 'resenha') {
      navigate('/vade-mecum/resenha-diaria');
    } else if (tab === 'push') {
      navigate('/vade-mecum/push-legislacao');
    } else if (tab === 'explicacao') {
      navigate('/vade-mecum/sobre');
    }
    // 'legislacao' mantém na tela atual
  };

  return (
    <div className="relative min-h-screen">
      {/* Imagem de fundo fixa */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src={heroVadeMecumPlanalto} 
          alt="Vade Mecum"
          className="w-full h-full object-cover object-top opacity-60"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/50 to-background" />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 space-y-6 px-1 pt-4 pb-32">
        {/* Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="p-3 bg-amber-900/40 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-amber-800/30">
            <Scale className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Vade Mecum X</h2>
            <p className="text-sm text-muted-foreground">Seu Vade Mecum Jurídico <span className="text-amber-400 font-semibold">2026</span></p>
          </div>
        </div>

        {/* Trilhas de Legislação - Layout alternado */}
        <div className="relative px-2">
          {/* Linha central decorativa */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/30 to-transparent -translate-x-1/2" />
          
          <div className="space-y-4">
            {trilhasLegislacao.map((trilha, index) => {
              const Icon = trilha.icon;
              const isLeft = index % 2 === 0;
              
              return (
                <div 
                  key={trilha.id}
                  className={`relative flex items-center gap-3 ${isLeft ? 'pr-[52%]' : 'pl-[52%]'}`}
                >
                  <button
                    onClick={() => navigate(trilha.route)}
                    className={`group w-full bg-card/90 backdrop-blur-sm rounded-2xl p-4 text-left transition-all duration-150 hover:bg-card hover:scale-[1.02] border border-border/50 hover:border-primary/30 shadow-lg relative overflow-hidden ${isLeft ? 'flex-row' : 'flex-row-reverse text-right'}`}
                  >
                    <div className={`flex items-start gap-3 ${isLeft ? '' : 'flex-row-reverse'}`}>
                      <div className={`${trilha.color} rounded-xl p-2.5 flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-5 h-5 ${trilha.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-0.5 text-sm leading-tight">
                          {trilha.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {trilha.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-foreground transition-all ${isLeft ? 'right-3 group-hover:translate-x-0.5' : 'left-3 rotate-180 group-hover:-translate-x-0.5'}`} />
                  </button>
                  
                  {/* Marcador na linha central */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary ring-4 ring-background shadow-lg" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu de Rodapé */}
      <LeisBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
});

MobileLeisHome.displayName = 'MobileLeisHome';

export default MobileLeisHome;
