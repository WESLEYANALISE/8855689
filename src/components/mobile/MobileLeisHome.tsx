import { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, BookOpen, Gavel, BookText, HandCoins, Scroll, ChevronRight, Landmark, Users, FileText, FilePlus, BookMarked } from "lucide-react";
import { motion } from "framer-motion";
import { LeisBottomNav } from "@/components/leis/LeisBottomNav";
import heroVadeMecumPlanalto from "@/assets/hero-vademecum-planalto.webp";

// Categorias do Vade Mecum - apenas o que existe
const categoriasVadeMecum = [
  { 
    id: "constituicao", 
    title: "Constituição Federal", 
    icon: Landmark, 
    route: "/codigos/constituicao",
    color: "from-amber-500 to-amber-700",
    bgColor: "bg-amber-500/20"
  },
  { 
    id: "codigos", 
    title: "Códigos", 
    icon: Scale, 
    route: "/codigos",
    color: "from-blue-500 to-blue-700",
    bgColor: "bg-blue-500/20"
  },
  { 
    id: "estatutos", 
    title: "Estatutos", 
    icon: Users, 
    route: "/estatutos",
    color: "from-emerald-500 to-emerald-700",
    bgColor: "bg-emerald-500/20"
  },
  { 
    id: "legislacao-penal", 
    title: "Legislação Penal", 
    icon: Gavel, 
    route: "/legislacao-penal-especial",
    color: "from-red-500 to-red-700",
    bgColor: "bg-red-500/20"
  },
  { 
    id: "sumulas", 
    title: "Súmulas", 
    icon: BookText, 
    route: "/sumulas",
    color: "from-purple-500 to-purple-700",
    bgColor: "bg-purple-500/20"
  },
  { 
    id: "previdenciario", 
    title: "Previdenciário", 
    icon: HandCoins, 
    route: "/previdenciario",
    color: "from-orange-500 to-orange-700",
    bgColor: "bg-orange-500/20"
  },
  { 
    id: "leis-ordinarias", 
    title: "Leis Ordinárias", 
    icon: FileText, 
    route: "/leis-ordinarias",
    color: "from-cyan-500 to-cyan-700",
    bgColor: "bg-cyan-500/20"
  },
  { 
    id: "pec", 
    title: "PEC", 
    icon: FilePlus, 
    route: "/vade-mecum/legislacao",
    color: "from-indigo-500 to-indigo-700",
    bgColor: "bg-indigo-500/20"
  },
  { 
    id: "novas-leis", 
    title: "Novas Leis", 
    icon: Scroll, 
    route: "/novas-leis",
    color: "from-lime-500 to-lime-700",
    bgColor: "bg-lime-500/20"
  },
];

export const MobileLeisHome = memo(() => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'legislacao' | 'explicacao' | 'procurar' | 'resenha' | 'push'>('legislacao');

  // Esconder o header principal quando estiver nesta aba
  useEffect(() => {
    const header = document.querySelector('header');
    if (header) {
      header.style.display = 'none';
    }
    return () => {
      if (header) {
        header.style.display = '';
      }
    };
  }, []);

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
      {/* Imagem de fundo fixa - igual ao Vade Mecum */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src={heroVadeMecumPlanalto} 
          alt="Vade Mecum"
          className="w-full h-full object-cover object-center opacity-70"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center py-4 pb-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-5"
        >
          <h2 className="font-cinzel text-xl font-bold text-amber-100 mb-1">
            Vade Mecum X
          </h2>
          <p className="text-amber-200/70 text-xs">Seu Vade Mecum Jurídico <span className="text-primary font-semibold">2026</span></p>
        </motion.div>

        {/* Info Stats */}
        <div className="flex items-center justify-center gap-4 text-xs text-white/80 mb-6">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>{categoriasVadeMecum.length} categorias</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Legislação completa</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookMarked className="w-3.5 h-3.5 text-purple-400" />
            <span>Atualizado</span>
          </div>
        </div>

        {/* Timeline de Categorias */}
        <div className="w-full px-4">
          <div className="max-w-lg mx-auto relative">
            {/* Linha central da timeline com animação */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
              <div className="w-full h-full bg-gradient-to-b from-primary/80 via-primary/60 to-primary/40 rounded-full" />
              {/* Animação de fluxo elétrico */}
              <motion.div
                className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-primary/30 to-transparent rounded-full"
                animate={{ y: ["0%", "300%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>
            
            <div className="space-y-4">
              {categoriasVadeMecum.map((categoria, index) => {
                const Icon = categoria.icon;
                const isLeft = index % 2 === 0;
                
                return (
                  <motion.div
                    key={categoria.id}
                    initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={`relative flex items-center ${
                      isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
                    }`}
                  >
                    {/* Marcador Balança no centro */}
                    <div className="absolute left-1/2 -translate-x-1/2 z-10">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.15, 1],
                          boxShadow: [
                            "0 0 0 0 rgba(var(--primary-rgb), 0.4)",
                            "0 0 0 10px rgba(var(--primary-rgb), 0)",
                            "0 0 0 0 rgba(var(--primary-rgb), 0)"
                          ]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          delay: index * 0.3
                        }}
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${categoria.color} flex items-center justify-center shadow-lg shadow-primary/40`}
                      >
                        <Scale className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>
                    
                    {/* Card da Categoria - Tamanho fixo */}
                    <div className="w-full">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(categoria.route)}
                        className="w-full h-[70px] rounded-2xl bg-card/95 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all overflow-hidden flex items-center gap-3 px-3"
                      >
                        <div className={`${categoria.bgColor} rounded-xl p-2.5 flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-sm text-foreground flex-1 text-left">
                          {categoria.title}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
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
