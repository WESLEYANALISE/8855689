import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Search, Footprints, Loader2, Lock, Crown, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFlashcardsAreasCache } from "@/hooks/useFlashcardsAreasCache";
import { useContentLimit } from "@/hooks/useContentLimit";
import { useHierarchicalNavigation } from "@/hooks/useHierarchicalNavigation";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import themisBackground from "@/assets/themis-estudos-background.webp";

// Preload da imagem de fundo
const preloadImage = new Image();
preloadImage.src = themisBackground;

const FlashcardsAreas = () => {
  const navigate = useNavigate();
  const { goBack } = useHierarchicalNavigation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showPremiumCard, setShowPremiumCard] = useState(false);

  const { areas, totalFlashcards, isLoading } = useFlashcardsAreasCache();

  const filteredAreas = areas?.filter((area) =>
    area.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Aplicar limite de conteúdo premium (20%)
  const { visibleItems, lockedItems, isPremiumRequired } = useContentLimit(filteredAreas, 'flashcards');

  const displayAreas = visibleItems || [];

  // Ícones por área
  const areaIcons: Record<string, string> = {
    "Direito Penal": "⚖️",
    "Direito Civil": "📜",
    "Direito Constitucional": "🏛️",
    "Direito Administrativo": "📋",
    "Direito Tributário": "💰",
    "Direito do Trabalho": "💼",
    "Direito Empresarial": "🏢",
    "Direito Processual Civil": "📄",
    "Direito Processual Penal": "🔍",
    "Direito Ambiental": "🌿",
  };

  const getIcon = (area: string) => {
    return areaIcons[area] || "📕";
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image - sempre visível */}
      <div className="fixed inset-0">
        <img 
          src={themisBackground}
          alt="Background Flashcards"
          className="w-full h-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
      </div>
      
      {/* Dark gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col pb-24">
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md px-4 pt-6 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => goBack()}
              className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full w-10 h-10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <div className="inline-flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
            </div>
          </div>
          <p className="text-muted-foreground text-sm ml-11">
            <span className="text-violet-400 font-semibold">{totalFlashcards.toLocaleString('pt-BR')}</span> flashcards disponíveis
          </p>
        </div>

        {/* Loading state com fundo visível */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl px-8 py-6 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-4" />
              <p className="text-gray-400 text-sm">Carregando áreas...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="px-4 py-3">
              <div className="max-w-lg mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Buscar área..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-3 h-10 rounded-full border border-white/10 bg-black/40 text-white text-sm placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Timeline de Áreas */}
            <div className="px-4 pb-24 pt-4">
              <div className="max-w-lg mx-auto relative">
                {/* Linha central da timeline */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
                  <div className="w-full h-full bg-gradient-to-b from-violet-500/80 via-violet-600/60 to-violet-700/40 rounded-full" />
                  {/* Animação de fluxo elétrico */}
                  <motion.div
                    className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-violet-300/30 to-transparent rounded-full"
                    animate={{ y: ["0%", "300%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                
                {displayAreas.length === 0 && lockedItems.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    Nenhuma área encontrada
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Áreas liberadas */}
                    {displayAreas.map((area, index) => {
                      const isLeft = index % 2 === 0;
                      
                      return (
                        <motion.div
                          key={area.area}
                          initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08 }}
                          className={`relative flex items-center ${
                            isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
                          }`}
                        >
                          {/* Marcador Pegada no centro */}
                          <div className="absolute left-1/2 -translate-x-1/2 z-10">
                            <motion.div
                              animate={{ 
                                scale: [1, 1.15, 1],
                                boxShadow: [
                                  "0 0 0 0 rgba(139, 92, 246, 0.4)",
                                  "0 0 0 10px rgba(139, 92, 246, 0)",
                                  "0 0 0 0 rgba(139, 92, 246, 0.4)"
                                ]
                              }}
                              transition={{ 
                                duration: 2, 
                                repeat: Infinity,
                                delay: index * 0.2
                              }}
                              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-violet-500 to-violet-700 shadow-violet-500/40"
                            >
                              <Footprints className="w-5 h-5 text-white" />
                            </motion.div>
                          </div>
                          
                          {/* Card da Área */}
                          <div className="w-full">
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => navigate(`/flashcards/temas?area=${encodeURIComponent(area.area)}`)}
                              className="cursor-pointer rounded-2xl bg-[#12121a]/90 backdrop-blur-sm border border-white/10 hover:border-violet-500/50 transition-all overflow-hidden min-h-[180px] flex flex-col"
                            >
                              {/* Capa */}
                              <div className="h-20 w-full overflow-hidden relative flex-shrink-0">
                                {area.urlCapa ? (
                                  <>
                                    <img 
                                      src={area.urlCapa} 
                                      alt={area.area}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                    <span className="text-4xl">{getIcon(area.area)}</span>
                                  </div>
                                )}
                                
                                {/* Número da área */}
                                <div className="absolute bottom-2 left-3">
                                  <p className="text-xs font-semibold drop-shadow-lg text-violet-400">
                                    Área {index + 1}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Conteúdo */}
                              <div className="flex-1 p-3 flex flex-col">
                                <div className="flex-1">
                                  <h3 className="font-medium text-[13px] leading-snug text-white">
                                    {area.area}
                                  </h3>
                                  
                                  {/* Contagem de flashcards */}
                                  <div className="flex items-center gap-1 mt-2">
                                    <Sparkles className="w-3 h-3 text-yellow-400" />
                                    <span className="text-xs text-yellow-400 font-medium">
                                      {area.totalFlashcards.toLocaleString('pt-BR')} flashcards
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Barra de progresso */}
                                <div className="mt-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-gray-500">Progresso</span>
                                    <span className="text-[10px] text-green-400 font-medium">0%</span>
                                  </div>
                                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                                      style={{ width: '0%' }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Áreas bloqueadas (Premium) */}
                    {lockedItems.map((area, index) => {
                      const realIndex = displayAreas.length + index;
                      const isLeft = realIndex % 2 === 0;
                      
                      return (
                        <motion.div
                          key={area.area}
                          initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: realIndex * 0.08 }}
                          className={`relative flex items-center ${
                            isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
                          }`}
                        >
                          {/* Marcador bloqueado no centro */}
                          <div className="absolute left-1/2 -translate-x-1/2 z-10">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-amber-500 to-amber-700 shadow-amber-500/40">
                              <Lock className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          
                          {/* Card bloqueado */}
                          <div className="w-full">
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setShowPremiumCard(true)}
                              className="cursor-pointer rounded-2xl bg-[#12121a]/70 backdrop-blur-sm border border-amber-500/30 hover:border-amber-500/50 transition-all overflow-hidden min-h-[180px] flex flex-col opacity-80"
                            >
                              {/* Capa */}
                              <div className="h-20 w-full overflow-hidden relative flex-shrink-0">
                                {area.urlCapa ? (
                                  <>
                                    <img 
                                      src={area.urlCapa} 
                                      alt={area.area}
                                      className="w-full h-full object-cover blur-[2px] grayscale"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                    <span className="text-4xl opacity-50">{getIcon(area.area)}</span>
                                  </div>
                                )}
                                
                                {/* Badge premium */}
                                <div className="absolute top-2 right-2">
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-[10px] font-medium">
                                    <Crown className="w-3 h-3" />
                                    Premium
                                  </span>
                                </div>
                              </div>
                              
                              {/* Conteúdo */}
                              <div className="flex-1 p-3 flex flex-col">
                                <div className="flex-1">
                                  <h3 className="font-medium text-[13px] leading-snug text-white/60">
                                    {area.area}
                                  </h3>
                                  
                                  {/* Contagem de flashcards */}
                                  <div className="flex items-center gap-1 mt-2">
                                    <Sparkles className="w-3 h-3 text-amber-400/70" />
                                    <span className="text-xs text-amber-400/70 font-medium">
                                      {area.totalFlashcards.toLocaleString('pt-BR')} flashcards
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Indicador bloqueado */}
                                <div className="mt-3 text-center">
                                  <span className="text-xs text-amber-400/80">Desbloqueie com Premium</span>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Premium Card */}
      <PremiumFloatingCard
        isOpen={showPremiumCard}
        onClose={() => setShowPremiumCard(false)}
        title="Flashcards Premium"
        description="Desbloqueie todas as áreas de flashcards assinando um dos nossos planos."
      />
    </div>
  );
};

export default FlashcardsAreas;
