import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AdvogadoArtigoModal } from './AdvogadoArtigoModal';
import { Card } from '@/components/ui/card';

interface Artigo {
  id: number;
  ordem: number;
  titulo: string;
  descricao_curta: string | null;
  url_capa: string | null;
  conteudo_gerado: string | null;
  fonte_url: string | null;
  url_audio: string | null;
}

export const AdvogadoBlogList = () => {
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtigo, setSelectedArtigo] = useState<Artigo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchArtigos = async () => {
      const { data, error } = await supabase
        .from('advogado_blog')
        .select('id, ordem, titulo, descricao_curta, url_capa, conteudo_gerado, fonte_url, url_audio')
        .order('ordem');

      if (!error && data) {
        setArtigos(data as unknown as Artigo[]);
      }
      setLoading(false);
    };

    fetchArtigos();
  }, []);

  const handleArtigoClick = (artigo: Artigo) => {
    setSelectedArtigo(artigo);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-card/50 p-4">
            <div className="flex gap-4">
              <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3">
        {artigos.map((artigo, index) => (
          <motion.div
            key={artigo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card
              onClick={() => handleArtigoClick(artigo)}
              className="bg-card/95 backdrop-blur-md border-border/50 hover:bg-card transition-all cursor-pointer group overflow-hidden"
            >
              <div className="p-4">
                <div className="flex gap-4 items-center">
                  {/* Imagem */}
                  <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-red-500/20 to-red-600/10">
                    {artigo.url_capa ? (
                      <img
                        src={artigo.url_capa}
                        alt={artigo.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-red-400/50" />
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <h4 className="font-semibold text-foreground line-clamp-2 group-hover:text-red-400 transition-colors flex-1">
                        {artigo.titulo}
                      </h4>
                      {!artigo.conteudo_gerado && (
                        <div className="bg-amber-500/90 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                          <Sparkles className="w-3 h-3" />
                          Em breve
                        </div>
                      )}
                    </div>
                    {artigo.descricao_curta && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {artigo.descricao_curta}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-red-400 transition-colors flex-shrink-0" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <AdvogadoArtigoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        artigo={selectedArtigo}
      />
    </>
  );
};
