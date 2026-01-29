import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, ChevronRight, Loader2 } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { NoticiaPoliticaCard } from './NoticiaPoliticaCard';
import { useNoticiasPoliticas } from '@/hooks/useNoticiasPoliticas';

export const NoticiasPoliticasCarousel: React.FC = () => {
  const navigate = useNavigate();
  const { noticias, isLoading } = useNoticiasPoliticas(3);
  
  // Pegar apenas as 3 mais recentes com imagem
  const noticiasComImagem = noticias.filter(n => n.imagem_url).slice(0, 3);
  return (
    <section className="mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-foreground">Notícias Políticas</h2>
        </div>
        
        <button
          onClick={() => navigate('/politica/noticias')}
          className="flex items-center gap-1 text-sm text-amber-500 hover:text-amber-400 transition-colors"
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
            noticiasComImagem.map((noticia) => (
              <NoticiaPoliticaCard
                key={noticia.id}
                titulo={noticia.titulo}
                fonte={noticia.fonte}
                imagemUrl={noticia.imagem_url}
                imagemUrlWebp={noticia.imagem_url_webp}
                dataPublicacao={noticia.data_publicacao}
                url={noticia.url}
                espectro={noticia.espectro}
                onClick={() => navigate(`/politica/noticias/${noticia.id}`)}
              />
            ))
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};
