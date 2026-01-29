import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TrilhasEticaTema = () => {
  const navigate = useNavigate();
  const { temaId } = useParams();

  // Buscar tema
  const { data: tema, isLoading: loadingTema } = useQuery({
    queryKey: ["oab-etica-tema", temaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oab_etica_temas")
        .select("*")
        .eq("id", parseInt(temaId!))
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!temaId,
  });

  // Buscar tópicos do tema
  const { data: topicos, isLoading: loadingTopicos } = useQuery({
    queryKey: ["oab-etica-topicos", temaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oab_etica_topicos")
        .select("*")
        .eq("tema_id", parseInt(temaId!))
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!temaId,
  });

  const isLoading = loadingTema || loadingTopicos;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0d0d14]/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <button 
            onClick={() => navigate('/oab/trilhas-etica')}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
        </div>
      </div>

      {/* Hero com Capa */}
      {tema?.capa_url && (
        <div className="relative w-full aspect-video max-h-[180px] overflow-hidden">
          <img 
            src={tema.capa_url} 
            alt={tema.titulo}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d14] via-[#0d0d14]/50 to-transparent" />
        </div>
      )}

      {/* Título do Tema */}
      <div className={`px-4 ${tema?.capa_url ? '-mt-12 relative z-10' : 'pt-6'} pb-4`}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-red-400">{tema?.ordem}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500">Ética Profissional</span>
              <h1 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                {tema?.titulo}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Tópicos */}
      <div className="px-4 pb-24">
        <div className="max-w-lg mx-auto space-y-3">
          {topicos?.map((topico, index) => (
            <motion.button
              key={topico.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/oab/trilhas-etica/topico/${topico.id}`)}
              className="w-full text-left bg-neutral-800 rounded-xl border border-white/10 overflow-hidden hover:border-red-500/30 transition-all group"
            >
              <div className="flex">
                {/* Capa do Tópico */}
                <div className="w-20 h-20 flex-shrink-0 relative bg-neutral-900">
                  {topico.capa_url ? (
                    <img 
                      src={topico.capa_url} 
                      alt={topico.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-900/30 to-red-900/30 flex items-center justify-center">
                      <span className="text-2xl font-bold text-red-500/50">{topico.ordem}</span>
                    </div>
                  )}
                  {/* Badge de Ordem */}
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-xs font-bold text-red-400">
                    {String(topico.ordem).padStart(2, '0')}
                  </div>
                </div>
                
                {/* Conteúdo */}
                <div className="flex-1 p-3 flex items-center">
                  <h3 className="font-medium text-white group-hover:text-red-400 transition-colors text-sm line-clamp-2">
                    {topico.titulo}
                  </h3>
                </div>
              </div>
            </motion.button>
          ))}

          {(!topicos || topicos.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                Os tópicos ainda estão sendo extraídos.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrilhasEticaTema;
