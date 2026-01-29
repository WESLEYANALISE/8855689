import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import StickyAudioPlayer from "@/components/StickyAudioPlayer";
import ExplicacaoModal from "@/components/ExplicacaoModal";
import VideoAulaModal from "@/components/VideoAulaModal";
import TermosModal from "@/components/TermosModal";
import QuestoesModal from "@/components/QuestoesModal";
import PerguntaModal from "@/components/PerguntaModal";
import FlashcardsArtigoModal from "@/components/FlashcardsArtigoModal";
import { VadeMecumTabsInline } from "@/components/VadeMecumTabsInline";
import { VadeMecumPlaylist } from "@/components/VadeMecumPlaylist";
import { VadeMecumRanking } from "@/components/VadeMecumRanking";
import { BuscaCompacta } from "@/components/BuscaCompacta";
import { ArtigoListaCompacta } from "@/components/ArtigoListaCompacta";
import { ArtigoFullscreenDrawer } from "@/components/ArtigoFullscreenDrawer";
import { useCacheFirstArticles } from "@/hooks/useCacheFirstArticles";
import { LeiHeader } from "@/components/LeiHeader";
import { useDeviceType } from "@/hooks/use-device-type";
import { VadeMecumDesktopLayout } from "@/components/vade-mecum/VadeMecumDesktopLayout";

interface Sumula {
  id: number;
  "Título da Súmula": string | null;
  "Texto da Súmula": string | null;
  "Narração": string | null;
  "Data de Aprovação": string | null;
}

// Adapter to convert Sumula to Article format
interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}

