import { memo, useState, useMemo } from "react";
import { Landmark, ArrowRight, Book, FileText, Film } from "lucide-react";
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

type OrientacaoType = 'esquerda' | 'centro' | 'direita';

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

const ORIENTACAO_TABS = [
  { key: 'esquerda' as OrientacaoType, label: 'Esquerda', activeColor: 'bg-red-500 text-white' },
  { key: 'centro' as OrientacaoType, label: 'Centro', activeColor: 'bg-yellow-500 text-black' },
  { key: 'direita' as OrientacaoType, label: 'Direita', activeColor: 'bg-blue-500 text-white' },
];

const OrientacaoMenu = ({ active, onChange }: { active: OrientacaoType; onChange: (o: OrientacaoType) => void }) => (
  <div className="flex items-center gap-1 bg-black/30 rounded-full p-1 w-fit mb-3">
    {ORIENTACAO_TABS.map(tab => (
      <button
        key={tab.key}
        onClick={() => onChange(tab.key)}
        className={cn(
          "px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap",
          active === tab.key ? tab.activeColor + " shadow-md" : "text-white/70 hover:text-white hover:bg-white/10"
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export const PoliticaHomeSection = memo(({ isDesktop, navigate, handleLinkHover }: PoliticaHomeSectionProps) => {
  const [artigosOrientacao, setArtigosOrientacao] = useState<OrientacaoType>('esquerda');
  const [livrosOrientacao, setLivrosOrientacao] = useState<OrientacaoType>('esquerda');
  const [docsOrientacao, setDocsOrientacao] = useState<OrientacaoType>('esquerda');

  const { data: livros = [], isLoading: loadingLivros } = useQuery({
    queryKey: ['politica-livros-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('BIBLIOTECA-POLITICA')
        .select('id, livro, autor, imagem, area')
        .order('id', { ascending: true })
        .limit(30);
      if (error) throw error;
      return data as Livro[];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: artigos = [], isLoading: loadingArtigos } = useQuery({
    queryKey: ['politica-artigos-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('politica_blog_orientacao')
        .select('id, titulo, resumo, imagem_url, orientacao')
        .order('ordem', { ascending: true })
        .limit(30);
      if (error) throw error;
      return data as Artigo[];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: documentarios = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['politica-docs-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('politica_documentarios')
        .select('id, titulo, thumbnail, canal, video_id, orientacao')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as Documentario[];
    },
    staleTime: 1000 * 60 * 30,
  });

  const filteredArtigos = useMemo(() => artigos.filter(a => a.orientacao === artigosOrientacao), [artigos, artigosOrientacao]);
  const filteredLivros = useMemo(() => livros.filter(l => l.area === livrosOrientacao), [livros, livrosOrientacao]);
  const filteredDocs = useMemo(() => documentarios.filter(d => (d.orientacao || '') === docsOrientacao), [documentarios, docsOrientacao]);

  const SkeletonRow = () => (
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3].map(i => <Skeleton key={i} className="flex-shrink-0 w-32 h-40 rounded-xl" />)}
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
            <h3 className="font-playfair text-xl md:text-lg font-bold text-amber-100 tracking-tight">Política</h3>
            <p className="text-white/70 text-xs">Explore todas as perspectivas</p>
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

      {/* Container 1: Artigos */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-red-800/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-white/10 rounded-lg">
            <FileText className="w-4 h-4 text-amber-200" />
          </div>
          <h4 className="font-playfair text-base font-bold text-amber-100">Artigos</h4>
        </div>
        <OrientacaoMenu active={artigosOrientacao} onChange={setArtigosOrientacao} />
        {loadingArtigos ? <SkeletonRow /> : (
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {filteredArtigos.map(artigo => (
                <button key={artigo.id} onClick={() => navigate(`/politica/artigo/${artigo.id}`)} className="flex-shrink-0 w-40 group text-left">
                  <div className="relative w-full h-24 rounded-xl overflow-hidden bg-secondary mb-1.5">
                    {artigo.imagem_url ? (
                      <img src={artigo.imagem_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-800/50 to-red-950">
                        <FileText className="w-6 h-6 text-white/40" />
                      </div>
                    )}
                  </div>
                  <h4 className="text-xs font-medium text-white line-clamp-2 group-hover:text-amber-100 transition-colors">{artigo.titulo}</h4>
                </button>
              ))}
              {filteredArtigos.length === 0 && (
                <p className="text-white/40 text-xs py-4">Nenhum artigo disponível</p>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>

      {/* Container 2: Livros */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-red-800/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-white/10 rounded-lg">
            <Book className="w-4 h-4 text-amber-200" />
          </div>
          <h4 className="font-playfair text-base font-bold text-amber-100">Livros</h4>
        </div>
        <OrientacaoMenu active={livrosOrientacao} onChange={setLivrosOrientacao} />
        {loadingLivros ? <SkeletonRow /> : (
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {filteredLivros.map(livro => (
                <button key={livro.id} onClick={() => navigate(`/politica/livro/${livro.id}`)} className="flex-shrink-0 w-28 group text-left">
                  <div className="relative w-full h-40 rounded-xl overflow-hidden bg-secondary mb-1.5">
                    {livro.imagem ? (
                      <img src={livro.imagem} alt={livro.livro || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-800/50 to-red-950">
                        <Book className="w-8 h-8 text-white/40" />
                      </div>
                    )}
                  </div>
                  <h4 className="text-xs font-medium text-white line-clamp-2 group-hover:text-amber-100 transition-colors">{livro.livro}</h4>
                  {livro.autor && <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5">{livro.autor}</p>}
                </button>
              ))}
              {filteredLivros.length === 0 && (
                <p className="text-white/40 text-xs py-4">Nenhum livro disponível</p>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>

      {/* Container 3: Documentários */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-red-800/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-white/10 rounded-lg">
            <Film className="w-4 h-4 text-amber-200" />
          </div>
          <h4 className="font-playfair text-base font-bold text-amber-100">Documentários</h4>
        </div>
        <OrientacaoMenu active={docsOrientacao} onChange={setDocsOrientacao} />
        {loadingDocs ? <SkeletonRow /> : (
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {filteredDocs.map(doc => (
                <button key={doc.id} onClick={() => navigate(`/politica/documentario/${doc.id}`)} className="flex-shrink-0 w-44 group text-left">
                  <div className="relative w-full h-24 rounded-xl overflow-hidden bg-secondary mb-1.5">
                    {doc.thumbnail ? (
                      <img src={doc.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-800/50 to-red-950">
                        <Film className="w-6 h-6 text-white/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                  </div>
                  <h4 className="text-xs font-medium text-white line-clamp-2 group-hover:text-amber-100 transition-colors">{doc.titulo}</h4>
                  {doc.canal && <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5">{doc.canal}</p>}
                </button>
              ))}
              {filteredDocs.length === 0 && documentarios.length > 0 && (
                <div className="flex gap-3 pb-2">
                  {documentarios.slice(0, 6).map(doc => (
                    <button key={doc.id} onClick={() => navigate(`/politica/documentario/${doc.id}`)} className="flex-shrink-0 w-44 group text-left">
                      <div className="relative w-full h-24 rounded-xl overflow-hidden bg-secondary mb-1.5">
                        {doc.thumbnail ? (
                          <img src={doc.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-800/50 to-red-950">
                            <Film className="w-6 h-6 text-white/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        </div>
                      </div>
                      <h4 className="text-xs font-medium text-white line-clamp-2 group-hover:text-amber-100 transition-colors">{doc.titulo}</h4>
                      {doc.canal && <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5">{doc.canal}</p>}
                    </button>
                  ))}
                </div>
              )}
              {filteredDocs.length === 0 && documentarios.length === 0 && (
                <p className="text-white/40 text-xs py-4">Nenhum documentário disponível</p>
              )}
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
