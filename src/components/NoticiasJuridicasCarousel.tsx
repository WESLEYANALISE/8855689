import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, ChevronRight, Loader2 } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UniversalImage } from '@/components/ui/universal-image';

interface NoticiaJuridica {
  id: string;
  titulo: string;
  fonte: string | null;
  imagem: string | null;
  imagem_webp: string | null;
  data_publicacao: string | null;
  link: string | null;
  categoria: string | null;
}

export const NoticiasJuridicasCarousel: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: noticias = [], isLoading } = useQuery({
    queryKey: ['noticias-juridicas-carousel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('noticias_juridicas_cache')
        .select('id, titulo, fonte, imagem, imagem_webp, data_publicacao, link, categoria')
        .not('imagem_webp', 'is', null)
        .order('data_publicacao', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return (data || []) as NoticiaJuridica[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  const noticiasComImagem = noticias.filter(n => n.imagem || n.imagem_webp);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return format(date, "dd/MM/yyyy, HH:mm", { locale: ptBR });
    } catch {
      return '';
    }
  };

  return (
    <section className="mt-2 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-xl">
            <Newspaper className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="font-cinzel text-lg font-bold text-red-100">Notícias Jurídicas</h2>
            <p className="text-xs text-white/70">Fique atualizado</p>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/noticias-juridicas')}
          className="flex items-center gap-1 text-sm bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-full px-4 py-2 font-medium"
        >
          Ver mais
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Carousel */}
      <ScrollArea className="w-full">
        <div 
          className="flex gap-3 pb-4"
          style={{
            willChange: 'transform',
            transform: 'translateZ(0)'
          }}
        >
          {isLoading && noticias.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 px-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Carregando notícias...</span>
            </div>
          ) : noticiasComImagem.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 px-2">
              Nenhuma notícia disponível no momento.
            </div>
          ) : (
            noticiasComImagem.map((noticia, index) => (
              <div
                key={noticia.id}
                onClick={() => navigate(`/noticias-juridicas/${noticia.id}`)}
                className="flex-shrink-0 w-[170px] cursor-pointer group"
              >
                <div className="bg-secondary/30 rounded-xl overflow-hidden transition-all hover:bg-secondary/50 hover:scale-[1.02]">
                  {/* Imagem */}
                  <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
                    <UniversalImage
                      src={noticia.imagem_webp || noticia.imagem || ''}
                      alt={noticia.titulo}
                      priority={index < 3}
                      blurCategory="news"
                      containerClassName="w-full h-full"
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Badge de categoria */}
                    {noticia.categoria && (
                      <Badge 
                        className="absolute bottom-2 left-2 bg-red-600/90 text-white text-[10px] px-2 py-0.5"
                      >
                        {noticia.categoria}
                      </Badge>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Conteúdo */}
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 whitespace-normal leading-tight text-foreground mb-2">
                      {noticia.titulo}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(noticia.data_publicacao)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};