const SumulaView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);
  const { isDesktop } = useDeviceType();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(100);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeTab, setActiveTab] = useState<'artigos' | 'playlist' | 'ranking'>('artigos');

  // Drawer state for fullscreen article view
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const [stickyPlayerOpen, setStickyPlayerOpen] = useState(false);
  const [currentAudio, setCurrentAudio] = useState({ url: "", title: "", isComment: false });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ artigo: "", numeroArtigo: "", tipo: "explicacao" as "explicacao" | "exemplo", nivel: "tecnico" as "tecnico" | "simples" });
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalData, setVideoModalData] = useState({ videoUrl: "", artigo: "", numeroArtigo: "" });
  const [flashcardsModalOpen, setFlashcardsModalOpen] = useState(false);
  const [flashcardsModalData, setFlashcardsModalData] = useState({ artigo: "", numeroArtigo: "" });
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [termosModalOpen, setTermosModalOpen] = useState(false);
  const [termosData, setTermosData] = useState({ artigo: "", numeroArtigo: "" });
  const [questoesModalOpen, setQuestoesModalOpen] = useState(false);
  const [questoesData, setQuestoesData] = useState({ artigo: "", numeroArtigo: "" });
  const [perguntaModalOpen, setPerguntaModalOpen] = useState(false);
  const [perguntaData, setPerguntaData] = useState({ artigo: "", numeroArtigo: "" });

  // Get table name
  const tableMap: { [key: string]: string } = {
    'vinculantes': 'SUMULAS VINCULANTES',
    'stf': 'SUMULAS STF',
    'stj': 'SUMULAS STJ',
    'tst': 'SUMULAS TST',
    'tse': 'SUMULAS TSE',
    'stm': 'SUMULAS STM',
    'tcu': 'SUMULAS TCU',
    'cnmp': 'ENUNCIADOS CNMP',
    'cnj': 'ENUNCIADOS CNJ'
  };
  const tableName = tableMap[id as string] || '';

  const categoryNames: { [key: string]: string } = {
    vinculantes: "Súmulas Vinculantes STF",
    stf: "Súmulas STF",
    stj: "Súmulas STJ",
    tst: "Súmulas TST",
    tse: "Súmulas TSE",
    stm: "Súmulas STM",
    tcu: "Súmulas TCU",
    cnmp: "Enunciados CNMP",
    cnj: "Enunciados CNJ"
  };
  const categoryName = categoryNames[id as string] || "Súmulas";
  const isCNMPorCNJ = id === 'cnmp' || id === 'cnj';
  const itemLabel = isCNMPorCNJ ? "Enunciado" : "Súmula";

  // Estado para controlar artigos com narração (sem geração automática)
  const [artigosComNarracao, setArtigosComNarracao] = useState<Set<number>>(new Set());

  // Cache-first loading
  const { articles: sumulas, isLoading } = useCacheFirstArticles<Sumula>({
    tableName,
    orderBy: 'id',
    enabled: !!tableName
  });

  // Auto-search based on URL parameter
  useEffect(() => {
    const sumulaParam = searchParams.get('numero');
    if (sumulaParam) {
      setSearchQuery(sumulaParam);
    }
  }, [searchParams]);

  // Convert Sumulas to Article format for compatibility with ArtigoListaCompacta
  const articles = useMemo(() => {
    return sumulas.map(sumula => ({
      id: sumula.id,
      "Número do Artigo": sumula.id?.toString() || "",
      "Artigo": sumula["Texto da Súmula"] || "",
      "Narração": sumula["Narração"] || null,
      "Comentario": null,
      "Aula": null
    })) as Article[];
  }, [sumulas]);

  // Callback when user scrolls past article 7
  const handleScrollPastArticle7 = useCallback((isPast: boolean) => {
    setShowScrollTop(isPast);
  }, []);

  // Scroll to top function
  const scrollToTopSmooth = useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Inicializar set de artigos com narração
  useEffect(() => {
    if (articles.length > 0) {
      const withNarration = new Set<number>();
      articles.forEach(art => {
        if (art["Narração"] && art["Narração"].trim() !== "") {
          withNarration.add(art.id);
        }
      });
      setArtigosComNarracao(withNarration);
    }
  }, [articles]);


  // Navegação entre artigos no drawer
  const currentArticleIndex = useMemo(() => {
    if (!selectedArticle) return -1;
    return articles.findIndex(a => a.id === selectedArticle.id);
  }, [selectedArticle, articles]);

  const handlePreviousArticle = useCallback(() => {
    if (articles.length === 0) return;
    if (currentArticleIndex <= 0) {
      setSelectedArticle(articles[articles.length - 1]);
    } else {
      setSelectedArticle(articles[currentArticleIndex - 1]);
    }
  }, [currentArticleIndex, articles]);

  const handleNextArticle = useCallback(() => {
    if (articles.length === 0) return;
    if (currentArticleIndex >= articles.length - 1) {
      setSelectedArticle(articles[0]);
    } else {
      setSelectedArticle(articles[currentArticleIndex + 1]);
    }
  }, [currentArticleIndex, articles]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery) return articles;
    const searchLower = searchQuery.toLowerCase().trim();
    const isNumericSearch = /^\d+$/.test(searchLower);
    return articles.filter(article => {
      const numero = article["Número do Artigo"]?.toString() || "";
      const texto = article["Artigo"]?.toLowerCase() || "";

      if (isNumericSearch) {
        return numero === searchLower;
      }

      return numero.includes(searchLower) || texto.includes(searchLower);
    });
  }, [articles, searchQuery]);

  const displayedArticles = useMemo(() => {
    return searchQuery ? filteredArticles : filteredArticles.slice(0, displayLimit);
  }, [filteredArticles, displayLimit, searchQuery]);

  const articlesWithAudio = useMemo(() => {
    return articles.filter(article => 
      article["Narração"] && article["Narração"].trim() !== "" &&
      article["Número do Artigo"] && article["Número do Artigo"].trim() !== ""
    ) as any[];
  }, [articles]);

  // Infinite scroll handler
  useEffect(() => {
    const element = contentRef.current;
    if (!searchQuery && element) {
      const handleScroll = () => {
        if (!element) return;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        if (scrollTop + clientHeight >= scrollHeight - 400 && displayLimit < filteredArticles.length) {
          setDisplayLimit(prev => Math.min(prev + 100, filteredArticles.length));
        }
      };
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [displayLimit, filteredArticles.length, searchQuery]);

  const handlePlayComment = (audioUrl: string, title: string) => {
    setCurrentAudio({ url: audioUrl, title, isComment: true });
    setStickyPlayerOpen(true);
  };

  const handleOpenAula = (article: Article) => {
    // Súmulas não têm aulas
  };

  const handleOpenExplicacao = (artigo: string, numeroArtigo: string, tipo: "explicacao" | "exemplo", nivel?: "tecnico" | "simples") => {
    setModalData({ artigo, numeroArtigo, tipo, nivel: nivel || "tecnico" });
    setModalOpen(true);
  };

  const handleGenerateFlashcards = async (artigo: string, numeroArtigo: string) => {
    setLoadingFlashcards(true);
    try {
      const response = await supabase.functions.invoke('gerar-flashcards', {
        body: { content: `${itemLabel} ${numeroArtigo}\n${artigo}` }
      });
      if (response.error) throw response.error;
      setFlashcardsModalData({ artigo, numeroArtigo });
      setFlashcardsModalOpen(true);
    } catch (error) {
      console.error('Erro ao gerar flashcards:', error);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const handleArticleClick = (numeroArtigo: string) => {
    setActiveTab('artigos');
    setSearchQuery(numeroArtigo);
  };

  // Renderizar modais compartilhados
  const renderModals = () => (
    <>
      <StickyAudioPlayer 
        isOpen={stickyPlayerOpen} 
        onClose={() => setStickyPlayerOpen(false)} 
        audioUrl={currentAudio.url} 
        title={currentAudio.title}
      />

      <ExplicacaoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} artigo={modalData.artigo} numeroArtigo={modalData.numeroArtigo} tipo={modalData.tipo} nivel={modalData.nivel} />
      <VideoAulaModal isOpen={videoModalOpen} onClose={() => setVideoModalOpen(false)} videoUrl={videoModalData.videoUrl} artigo={videoModalData.artigo} numeroArtigo={videoModalData.numeroArtigo} />
      <TermosModal isOpen={termosModalOpen} onClose={() => setTermosModalOpen(false)} artigo={termosData.artigo} numeroArtigo={termosData.numeroArtigo} />
      <QuestoesModal isOpen={questoesModalOpen} onClose={() => setQuestoesModalOpen(false)} artigo={questoesData.artigo} numeroArtigo={questoesData.numeroArtigo} />
      <PerguntaModal isOpen={perguntaModalOpen} onClose={() => setPerguntaModalOpen(false)} artigo={perguntaData.artigo} numeroArtigo={perguntaData.numeroArtigo} />
      <FlashcardsArtigoModal isOpen={flashcardsModalOpen} onClose={() => setFlashcardsModalOpen(false)} artigo={flashcardsModalData.artigo} numeroArtigo={flashcardsModalData.numeroArtigo} />
    </>
  );

  // LAYOUT DESKTOP - 3 colunas
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {renderModals()}
        
        <VadeMecumDesktopLayout
          tableName={tableName}
          codeName={categoryName}
          articles={articles}
          isLoading={isLoading}
          selectedArticle={selectedArticle}
          onSelectArticle={(article) => setSelectedArticle(article as Article)}
          onCloseDetail={() => setSelectedArticle(null)}
          onPlayAudio={handlePlayComment}
          onOpenExplicacao={handleOpenExplicacao}
          onOpenAula={handleOpenAula}
          onOpenTermos={(artigo, numeroArtigo) => {
            setTermosData({ artigo, numeroArtigo });
            setTermosModalOpen(true);
          }}
          onOpenQuestoes={(artigo, numeroArtigo) => {
            setQuestoesData({ artigo, numeroArtigo });
            setQuestoesModalOpen(true);
          }}
          onPerguntar={(artigo, numeroArtigo) => {
            setPerguntaData({ artigo, numeroArtigo });
            setPerguntaModalOpen(true);
          }}
          onGenerateFlashcards={handleGenerateFlashcards}
          loadingFlashcards={loadingFlashcards}
          targetArticle={null}
          header={
            <LeiHeader 
              titulo={categoryName.toUpperCase()} 
            />
          }
        />
      </div>
    );
  }

  // LAYOUT MOBILE/TABLET - Igual ao CodigoView
  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {renderModals()}

      {/* Header com Brasão - sempre visível quando na aba artigos */}
      {activeTab === 'artigos' && (
        <LeiHeader 
          titulo={categoryName.toUpperCase()}
        />
      )}

      {/* Search Bar - only show on artigos tab */}
      {activeTab === 'artigos' && (
        <BuscaCompacta
          value={searchInput}
          onChange={setSearchInput}
          onSearch={() => setSearchQuery(searchInput)}
          onClear={() => {
            setSearchInput("");
            setSearchQuery("");
          }}
          resultCount={filteredArticles.length}
        />
      )}

      {/* Tabs Inline - Playlist e Em Alta - apenas quando NÃO está nos artigos */}
      {activeTab !== 'artigos' && (
        <VadeMecumTabsInline 
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as any)}
        />
      )}

      {/* Artigo Fullscreen Drawer */}
      <ArtigoFullscreenDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedArticle(null);
        }}
        article={selectedArticle}
        codeName={itemLabel}
        onPlayComment={handlePlayComment}
        onOpenAula={handleOpenAula}
        onOpenExplicacao={handleOpenExplicacao}
        onGenerateFlashcards={handleGenerateFlashcards}
        onOpenTermos={(artigo, numeroArtigo) => {
          setTermosData({ artigo, numeroArtigo });
          setTermosModalOpen(true);
        }}
        onOpenQuestoes={(artigo, numeroArtigo) => {
          setQuestoesData({ artigo, numeroArtigo });
          setQuestoesModalOpen(true);
        }}
        onPerguntar={(artigo, numeroArtigo) => {
          setPerguntaData({ artigo, numeroArtigo });
          setPerguntaModalOpen(true);
        }}
        loadingFlashcards={loadingFlashcards}
        currentAudio={currentAudio}
        stickyPlayerOpen={stickyPlayerOpen}
        onPreviousArticle={handlePreviousArticle}
        onNextArticle={handleNextArticle}
        totalArticles={articles.length}
      />

      {/* Content */}
      <div ref={contentRef} className="animate-fade-in">
        
        {/* Playlist Tab */}
        {activeTab === 'playlist' && (
          <div className="px-4 max-w-4xl mx-auto pb-20">
            <VadeMecumPlaylist 
              articles={articlesWithAudio} 
              codigoNome={categoryName}
            />
          </div>
        )}

        {/* Ranking Tab */}
        {activeTab === 'ranking' && (
          <div className="px-4 max-w-4xl mx-auto pb-20">
            <VadeMecumRanking 
              tableName={tableName}
              codigoNome={categoryName}
              onArticleClick={handleArticleClick}
            />
          </div>
        )}

        {/* Articles Tab */}
        {activeTab === 'artigos' && (
          <div>
            {articles.length === 0 && isLoading ? (
              <div className="space-y-6 px-4 max-w-4xl mx-auto pb-20">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card rounded-2xl p-6 border border-border">
                    <Skeleton className="h-8 w-32 mb-3" />
                    <Skeleton className="h-6 w-48 mb-4" />
                    <Skeleton className="h-24 w-full mb-6" />
                  </div>
                ))}
              </div>
            ) : displayedArticles.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                {searchQuery ? `Nenhum ${itemLabel.toLowerCase()} encontrado.` : `Nenhum ${itemLabel.toLowerCase()} disponível.`}
              </div>
            ) : (
              <ArtigoListaCompacta
                articles={displayedArticles}
                onArtigoClick={(article) => {
                  setSelectedArticle(article);
                  setDrawerOpen(true);
                }}
                searchQuery={searchQuery}
                onScrollPastArticle7={handleScrollPastArticle7}
                artigosComNarracao={artigosComNarracao}
              />
            )}
          </div>
        )}
      </div>

      {/* Scroll to top button */}
      {activeTab === 'artigos' && articles.length > 0 && showScrollTop && (
        <button 
          onClick={scrollToTopSmooth} 
          className="fixed bottom-20 right-4 bg-amber-500 hover:bg-amber-600 text-black w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-30"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SumulaView;
