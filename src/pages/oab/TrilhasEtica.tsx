import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, BookOpen, FileText, ChevronRight, ImageIcon, Footprints } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { OABEticaPdfProcessorModal } from "@/components/oab/OABEticaPdfProcessorModal";
import bgTrilhasOab from "@/assets/bg-trilhas-oab.webp";

const TrilhasEtica = () => {
  const navigate = useNavigate();
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Buscar temas de ética (que funcionam como a lista de tópicos diretos do PDF único)
  const { data: temas, isLoading } = useQuery({
    queryKey: ["oab-etica-temas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oab_etica_temas")
        .select("*")
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const temTemas = temas && temas.length > 0;

  return (
    <div className="min-h-screen bg-[#0d0d14] relative">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <img 
          src={bgTrilhasOab} 
          alt=""
          className="w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d14]/60 via-[#0d0d14]/80 to-[#0d0d14]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#0d0d14]/90 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-lg mx-auto px-4 py-3">
            <button 
              onClick={() => navigate('/oab/trilhas-aprovacao')}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="px-4 pt-8 pb-6">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center border border-red-500/30">
              <BookOpen className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
              Ética Profissional
            </h1>
            <p className="text-sm text-gray-400">
              Estatuto da OAB e Código de Ética
            </p>
            {temas && temas.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {temas.length} tópicos disponíveis
              </p>
            )}
            
            {/* Botão para processar PDF - só aparece se não tem temas */}
            {!temTemas && (
              <div className="mt-4 flex justify-center gap-2">
                <Button 
                  onClick={() => setShowPdfModal(true)}
                  className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Carregar PDF
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Timeline de Tópicos - Layout similar a TrilhasAprovacao */}
        <div className="px-4 pb-24 pt-4">
          <div className="max-w-lg mx-auto relative">
            {/* Linha central da timeline */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
              <div className="w-full h-full bg-gradient-to-b from-red-500/80 via-red-600/60 to-red-700/40 rounded-full" />
              <motion.div
                className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-red-300/30 to-transparent rounded-full"
                animate={{ y: ["0%", "300%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>
            
            <div className="space-y-6">
              {temas?.map((tema, index) => {
                const isLeft = index % 2 === 0;
                
                return (
                  <motion.div
                    key={tema.id}
                    initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
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
                            "0 0 0 0 rgba(239, 68, 68, 0.4)",
                            "0 0 0 10px rgba(239, 68, 68, 0)",
                            "0 0 0 0 rgba(239, 68, 68, 0.4)"
                          ]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          delay: index * 0.2
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/40"
                      >
                        <Footprints className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>
                    
                    {/* Card do Tópico */}
                    <div className="w-full">
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/oab/trilhas-etica/estudo/${tema.id}`)}
                        className="cursor-pointer rounded-2xl backdrop-blur-sm border transition-all overflow-hidden min-h-[140px] flex flex-col bg-[#12121a]/90 border-white/10 hover:border-red-500/50"
                      >
                        {/* Capa do tema */}
                        <div className="h-16 w-full overflow-hidden relative flex-shrink-0">
                          {tema.capa_url ? (
                            <>
                              <img 
                                src={tema.capa_url} 
                                alt={tema.titulo}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-800 to-red-900">
                              <ImageIcon className="w-6 h-6 text-white/30" />
                            </div>
                          )}
                          
                          {/* Badge de ordem */}
                          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md">
                            <span className="text-xs font-bold text-red-400">
                              {String(tema.ordem).padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                        
                        {/* Conteúdo */}
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <h3 className="font-medium text-sm text-white line-clamp-2">
                            {tema.titulo}
                          </h3>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              Págs. {tema.pagina_inicial}-{tema.pagina_final}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Mensagem quando não tem temas */}
            {!temTemas && (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50 text-red-400" />
                <p className="text-lg font-medium text-white">Nenhum tópico encontrado</p>
                <p className="text-xs text-gray-500 mt-1">Carregue um PDF para extrair os tópicos automaticamente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de processamento de PDF para Ética */}
      <OABEticaPdfProcessorModal
        open={showPdfModal}
        onOpenChange={setShowPdfModal}
        onComplete={() => {
          setShowPdfModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
};

export default TrilhasEtica;
