import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCacheFirstArticles } from "@/hooks/useCacheFirstArticles";
import { useAutoNarracaoGeneration } from "@/hooks/useAutoNarracaoGeneration";
import { NarracaoGenerationCard } from "@/components/NarracaoGenerationCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import StickyAudioPlayer from "@/components/StickyAudioPlayer";
import ExplicacaoModal from "@/components/ExplicacaoModal";
import VideoAulaModal from "@/components/VideoAulaModal";
import TermosModal from "@/components/TermosModal";
import QuestoesModal from "@/components/QuestoesModal";
import PerguntaModal from "@/components/PerguntaModal";
import FlashcardsArtigoModal from "@/components/FlashcardsArtigoModal";
import { VadeMecumTabs } from "@/components/VadeMecumTabs";
import { VadeMecumPlaylist } from "@/components/VadeMecumPlaylist";
import { VadeMecumRanking } from "@/components/VadeMecumRanking";
import { BuscaCompacta } from "@/components/BuscaCompacta";
import { ArtigoListaCompacta } from "@/components/ArtigoListaCompacta";
import { ArtigoFullscreenDrawer } from "@/components/ArtigoFullscreenDrawer";

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}

const CrimesDemocraticosView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);
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

  const tableName = "Lei 14.197 de 2021 - Crimes Contra o Estado Democrático";
  const codeName = "Lei de Crimes Democráticos";

  useEffect(() => {
    const artigoParam = searchParams.get('artigo');
    if (artigoParam) {
      setSearchQuery(artigoParam);
    }
  }, [searchParams]);

  // Callback when user scrolls past article 7
  const handleScrollPastArticle7 = useCallback((isPast: boolean) => {
    setShowScrollTop(isPast);
  }, []);

  // Scroll to top function
  const scrollToTopSmooth = useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const { articles, isLoading, updateArticle } = useCacheFirstArticles<Article>({
    tableName,
    orderBy: "id"
  });

  const {
    isGeneratingNarracoes,
    currentGeneratingArtigo,
    generatedNarracoesCount,
    totalNarracoesToGenerate,
    artigosComNarracao
  } = useAutoNarracaoGeneration({
    articles,
    isLoading,
    tableName,
    updateArticle,
    enabled: false // Desativado - geração automática pausada
  });

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
    return articles.filter(article => {
      const numeroArtigo = (article["Número do Artigo"] || "").toLowerCase().trim();
      const conteudoArtigo = (article["Artigo"] || "").toLowerCase();
      return numeroArtigo.includes(searchLower) || conteudoArtigo.includes(searchLower);
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
    if (article["Aula"]) {
      setVideoModalData({
        videoUrl: article["Aula"],
        artigo: article["Artigo"] || "",
        numeroArtigo: article["Número do Artigo"] || ""
      });
      setVideoModalOpen(true);
    }
  };

  const handleOpenExplicacao = (artigo: string, numeroArtigo: string, tipo: "explicacao" | "exemplo", nivel?: "tecnico" | "simples") => {
    setModalData({ artigo, numeroArtigo, tipo, nivel: nivel || "tecnico" });
    setModalOpen(true);
  };

  const handleGenerateFlashcards = async (artigo: string, numeroArtigo: string) => {
    setLoadingFlashcards(true);
    try {
      const response = await supabase.functions.invoke('gerar-flashcards', {
        body: { content: `Art. ${numeroArtigo}\n${artigo}` }
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

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <VadeMecumTabs 
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
      />

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

      {/* Artigo Fullscreen Drawer */}
      <ArtigoFullscreenDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedArticle(null);
        }}
        article={selectedArticle}
        codeName={codeName}
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

      <div ref={contentRef} className="max-w-4xl mx-auto overflow-y-auto" style={{ height: 'calc(100vh - 126px)' }}>
        {activeTab === 'artigos' && (
          <div className="p-4">
            {/* Indicador de geração de narrações */}
            <NarracaoGenerationCard
              isGenerating={isGeneratingNarracoes}
              currentArtigo={currentGeneratingArtigo}
              generatedCount={generatedNarracoesCount}
              totalCount={totalNarracoesToGenerate}
            />

            {isLoading && (
              <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
            )}

            {!isLoading && displayedArticles.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  {searchQuery ? `Nenhum artigo encontrado.` : `Nenhum artigo disponível.`}
                </p>
              </div>
            )}

            {!isLoading && displayedArticles.length > 0 && (
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

        {activeTab === 'playlist' && (
          <div className="p-4">
            <VadeMecumPlaylist 
              articles={articlesWithAudio} 
              codigoNome={codeName}
            />
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="p-4">
            <VadeMecumRanking 
              tableName={tableName}
              codigoNome={codeName}
              onArticleClick={handleArticleClick}
            />
          </div>
        )}
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTopSmooth}
          size="icon"
          className="fixed bottom-28 right-4 rounded-full bg-amber-500 hover:bg-amber-500/90 text-white z-30 shadow-lg animate-fade-in"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default CrimesDemocraticosView;