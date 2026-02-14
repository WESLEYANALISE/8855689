import { memo, useMemo } from "react";
import { Landmark, ArrowRight, Book, FileText, Film } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface PoliticaHomeSectionProps {
  isDesktop: boolean;
  navigate: (path: string) => void;
  handleLinkHover: (path: string) => void;
}

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
  orientacao?: string | null;
}

const ORIENTACOES = [
  { key: 'esquerda', label: 'Esquerda', color: 'bg-red-500/80 text-white', badge: 'E' },
  { key: 'centro', label: 'Centro', color: 'bg-yellow-500/80 text-black', badge: 'C' },
  { key: 'direita', label: 'Direita', color: 'bg-blue-500/80 text-white', badge: 'D' },
];

const OrientacaoLabel = ({ orientacao }: { orientacao: string }) => {
  const o = ORIENTACOES.find(x => x.key === orientacao);
  if (!o) return null;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${o.color}`}>
      {o.label}
    </span>
  );
};

const SectionContainer = ({ 
  title, icon: Icon, children 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
}) => (
  <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-red-800/30">
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 bg-white/10 rounded-lg">
        <Icon className="w-4 h-4 text-amber-200" />
      </div>
      <h4 className="font-playfair text-base font-bold text-amber-100">{title}</h4>
    </div>
    {children}
  </div>
);

export const PoliticaHomeSection = memo(({ isDesktop, navigate, handleLinkHover }: PoliticaHomeSectionProps) => {
  // Buscar Livros
  const { data: livros = [], isLoading: loadingLivros } = useQuery({
    queryKey: ['politica-livros-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('BIBLIOTECA-POLITICA')
        .select('id, livro, autor, imagem, area')
        .order('id', { ascending: true })
        .limit(18);
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
        .limit(18);
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
        .select('id, titulo, thumbnail, canal, video_id, orientacao')
        .order('created_at', { ascending: false })
        .limit(18);
      if (error) throw error;
      return data as Documentario[];
    },
    staleTime: 1000 * 60 * 30,
  });

  // Agrupar por orientação
  const artigosPorOrientacao = useMemo(() => {
    return ORIENTACOES.map(o => ({
      ...o,
      items: artigos.filter(a => a.orientacao === o.key),
    }));
  }, [artigos]);

  const livrosPorOrientacao = useMemo(() => {
    return ORIENTACOES.map(o => ({
      ...o,
      items: livros.filter(l => l.area === o.key),
    }));
  }, [livros]);

  const docsPorOrientacao = useMemo(() => {
    return ORIENTACOES.map(o => ({
      ...o,
      items: documentarios.filter(d => (d.orientacao || '') === o.key),
    }));
  }, [documentarios]);

  const SkeletonRow = () => (
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="flex-shrink-0 w-32 h-44 rounded-xl" />)}
    </div>
  );

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
          <span>Ver mais</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. Artigos */}
      <SectionContainer title="Artigos" icon={FileText}>
        {loadingArtigos ? <SkeletonRow /> : (
          <div className="space-y-3">
            {artigosPorOrientacao.map(grupo => (
              grupo.items.length > 0 && (
                <div key={grupo.key}>
                  <div className="mb-2">
                    <OrientacaoLabel orientacao={grupo.key} />
                  </div>
                  <ScrollArea className="w-full">
                    <div className="flex gap-3 pb-2">
                      {grupo.items.map(artigo => (
                        <button
                          key={artigo.id}
                          onClick={() => navigate(`/politica/artigo/${artigo.id}`)}
                          className="flex-shrink-0 w-40 group text-left"
                        >
                          <div className="relative w-full h-24 rounded-xl overflow-hidden bg-secondary mb-2">
                            {artigo.imagem_url ? (
                              <img src={artigo.imagem_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-800/50 to-red-950">
                                <FileText className="w-6 h-6 text-white/40" />
                              </div>
                            )}
                          </div>
                          <h4 className="text-xs font-medium text-white line-clamp-2 group-hover:text-amber-100 transition-colors">
                            {artigo.titulo}
                          </h4>
                        </button>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              )
            ))}
          </div>
        )}
      </SectionContainer>

      {/* 2. Livros */}
      <SectionContainer title="Livros" icon={Book}>
        {loadingLivros ? <SkeletonRow /> : (
          <div className="space-y-3">
            {livrosPorOrientacao.map(grupo => (
              grupo.items.length > 0 && (
                <div key={grupo.key}>
                  <div className="mb-2">
                    <OrientacaoLabel orientacao={grupo.key} />
                  </div>
                  <ScrollArea className="w-full">
                    <div className="flex gap-3 pb-2">
                      {grupo.items.map(livro => (
                        <button
                          key={livro.id}
                          onClick={() => navigate(`/politica/livro/${livro.id}`)}
                          className="flex-shrink-0 w-28 group text-left"
                        >
                          <div className="relative w-full h-40 rounded-xl overflow-hidden bg-secondary mb-2">
                            {livro.imagem ? (
                              <img src={livro.imagem} alt={livro.livro || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-800/50 to-red-950">
                                <Book className="w-8 h-8 text-white/40" />
                              </div>
                            )}
                          </div>
                          <h4 className="text-xs font-medium text-white line-clamp-2 group-hover:text-amber-100 transition-colors">
                            {livro.livro}
                          </h4>
                          {livro.autor && (
                            <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5">{livro.autor}</p>
                          )}
                        </button>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              )
            ))}
          </div>
        )}
      </SectionContainer>

      {/* 3. Documentários */}
      <SectionContainer title="Documentários" icon={Film}>
        {loadingDocs ? <SkeletonRow /> : (
          <div className="space-y-3">
            {docsPorOrientacao.map(grupo => (
              grupo.items.length > 0 && (
                <div key={grupo.key}>
                  <div className="mb-2">
                    <OrientacaoLabel orientacao={grupo.key} />
                  </div>
                  <ScrollArea className="w-full">
                    <div className="flex gap-3 pb-2">
                      {grupo.items.map(doc => (
                        <button
                          key={doc.id}
                          onClick={() => navigate(`/politica/documentario/${doc.id}`)}
                          className="flex-shrink-0 w-44 group text-left"
                        >
                          <div className="relative w-full h-24 rounded-xl overflow-hidden bg-secondary mb-2">
                            {doc.thumbnail ? (
                              <img src={doc.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-800/50 to-red-950">
                                <Film className="w-6 h-6 text-white/40" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                          <h4 className="text-xs font-medium text-white line-clamp-2 group-hover:text-amber-100 transition-colors">
                            {doc.titulo}
                          </h4>
                          {doc.canal && (
                            <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5">{doc.canal}</p>
                          )}
                        </button>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              )
            ))}
            {/* Se não houver orientação nos docs, mostrar todos */}
            {docsPorOrientacao.every(g => g.items.length === 0) && documentarios.length > 0 && (
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-2">
                  {documentarios.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => navigate(`/politica/documentario/${doc.id}`)}
                      className="flex-shrink-0 w-44 group text-left"
                    >
                      <div className="relative w-full h-24 rounded-xl overflow-hidden bg-secondary mb-2">
                        {doc.thumbnail ? (
                          <img src={doc.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-800/50 to-red-950">
                            <Film className="w-6 h-6 text-white/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <h4 className="text-xs font-medium text-white line-clamp-2 group-hover:text-amber-100 transition-colors">
                        {doc.titulo}
                      </h4>
                      {doc.canal && (
                        <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5">{doc.canal}</p>
                      )}
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </div>
        )}
      </SectionContainer>
    </div>
  );
});

PoliticaHomeSection.displayName = 'PoliticaHomeSection';

export default PoliticaHomeSection;
