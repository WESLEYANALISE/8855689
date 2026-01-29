import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { OabCarreiraArtigoModal } from "./OabCarreiraArtigoModal";
import { useDeviceType } from "@/hooks/use-device-type";

interface ArtigoCarreira {
  id: number;
  ordem: number;
  titulo: string;
  descricao_curta: string | null;
  pdf_url: string | null;
  texto_ocr: string | null;
  conteudo_gerado: string | null;
  url_capa: string | null;
  url_audio: string | null;
  topicos: string[] | null;
}

export const OabCarreiraBlogList = () => {
  const { isDesktop } = useDeviceType();
  const [artigos, setArtigos] = useState<ArtigoCarreira[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtigo, setSelectedArtigo] = useState<ArtigoCarreira | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchArtigos = async () => {
    try {
      const { data, error } = await supabase
        .from('oab_carreira_blog')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setArtigos(data || []);
      
      // Atualizar artigo selecionado se estiver aberto
      if (selectedArtigo && data) {
        const updated = data.find(a => a.ordem === selectedArtigo.ordem);
        if (updated) setSelectedArtigo(updated);
      }
    } catch (error) {
      console.error('Erro ao buscar artigos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtigos();
  }, []);

  const handleArtigoClick = async (artigo: ArtigoCarreira) => {
    // Buscar dados atualizados antes de abrir
    const { data } = await supabase
      .from('oab_carreira_blog')
      .select('*')
      .eq('ordem', artigo.ordem)
      .maybeSingle();
    
    setSelectedArtigo(data || artigo);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      // Recarregar lista ao fechar modal
      fetchArtigos();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div>
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className={`grid gap-3 ${isDesktop ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-neutral-900/90 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="bg-amber-900/30 rounded-2xl p-3 shadow-lg ring-1 ring-amber-700/30">
            <Briefcase className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground tracking-tight">
              Advogado Iniciante
            </h3>
            <p className="text-muted-foreground text-xs">Guia completo para advogados iniciantes</p>
          </div>
        </div>

        {/* Grid de Artigos */}
        <div className={`grid gap-3 ${isDesktop ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {artigos.map((artigo, index) => {
            const temConteudo = !!artigo.conteudo_gerado;
            
            return (
              <motion.div
                key={artigo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  onClick={() => handleArtigoClick(artigo)}
                  className={`group cursor-pointer bg-neutral-800/70 hover:bg-neutral-700/80 border-white/5 hover:border-amber-500/30 transition-all duration-200 overflow-hidden`}
                >
                  <div className="flex h-full">
                    {/* Imagem ou placeholder */}
                    <div className="w-20 flex-shrink-0 relative overflow-hidden self-stretch">
                      {artigo.url_capa ? (
                        <img
                          src={artigo.url_capa}
                          alt={artigo.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-900/40 to-amber-950/60 flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-amber-500/60" />
                        </div>
                      )}
                      {/* Badge de status */}
                      {!temConteudo && (
                        <div className="absolute top-1 right-1 bg-amber-500/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Sparkles className="w-2 h-2" />
                          Novo
                        </div>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                      <span className="text-amber-400/70 text-[10px] font-medium mb-0.5">
                        Guia {artigo.ordem}
                      </span>
                      <h4 className="font-semibold text-foreground text-sm group-hover:text-amber-300 transition-colors">
                        {artigo.titulo}
                      </h4>
                      {artigo.descricao_curta && (
                        <p className="text-muted-foreground text-[10px] line-clamp-1 mt-0.5">
                          {artigo.descricao_curta}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Modal do artigo */}
      {selectedArtigo && (
        <OabCarreiraArtigoModal
          open={modalOpen}
          onOpenChange={handleModalClose}
          artigo={selectedArtigo}
        />
      )}
    </div>
  );
};

export default OabCarreiraBlogList;
