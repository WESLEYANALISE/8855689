import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, BookOpen, FileText, ChevronRight, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { OABEticaPdfProcessorModal } from "@/components/oab/OABEticaPdfProcessorModal";
import bgTrilhasOab from "@/assets/bg-trilhas-oab.webp";

const TrilhasEtica = () => {
  const navigate = useNavigate();
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Buscar temas de ética com polling para atualização de capas
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
    // Polling rápido (2s) se há temas sem capa
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasPendingCapa = data?.some(t => 
        t.status === "concluido" && !t.capa_url
      );
      return hasPendingCapa ? 2000 : false;
    },
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

        {/* Lista de Temas - Layout igual Conceitos */}
        <div className="px-4 pb-24">
          <div className="max-w-lg mx-auto space-y-3">
            {temas?.map((tema, index) => {
              return (
                <motion.button
                  key={tema.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => navigate(`/oab/trilhas-etica/${tema.id}`)}
                  className="w-full text-left bg-neutral-800/90 hover:bg-neutral-700/90 border border-neutral-700/50 rounded-xl transition-all overflow-hidden"
                >
                  <div className="flex items-center">
                    {/* Capa à esquerda - quadrada */}
                    <div className="relative w-20 h-20 flex-shrink-0 bg-neutral-800 rounded-l-xl overflow-hidden">
                      {tema.capa_url ? (
                        <img 
                          key={`${tema.id}-${tema.capa_url}`}
                          src={tema.capa_url} 
                          alt={tema.titulo}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      {/* Fallback sempre presente, oculto quando há capa */}
                      <div 
                        className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/50 to-red-950/70"
                        style={{ display: tema.capa_url ? 'none' : 'flex' }}
                      >
                        <ImageIcon className="w-6 h-6 text-red-500/50" />
                      </div>
                      {/* Número no canto inferior esquerdo */}
                      <div className="absolute bottom-0 left-0 bg-red-500/90 text-white text-xs font-bold px-2 py-1 rounded-tr-lg">
                        {String(tema.ordem).padStart(2, '0')}
                      </div>
                    </div>
                    
                    {/* Conteúdo à direita */}
                    <div className="flex-1 min-w-0 px-3 py-2">
                      <h3 className="text-sm font-medium leading-snug text-neutral-100">
                        {tema.titulo}
                      </h3>
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0 mr-3" />
                  </div>
                </motion.button>
              );
            })}
            
            {/* Mensagem quando não tem temas */}
            {!temTemas && (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50 text-red-400" />
                <p className="text-lg font-medium text-white">Nenhum tema encontrado</p>
                <p className="text-xs text-gray-500 mt-1">Carregue um PDF para extrair os temas automaticamente</p>
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
