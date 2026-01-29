import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, BookOpen, ChevronRight, ImageIcon, FileText, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OABTrilhasPdfProcessorModal } from "@/components/oab/OABTrilhasPdfProcessorModal";
import { Button } from "@/components/ui/button";
const OABTrilhasTopicos = () => {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const navigate = useNavigate();
  const { materiaId, topicoId } = useParams();
  const parsedMateriaId = materiaId ? parseInt(materiaId) : null;
  const parsedTopicoId = topicoId ? parseInt(topicoId) : null;

  // Buscar área (matéria principal - ex: Direito Constitucional) - CACHE FIRST
  const { data: area, isLoading: loadingArea } = useQuery({
    queryKey: ["oab-trilha-area", parsedMateriaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oab_trilhas_materias")
        .select("*")
        .eq("id", parsedMateriaId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!parsedMateriaId,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 60,    // 1 hora
  });

  // Buscar o tópico específico para pegar o título e capa - CACHE FIRST
  const { data: topico, isLoading: loadingTopico } = useQuery({
    queryKey: ["oab-trilha-topico", parsedTopicoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oab_trilhas_topicos")
        .select("*")
        .eq("id", parsedTopicoId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!parsedTopicoId,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 60,    // 1 hora
  });

  // Buscar subtemas do RESUMO baseado na área e tema - CACHE FIRST
  const { data: subtemas, isLoading: loadingSubtemas } = useQuery({
    queryKey: ["oab-trilha-subtemas-resumo", area?.nome, topico?.titulo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("RESUMO")
        .select("id, subtema, tema, area, url_imagem_resumo")
        .eq("area", area!.nome)
        .eq("tema", topico!.titulo)
        .order("id");
      if (error) throw error;
      return data;
    },
    enabled: !!area?.nome && !!topico?.titulo,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30,   // 30 minutos
  });

  const isLoading = loadingArea || loadingTopico || loadingSubtemas;
  const isEtica = area?.nome?.toLowerCase().includes("ética");
  const totalSubtemas = subtemas?.length || 0;

  // Capa de fallback: usar capa do tópico, ou da área, ou gradiente
  const fallbackCapa = topico?.capa_url || area?.capa_url;

  // Só mostra loading se não tem dados em cache
  if (isLoading && !area && !topico) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <Loader2 className={`w-8 h-8 animate-spin ${isEtica ? "text-amber-500" : "text-red-500"}`} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0d0d14]/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <button 
            onClick={() => navigate(`/oab/trilhas-aprovacao/materia/${parsedMateriaId}`)}
            className={`flex items-center gap-2 ${isEtica ? "text-amber-400 hover:text-amber-300" : "text-red-400 hover:text-red-300"} transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
        </div>
      </div>

      {/* Header com Capa de Fundo */}
      <div className="relative">
        {/* Imagem de Fundo */}
        <div className="absolute inset-0 h-48 overflow-hidden">
          {fallbackCapa ? (
            <img 
              src={fallbackCapa} 
              alt={topico?.titulo}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="sync"
            />
          ) : (
            <div className={`w-full h-full ${isEtica ? "bg-gradient-to-br from-amber-900 to-amber-950" : "bg-gradient-to-br from-red-900 to-red-950"}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d14]/60 via-[#0d0d14]/80 to-[#0d0d14]" />
        </div>

        {/* Conteúdo do Header */}
        <div className="relative z-10 px-4 pt-6 pb-4">
          <div className="max-w-lg mx-auto">
            {/* Badge + Título */}
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl ${isEtica ? "bg-amber-500/30" : "bg-red-500/30"} flex items-center justify-center flex-shrink-0 backdrop-blur-sm`}>
                <BookOpen className={`w-6 h-6 ${isEtica ? "text-amber-400" : "text-red-400"}`} />
              </div>
              <div>
                <span className={`text-xs font-mono ${isEtica ? "text-amber-400" : "text-red-400"}`}>
                  {area?.nome}
                </span>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {topico?.titulo}
                </h1>
              </div>
            </div>

            {/* Info - Progresso */}
            <div className={`rounded-xl p-3 ${isEtica ? "bg-amber-900/30" : "bg-neutral-800/80"} backdrop-blur-sm border ${isEtica ? "border-amber-500/20" : "border-white/10"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Seu progresso</span>
                <span className={`text-sm font-bold ${isEtica ? "text-amber-400" : "text-white"}`}>
                  0/{totalSubtemas}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Label Conteúdo */}
      <div className="px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2 text-gray-400">
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium">Conteúdo Programático</span>
        </div>
      </div>

      {/* Lista de Subtemas - Design igual Conceitos */}
      <div className="px-4 pb-24">
        <div className="max-w-lg mx-auto space-y-3">
          {subtemas && subtemas.length > 0 ? (
            subtemas.map((subtema, index) => (
              <motion.button
                key={subtema.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => navigate(`/oab/trilhas-aprovacao/materia/${parsedMateriaId}/topicos/${parsedTopicoId}/estudo/${subtema.id}`)}
                className={`w-full text-left bg-neutral-800 rounded-xl border border-white/10 overflow-hidden transition-all group ${
                  isEtica ? "hover:border-amber-500/30" : "hover:border-red-500/30"
                }`}
              >
                <div className="flex items-center">
                  {/* Capa - usa fallbackCapa do tema/área para todos */}
                  <div className="w-20 h-20 flex-shrink-0 relative bg-neutral-900 overflow-hidden rounded-l-xl">
                    {fallbackCapa ? (
                      <img 
                        src={fallbackCapa}
                        alt={subtema.subtema}
                        className="w-full h-full object-cover"
                        loading="eager"
                        fetchPriority="high"
                        decoding="sync"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        isEtica 
                          ? "bg-gradient-to-br from-amber-900/50 to-orange-900/50"
                          : "bg-gradient-to-br from-red-900/50 to-rose-900/50"
                      }`}>
                        <ImageIcon className={`w-6 h-6 ${isEtica ? "text-amber-500/50" : "text-red-500/50"}`} />
                      </div>
                    )}
                    {/* Badge do número no canto inferior esquerdo */}
                    <div className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-xs font-bold ${
                      isEtica ? "bg-amber-600 text-white" : "bg-red-600 text-white"
                    }`}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="flex-1 p-3 flex items-center justify-between min-h-[80px]">
                    <h3 className={`font-medium text-white transition-colors text-sm ${
                      isEtica ? "group-hover:text-amber-400" : "group-hover:text-red-400"
                    }`}>
                      {subtema.subtema}
                    </h3>
                    <ChevronRight className={`w-5 h-5 flex-shrink-0 ml-2 ${isEtica ? "text-amber-500/50" : "text-red-500/50"}`} />
                  </div>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-white">Nenhum tópico encontrado</p>
              <p className="text-sm mt-2 opacity-70">
                Área: {area?.nome || "N/A"} | Tema: {topico?.titulo || "N/A"}
              </p>
              <p className="text-xs text-gray-500 mt-1 mb-4">Carregue um PDF para extrair os temas automaticamente</p>
              <Button 
                onClick={() => setShowPdfModal(true)}
                className={`${isEtica ? "bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800" : "bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"}`}
              >
                <FileText className="w-4 h-4 mr-2" />
                Carregar PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Botão flutuante para reprocessar PDF quando já existem subtemas */}
      {subtemas && subtemas.length > 0 && (
        <div className="fixed bottom-20 right-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowPdfModal(true)}
            className={`rounded-full w-12 h-12 bg-[#12121a]/90 ${isEtica ? "border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10" : "border-red-500/30 hover:border-red-500 hover:bg-red-500/10"}`}
            title="Reprocessar PDF"
          >
            <RefreshCw className={`w-5 h-5 ${isEtica ? "text-amber-400" : "text-red-400"}`} />
          </Button>
        </div>
      )}

      {/* Modal de processamento de PDF */}
      <OABTrilhasPdfProcessorModal
        open={showPdfModal}
        onOpenChange={setShowPdfModal}
        topicoId={parsedTopicoId!}
        areaNome={area?.nome || ""}
        temaNome={topico?.titulo || ""}
        onComplete={() => {
          setShowPdfModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
};

export default OABTrilhasTopicos;
