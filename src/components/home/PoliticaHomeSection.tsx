import { memo, useState, useMemo } from "react";
import { Landmark, ArrowRight, Book, FileText, Film, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PoliticaHomeSectionProps {
  isDesktop: boolean;
  navigate: (path: string) => void;
  handleLinkHover: (path: string) => void;
}

type TabType = 'livros' | 'artigos' | 'documentarios';

interface Livro {
  id: number;
  livro: string | null;
  autor: string | null;
  imagem: string | null;
  area: string | null;
}

interface Artigo {
  id: string;
  titulo: string;
  resumo: string | null;
  imagem_url: string | null;
  orientacao: string;
}

interface Documentario {
  id: string;
  titulo: string;
  thumbnail: string | null;
  canal: string | null;
  video_id: string;
}

export const PoliticaHomeSection = memo(({ isDesktop, navigate, handleLinkHover }: PoliticaHomeSectionProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('livros');

  // Buscar Livros
  const { data: livros = [], isLoading: loadingLivros } = useQuery({
    queryKey: ['politica-livros-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('BIBLIOTECA-POLITICA')
        .select('id, livro, autor, imagem, area')
        .order('id', { ascending: true })
        .limit(12);
      if (error) throw error;
      return data as Livro[];
    },
    staleTime: 1000 * 60 * 30,
  });

  // Buscar Artigos
  const { data: artigos = [], isLoading: loadingArtigos } = useQuery({
    queryKey: ['politica-artigos-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('politica_blog_orientacao')
        .select('id, titulo, resumo, imagem_url, orientacao')
        .order('ordem', { ascending: true })
        .limit(12);
      if (error) throw error;
      return data as Artigo[];
    },
    staleTime: 1000 * 60 * 30,
  });

  // Buscar Documentários
  const { data: documentarios = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['politica-docs-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('politica_documentarios')
        .select('id, titulo, thumbnail, canal, video_id')
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as Documentario[];
    },
    staleTime: 1000 * 60 * 30,
  });

  const isLoading = activeTab === 'livros' ? loadingLivros : 
                    activeTab === 'artigos' ? loadingArtigos : loadingDocs;

  const getOrientacaoColor = (o: string | null) => {
    switch (o) {
      case 'esquerda': return 'bg-red-500/80 text-white';
      case 'centro': return 'bg-yellow-500/80 text-black';
      case 'direita': return 'bg-blue-500/80 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const tabs = [
    { id: 'livros' as TabType, label: 'Livros', icon: Book },
    { id: 'artigos' as TabType, label: 'Artigos', icon: FileText },
    { id: 'documentarios' as TabType, label: 'Docs', icon: Film },
  ];

  return (
    <div className="space-y-3" data-tutorial="politica-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <Landmark className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <h3 className="font-playfair text-xl md:text-lg font-bold text-amber-100 tracking-tight">
              Política
            </h3>
            <p className="text-white/70 text-xs">
              Explore todas as perspectivas
            </p>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/politica')}
          onMouseEnter={() => handleLinkHover('/politica')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
        >
          <span>Ver tudo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Container com gradiente */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-red-800/30">
        {/* Menu de Alternância - Responsivo */}
        <div className="flex items-center justify-center mb-4">
          <div className="inline-flex items-center gap-0.5 bg-black/30 rounded-full p-1 overflow-x-auto max-w-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap flex-shrink-0",
                  activeTab === tab.id
                    ? "bg-white text-red-900 shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <tab.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo em Carrossel */}
        {isLoading ? (
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="flex-shrink-0 w-32 h-44 rounded-xl" />
            ))}
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {/* Livros */}
              {activeTab === 'livros' && livros.map((livro) => (
                <button
                  key={livro.id}
                  onClick={() => navigate(`/politica/livro/${livro.id}`)}
                  className="flex-shrink-0 w-28 group"
                >
                  <div className="relative w-full h-40 rounded-xl overflow-hidden bg-secondary mb-2">
                    {livro.imagem ? (
                      <img
                        src={livro.imagem}
                        alt={livro.livro || ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-800/50 to-red-950">
                        <Book className="w-8 h-8 text-white/40" />
                      </div>
                    )}
                    {/* Badge de orientação */}
                    {livro.area && (
                      <div className={`absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getOrientacaoColor(livro.area)}`}>
                        {livro.area === 'esquerda' ? 'E' : livro.area === 'centro' ? 'C' : 'D'}
                      </div>
                    )}
                  </div>
                  <h4 className="text-xs font-medium text-white line-clamp-2 text-left group-hover:text-amber-100 transition-colors">
                    {livro.livro}
                  </h4>
                  {livro.autor && (
                    <p className="text-[10px] text-white/50 line-clamp-1 text-left mt-0.5">
                      {livro.autor}
                    </p>
                  )}
                </button>
              ))}

              {/* Artigos */}
              {activeTab === 'artigos' && artigos.map((artigo) => (
                <button
                  key={artigo.id}
                  onClick={() => navigate(`/politica/artigo/${artigo.id}`)}
                  className="flex-shrink-0 w-40 group"
                >
                  <div className="relative w-full h-24 rounded-xl overflow-hidden bg-secondary mb-2">
                    {artigo.imagem_url ? (
                      <img
                        src={artigo.imagem_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-800/50 to-red-950">
                        <FileText className="w-6 h-6 text-white/40" />
                      </div>
                    )}
                    {/* Badge de orientação */}
                    <div className={`absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getOrientacaoColor(artigo.orientacao)}`}>
                      {artigo.orientacao === 'esquerda' ? 'Esq' : artigo.orientacao === 'centro' ? 'Centro' : 'Dir'}
                    </div>
                  </div>
                  <h4 className="text-xs font-medium text-white line-clamp-2 text-left group-hover:text-amber-100 transition-colors">
                    {artigo.titulo}
                  </h4>
                </button>
              ))}

              {/* Documentários */}
              {activeTab === 'documentarios' && documentarios.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => navigate(`/politica/documentario/${doc.id}`)}
                  className="flex-shrink-0 w-44 group"
                >
                  <div className="relative w-full h-24 rounded-xl overflow-hidden bg-secondary mb-2">
                    {doc.thumbnail ? (
                      <img
                        src={doc.thumbnail}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-800/50 to-red-950">
                        <Film className="w-6 h-6 text-white/40" />
                      </div>
                    )}
                    {/* Play icon */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <h4 className="text-xs font-medium text-white line-clamp-2 text-left group-hover:text-amber-100 transition-colors">
                    {doc.titulo}
                  </h4>
                  {doc.canal && (
                    <p className="text-[10px] text-white/50 line-clamp-1 text-left mt-0.5">
                      {doc.canal}
                    </p>
                  )}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

      </div>
    </div>
  );
});

PoliticaHomeSection.displayName = 'PoliticaHomeSection';

export default PoliticaHomeSection;
