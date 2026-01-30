import { useNavigate } from "react-router-dom";
import { Book, Scale, ChevronRight, Gavel } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import heroBibliotecas from "@/assets/biblioteca-office-sunset.jpg";
import capaOabEstudos from "@/assets/capa-biblioteca-oab-estudos.jpg";
import capaOabRevisao from "@/assets/capa-biblioteca-oab-revisao.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StandardPageHeader } from "@/components/StandardPageHeader";

interface BibliotecaOABItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  color: string;
  capa: string;
  key: string;
}

const bibliotecasItems: BibliotecaOABItem[] = [
  {
    id: "estudos",
    title: "Estudos OAB",
    description: "Materiais completos para preparação do exame da OAB",
    icon: Scale,
    color: "#3b82f6",
    route: "/biblioteca-oab/estudos",
    capa: capaOabEstudos,
    key: "estudos",
  },
  {
    id: "revisao",
    title: "Revisão OAB",
    description: "Resumos e materiais de revisão para a prova",
    icon: Book,
    color: "#10b981",
    route: "/biblioteca-oab/revisao",
    capa: capaOabRevisao,
    key: "revisao",
  },
];

const BibliotecaOAB = () => {
  const navigate = useNavigate();

  // Hero image cache check
  const [imageLoaded, setImageLoaded] = useState(() => {
    const img = new Image();
    img.src = heroBibliotecas;
    return img.complete;
  });

  useEffect(() => {
    if (!imageLoaded) {
      const img = new Image();
      img.src = heroBibliotecas;
      img.onload = () => setImageLoaded(true);
    }
  }, [imageLoaded]);

  // Buscar contagens
  const { data: contagens } = useQuery({
    queryKey: ["contagens-biblioteca-oab"],
    queryFn: async () => {
      const { count } = await supabase
        .from("BIBILIOTECA-OAB" as any)
        .select("*", { count: "exact", head: true });
      return {
        estudos: count || 0,
        revisao: Math.floor((count || 0) * 0.4),
      };
    },
    staleTime: 1000 * 60 * 30,
  });

  const totalObras = contagens?.estudos || 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image - Fixed */}
      <div className="fixed inset-0">
        <img
          src={heroBibliotecas}
          alt="Biblioteca da OAB"
          className={`w-full h-full object-cover object-[50%_30%] transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
      </div>
      
      {/* Dark gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-black/70 to-neutral-900" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header padrão fixo */}
        <StandardPageHeader title="Bibliotecas" position="fixed" backPath="/bibliotecas" />
        
        {/* Hero section */}
        <div className="pt-14 pb-4 px-4">
          <div className="max-w-lg mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-blue-500/50" />
                <Scale className="w-4 h-4 text-blue-500/70" />
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-blue-500/50" />
              </div>
              
              <h1 className="text-2xl font-serif font-bold">
                <span className="bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 bg-clip-text text-transparent">
                  Biblioteca da OAB
                </span>
              </h1>

              <div className="mt-2 flex items-center justify-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span className="text-xs text-white/80">
                    <span className="font-semibold text-blue-300">{totalObras}</span> obras
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Timeline de Bibliotecas */}
        <div className="px-4 pb-24 pt-4">
          <div className="max-w-lg mx-auto relative">
            {/* Linha central da timeline */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-b from-blue-500/80 via-blue-600/60 to-blue-700/40 rounded-full" />
              {/* Animação de fluxo contínuo */}
              <motion.div
                className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white/60 via-blue-300/50 to-transparent rounded-full"
                animate={{ y: ["-100%", "500%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-blue-200/40 via-blue-400/30 to-transparent rounded-full"
                animate={{ y: ["-100%", "600%"] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "linear", delay: 1 }}
              />
            </div>
            
            <div className="space-y-6">
              {bibliotecasItems.map((item, index) => {
                const isLeft = index % 2 === 0;
                const Icon = item.icon;
                const count = contagens?.[item.key as keyof typeof contagens] || 0;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={`relative flex items-center ${
                      isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
                    }`}
                  >
                    {/* Marcador Martelo no centro */}
                    <div className="absolute left-1/2 -translate-x-1/2 z-10">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.15, 1],
                          boxShadow: [
                            `0 0 0 0 ${item.color}66`,
                            `0 0 0 10px ${item.color}00`,
                            `0 0 0 0 ${item.color}66`
                          ]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          delay: index * 0.3
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                        style={{ 
                          background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`,
                          boxShadow: `0 4px 20px ${item.color}50`
                        }}
                      >
                        <Gavel className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>
                    
                    {/* Card da Biblioteca - Formato Livro */}
                    <div className="w-full">
                      <motion.button
                        onClick={() => navigate(item.route)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full rounded-2xl overflow-hidden text-left"
                        style={{
                          boxShadow: `0 4px 20px ${item.color}30`
                        }}
                      >
                        {/* Capa estilo livro - aspect ratio 3:4 */}
                        <div className="aspect-[3/4] w-full overflow-hidden relative group">
                          <img 
                            src={item.capa} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="eager"
                            decoding="sync"
                          />
                          
                          {/* Badge de contagem - topo esquerdo */}
                          <div 
                            className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-sm"
                            style={{ backgroundColor: `${item.color}90` }}
                          >
                            <Book className="w-3 h-3 text-white" />
                            <span className="text-xs font-bold text-white">
                              {count}
                            </span>
                            <span className="text-[10px] text-white/80">livros</span>
                          </div>
                          
                          {/* Gradiente apenas na parte inferior para texto */}
                          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/90 to-transparent" />
                          
                          {/* Conteúdo sobre a capa */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            {/* Título */}
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="w-5 h-5" style={{ color: item.color }} />
                              <h3 className="font-bold text-lg text-white">
                                {item.title}
                              </h3>
                            </div>
                            
                            {/* Botão Acessar abaixo, alinhado à direita */}
                            <div className="flex justify-end">
                              <div 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium backdrop-blur-sm"
                                style={{ backgroundColor: `${item.color}cc` }}
                              >
                                <span>Acessar</span>
                                <motion.span
                                  animate={{ x: [0, 4, 0] }}
                                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </motion.span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.button>
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
};

export default BibliotecaOAB;
