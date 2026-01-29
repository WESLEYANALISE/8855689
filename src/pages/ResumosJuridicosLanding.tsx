import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Footprints, Pencil, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import tribunalBackground from "@/assets/tribunal-julgamento.webp";
import { useResumosCount } from "@/hooks/useResumosCount";

export default function ResumosJuridicosLanding() {
  const navigate = useNavigate();
  const { totalResumos, resumosMateria } = useResumosCount();

  const cards = [
    {
      id: 1,
      title: "Resumos Jurídicos",
      description: "Resumos prontos organizados por área e tema do Direito",
      icon: BookOpen,
      count: resumosMateria,
      countLabel: "resumos",
      route: "/resumos-juridicos/prontos",
      gradient: "from-red-500 to-red-700",
    },
    {
      id: 2,
      title: "Resumos Personalizados",
      description: "Crie seus próprios resumos com IA",
      icon: Pencil,
      count: null,
      countLabel: null,
      route: "/resumos-juridicos/personalizado",
      gradient: "from-amber-500 to-amber-700",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="fixed inset-0">
        <img 
          src={tribunalBackground}
          alt="Tribunal"
          className="w-full h-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
      </div>
      
      {/* Dark gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header sticky com blur - padrão Vade Mecum */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Resumos Jurídicos</h1>
                <p className="text-muted-foreground text-sm">
                  Conhecimento para trilhar sua jornada
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Stats */}
        <div className="px-4 py-4 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-400" />
              <span>{totalResumos.toLocaleString('pt-BR')} resumos</span>
            </div>
          </div>
        </div>

        {/* Timeline de Cards */}
        <div className="px-4 pb-24 pt-4 flex-1">
          <div className="max-w-lg mx-auto relative">
            {/* Linha central da timeline */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
              <div className="w-full h-full bg-gradient-to-b from-red-500/80 via-red-600/60 to-red-700/40 rounded-full" />
              {/* Animação de fluxo elétrico */}
              <motion.div
                className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-red-300/30 to-transparent rounded-full"
                animate={{ y: ["0%", "300%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>
            
            <div className="space-y-6">
              {cards.map((card, index) => {
                const isLeft = index % 2 === 0;
                const Icon = card.icon;
                
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 }}
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
                            "0 0 0 0 rgba(239, 68, 68, 0.4)",
                            "0 0 0 10px rgba(239, 68, 68, 0)",
                            "0 0 0 0 rgba(239, 68, 68, 0.4)"
                          ]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          delay: index * 0.3
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/40"
                      >
                        <Footprints className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>
                    
                    {/* Card */}
                    <div className="w-full">
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(card.route)}
                        className="cursor-pointer rounded-2xl bg-[#12121a]/90 backdrop-blur-sm border border-white/10 hover:border-red-500/50 transition-all overflow-hidden"
                      >
                        {/* Header com ícone */}
                        <div className={`h-20 w-full bg-gradient-to-br ${card.gradient} flex items-center justify-center relative`}>
                          <Icon className="w-10 h-10 text-white" />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
                        </div>
                        
                        {/* Conteúdo */}
                        <div className="p-4">
                          <h3 className="font-medium text-sm text-white mb-1">
                            {card.title}
                          </h3>
                          <p className="text-xs text-gray-400 mb-3">
                            {card.description}
                          </p>
                          
                          {card.count !== null && (
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-yellow-400" />
                              <span className="text-xs text-yellow-400 font-medium">
                                {card.count.toLocaleString('pt-BR')} {card.countLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
