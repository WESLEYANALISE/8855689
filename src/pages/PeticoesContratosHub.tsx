import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, FilePlus, ScrollText, FileSignature, Footprints } from "lucide-react";
import { motion } from "framer-motion";
import heroFerramentas from "@/assets/hero-ferramentas.webp";
import { StandardPageHeader } from "@/components/StandardPageHeader";

type TabType = "peticoes" | "contratos";

interface TrailItem {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: string;
  coverGradient: string;
}

const PeticoesContratosHub = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("peticoes");

  const tabs = [
    { id: "peticoes" as TabType, label: "Petições", icon: ScrollText },
    { id: "contratos" as TabType, label: "Contratos", icon: FileSignature },
  ];

  const peticoesItems: TrailItem[] = [
    {
      title: "Modelos de Petições",
      subtitle: "Mais de 30 mil modelos prontos para usar",
      icon: <FileText className="w-7 h-7 text-white" />,
      onClick: () => navigate("/advogado/modelos"),
      badge: "30.000+",
      coverGradient: "from-amber-600/50 to-orange-700/40",
    },
    {
      title: "Criar Petição",
      subtitle: "Gere petições personalizadas com IA",
      icon: <FilePlus className="w-7 h-7 text-white" />,
      onClick: () => navigate("/advogado/criar"),
      coverGradient: "from-blue-600/50 to-indigo-700/40",
    },
  ];

  const contratosItems: TrailItem[] = [
    {
      title: "Criar Contrato",
      subtitle: "Gere contratos personalizados com IA",
      icon: <FilePlus className="w-7 h-7 text-white" />,
      onClick: () => navigate("/advogado/contratos/criar"),
      coverGradient: "from-purple-600/50 to-violet-700/40",
    },
  ];

  const activeItems = activeTab === "peticoes" ? peticoesItems : contratosItems;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="fixed inset-0">
        <img 
          src={heroFerramentas}
          alt="Background"
          className="w-full h-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
      </div>
      
      {/* Dark gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]" />
      
      {/* Standard Header - Fixed position to cover safe area */}
      <StandardPageHeader 
        title="Petições e Contratos"
        backPath="/"
        position="fixed"
      />
      
      {/* Content */}
      <div className="relative z-10 pt-16">
        {/* Title Section */}
        <div className="px-4 py-4">
          <div className="max-w-lg mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <ScrollText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  Petições e Contratos
                </h1>
                <p className="text-sm text-gray-400">
                  Modelos prontos e geração com IA
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Toggle Tabs */}
        <div className="px-4 py-3">
          <div className="max-w-lg mx-auto">
            <div className="flex bg-[#12121a]/80 backdrop-blur-sm rounded-xl p-1 border border-white/10">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all ${
                      isActive
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Trail Timeline */}
        <div className="px-4 pb-24 pt-6">
          <div className="max-w-lg mx-auto relative">
            {/* Linha central da timeline */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
              <div className="w-full h-full bg-gradient-to-b from-amber-500/80 via-amber-600/60 to-amber-700/40 rounded-full" />
              {/* Animação de fluxo */}
              <motion.div
                className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-amber-300/30 to-transparent rounded-full"
                animate={{ y: ["0%", "300%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>
            
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {activeItems.map((item, index) => {
                const isLeft = index % 2 === 0;
                
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 }}
                    className={`relative flex items-center ${
                      isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
                    }`}
                  >
                    {/* Marcador no centro */}
                    <div className="absolute left-1/2 -translate-x-1/2 z-10">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.15, 1],
                          boxShadow: [
                            "0 0 0 0 rgba(245, 158, 11, 0.4)",
                            "0 0 0 10px rgba(245, 158, 11, 0)",
                            "0 0 0 0 rgba(245, 158, 11, 0.4)"
                          ]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          delay: index * 0.3
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-amber-500 to-amber-700 shadow-amber-500/40"
                      >
                        <Footprints className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>
                    
                    {/* Card - Mesmo tamanho das Trilhas OAB */}
                    <div className="w-full">
                      <motion.button
                        onClick={item.onClick}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full rounded-2xl bg-[#12121a]/90 backdrop-blur-sm border border-white/10 hover:border-amber-500/50 transition-all overflow-hidden text-left min-h-[200px] flex flex-col"
                      >
                        {/* Capa da matéria - igual TrilhasAprovacao */}
                        <div className={`h-20 w-full overflow-hidden relative flex-shrink-0 bg-gradient-to-br ${item.coverGradient}`}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                              {item.icon}
                            </div>
                          </div>
                          
                          {/* Badge */}
                          {item.badge && (
                            <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-amber-500/30 border border-amber-500/50">
                              <span className="text-xs font-bold text-amber-200">{item.badge}</span>
                            </div>
                          )}
                          
                          {/* Área label */}
                          <div className="absolute bottom-2 left-3">
                            <p className="text-xs font-semibold drop-shadow-lg text-amber-400">
                              {activeTab === "peticoes" ? "Petições" : "Contratos"}
                            </p>
                          </div>
                        </div>
                        
                        {/* Conteúdo */}
                        <div className="flex-1 p-3 flex flex-col">
                          <div className="flex-1">
                            <h3 className="font-medium text-[13px] leading-snug text-white">
                              {item.title}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">
                              {item.subtitle}
                            </p>
                          </div>
                          
                          {/* Barra decorativa */}
                          <div className="mt-3">
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                                style={{ width: "100%" }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeticoesContratosHub;
