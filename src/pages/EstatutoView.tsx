import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowUp, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCacheFirstArticles } from "@/hooks/useCacheFirstArticles";
import { Skeleton } from "@/components/ui/skeleton";
import StickyAudioPlayer from "@/components/StickyAudioPlayer";
import ExplicacaoModal from "@/components/ExplicacaoModal";
import VideoAulaModal from "@/components/VideoAulaModal";
import TermosModal from "@/components/TermosModal";
import QuestoesModal from "@/components/QuestoesModal";
import PerguntaModal from "@/components/PerguntaModal";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { VadeMecumTabsInline } from "@/components/VadeMecumTabsInline";
import { VadeMecumPlaylist } from "@/components/VadeMecumPlaylist";
import { VadeMecumRanking } from "@/components/VadeMecumRanking";
import { BuscaCompacta } from "@/components/BuscaCompacta";
import { ArtigoListaCompacta } from "@/components/ArtigoListaCompacta";
import { ArtigoFullscreenDrawer } from "@/components/ArtigoFullscreenDrawer";
import { useDeviceType } from "@/hooks/use-device-type";
import { VadeMecumDesktopLayout } from "@/components/vade-mecum/VadeMecumDesktopLayout";
import { LeiHeader } from "@/components/LeiHeader";
import { AulaArtigoSlidesViewer } from "@/components/AulaArtigoSlidesViewer";

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}

const EstatutoView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Detectar tipo de dispositivo
  const { isDesktop } = useDeviceType();
  
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Show scroll to top button after scrolling
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const artigoParam = searchParams.get('artigo');
    if (artigoParam) {
      setSearchQuery(artigoParam);
    }
  }, [searchParams]);

  const [displayLimit, setDisplayLimit] = useState(100);
  const [stickyPlayerOpen, setStickyPlayerOpen] = useState(false);
  const [currentAudio, setCurrentAudio] = useState({
    url: "",
    title: "",
    isComment: false
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    artigo: "",
    numeroArtigo: "",
    tipo: "explicacao" as "explicacao" | "exemplo",
    nivel: "tecnico" as "tecnico" | "simples"
  });
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalData, setVideoModalData] = useState({
    videoUrl: "",
    artigo: "",
    numeroArtigo: ""
  });
  const [flashcardsModalOpen, setFlashcardsModalOpen] = useState(false);
  const [flashcardsData, setFlashcardsData] = useState<any[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [termosModalOpen, setTermosModalOpen] = useState(false);
  const [termosData, setTermosData] = useState({ artigo: "", numeroArtigo: "" });
  const [questoesModalOpen, setQuestoesModalOpen] = useState(false);
  const [questoesData, setQuestoesData] = useState({ artigo: "", numeroArtigo: "" });
  const [perguntaModalOpen, setPerguntaModalOpen] = useState(false);
  const [perguntaData, setPerguntaData] = useState({ artigo: "", numeroArtigo: "" });
  
  // Aula Artigo state
  const [aulaArtigoModalOpen, setAulaArtigoModalOpen] = useState(false);
  const [aulaArtigoData, setAulaArtigoData] = useState({ artigo: "", numeroArtigo: "" });
  
  // Tabs state
  const [activeTab, setActiveTab] = useState<'artigos' | 'playlist' | 'ranking'>('artigos');

  // Drawer state for fullscreen article view
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const estatutoNames: { [key: string]: string } = {
    cidade: "Estatuto da Cidade",
    desarmamento: "Estatuto do Desarmamento",
    eca: "Estatuto da Criança e do Adolescente",
    idoso: "Estatuto do Idoso",
    "igualdade-racial": "Estatuto da Igualdade Racial",
    oab: "Estatuto da OAB",
    "pessoa-deficiencia": "Estatuto da Pessoa com Deficiência",
    torcedor: "Estatuto do Torcedor",
    militares: "Estatuto dos Militares",
    terra: "Estatuto da Terra",
    migracao: "Estatuto da Migração",
    juventude: "Estatuto da Juventude",
    indio: "Estatuto do Índio",
    refugiado: "Estatuto do Refugiado",
    metropole: "Estatuto da Metrópole",
    desporto: "Estatuto do Desporto",
    mpe: "Estatuto da Micro e Pequena Empresa",
    "seguranca-privada": "Estatuto da Segurança Privada",
    magisterio: "Estatuto do Magistério Superior",
    cancer: "Estatuto da Pessoa com Câncer"
  };

  const estatutoName = estatutoNames[id as string] || "Estatuto";
  const abbreviation = id?.toUpperCase() || "";
  
  // Mapeamento de códigos para edge function
  const codigoMap: { [key: string]: string } = {
    'cidade': 'cidade',
    'desarmamento': 'desarmamento',
    'eca': 'eca',
    'idoso': 'idoso',
    'igualdade-racial': 'racial',
    'oab': 'oab',
    'pessoa-deficiencia': 'pcd',
    'torcedor': 'torcedor',
    'militares': 'emilitares',
    'terra': 'eterra',
    'migracao': 'emigracao',
    'juventude': 'ejuventude',
    'indio': 'eindio',
    'refugiado': 'erefugiado',
    'metropole': 'emetropole',
    'desporto': 'edesporto',
    'mpe': 'empe',
    'seguranca-privada': 'eseguranca',
    'magisterio': 'emagisterio',
    'cancer': 'ecancer'
  };
  
  const codigoEstatuto = codigoMap[id as string] || id || '';
  
  const tableMap: { [key: string]: string } = {
    'cidade': 'ESTATUTO - CIDADE',
    'desarmamento': 'ESTATUTO - DESARMAMENTO',
    'eca': 'ESTATUTO - ECA',
    'idoso': 'ESTATUTO - IDOSO',
    'igualdade-racial': 'ESTATUTO - IGUALDADE RACIAL',
    'oab': 'ESTATUTO - OAB',
    'pessoa-deficiencia': 'ESTATUTO - PESSOA COM DEFICIÊNCIA',
    'torcedor': 'ESTATUTO - TORCEDOR',
    'militares': 'EST - Estatuto dos Militares',
    'terra': 'EST - Estatuto da Terra',
    'migracao': 'EST - Estatuto da Migração',
    'juventude': 'EST - Estatuto da Juventude',
    'indio': 'EST - Estatuto do Índio',
    'refugiado': 'EST - Estatuto do Refugiado',
    'metropole': 'EST - Estatuto da Metrópole',
    'desporto': 'EST - Estatuto do Desporto',
    'mpe': 'EST - Estatuto da MPE',
    'seguranca-privada': 'EST - Estatuto Segurança Privada',
    'magisterio': 'EST - Estatuto Magistério Superior',
    'cancer': 'EST - Estatuto Pessoa com Câncer'
  };
  
  const tableName = tableMap[id as string] || "";
  
  // Mapeamento para número da lei (subtítulo)
  const lawNumbers: { [key: string]: string } = {
    cidade: "Lei nº 10.257/2001",
    desarmamento: "Lei nº 10.826/2003",
    eca: "Lei nº 8.069/1990",
    idoso: "Lei nº 10.741/2003",
    "igualdade-racial": "Lei nº 12.288/2010",
    oab: "Lei nº 8.906/1994",
    "pessoa-deficiencia": "Lei nº 13.146/2015",
    torcedor: "Lei nº 10.671/2003",
    militares: "Lei nº 6.880/1980",
    terra: "Lei nº 4.504/1964",
    migracao: "Lei nº 13.445/2017",
    juventude: "Lei nº 12.852/2013",
    indio: "Lei nº 6.001/1973",
    refugiado: "Lei nº 9.474/1997",
    metropole: "Lei nº 13.089/2015",
    desporto: "Lei nº 9.615/1998",
    mpe: "LC nº 123/2006",
    "seguranca-privada": "Lei nº 14.967/2024",
    magisterio: "Lei nº 12.772/2012",
    cancer: "Lei nº 14.238/2021"
  };
  
  const lawNumber = lawNumbers[id as string] || "";

  // Callback when user scrolls past article 7
  const handleScrollPastArticle7 = useCallback((isPast: boolean) => {
    setShowScrollTop(isPast);
  }, []);

  // Scroll to top function
  const scrollToTopSmooth = useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Use cache-first loading for instant display
  const { articles, isLoading } = useCacheFirstArticles<Article>({
    tableName,
    orderBy: "id",
    enabled: !!tableName
  });

  // Estado para artigos com narração
  const artigosComNarracao = useMemo(() => {
    const withNarration = new Set<number>();
    articles.forEach(art => {
      if (art["Narração"] && art["Narração"].trim() !== "") {
        withNarration.add(art.id);
      }
    });
    return withNarration;
  }, [articles]);

  // Navegação entre artigos no drawer
  const currentArticleIndex = useMemo(() => {
    if (!selectedArticle) return -1;
    return articles.findIndex(a => a.id === selectedArticle.id);
  }, [selectedArticle, articles]);

  // Navegação circular - vai para o último se estiver no primeiro, e vice-versa
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
    const normalizeDigits = (s: string) => s.replace(/\D/g, "");
    
    const filtered = articles.filter(article => {
      const numeroArtigoRaw = article["Número do Artigo"] || "";
      const numeroArtigo = numeroArtigoRaw.toLowerCase().trim();
      const conteudoArtigo = article["Artigo"]?.toLowerCase() || "";
      
      if (isNumericSearch) {
        const numeroDigits = normalizeDigits(numeroArtigo);
        if (numeroDigits.startsWith(searchLower)) return true;
      } else {
        if (numeroArtigo.includes(searchLower)) return true;
      }
      
      return conteudoArtigo.includes(searchLower);
    });
    
    return filtered.sort((a, b) => {
      const aNum = (a["Número do Artigo"] || "").toLowerCase().trim();
      const bNum = (b["Número do Artigo"] || "").toLowerCase().trim();
      const normalizeA = normalizeDigits(aNum);
      const normalizeB = normalizeDigits(bNum);
      
      const aExato = isNumericSearch ? normalizeA === searchLower : aNum === searchLower;
      const bExato = isNumericSearch ? normalizeB === searchLower : bNum === searchLower;
      
      if (aExato && !bExato) return -1;
      if (!aExato && bExato) return 1;
      
      if (isNumericSearch) {
        const aNumInt = parseInt(normalizeA) || 0;
        const bNumInt = parseInt(normalizeB) || 0;
        return aNumInt - bNumInt;
      }
      
      return 0;
    });
  }, [articles, searchQuery]);

  const displayedArticles = useMemo(() => {
    return searchQuery ? filteredArticles : filteredArticles.slice(0, displayLimit);
  }, [filteredArticles, displayLimit, searchQuery]);

  // Filter articles with audio for playlist
  const articlesWithAudio = useMemo(() => {
    return articles.filter(article => 
      article["Narração"] && 
      article["Narração"].trim() !== "" &&
      article["Número do Artigo"] &&
      article["Número do Artigo"].trim() !== ""
    ) as any[];
  }, [articles]);

  // Contar artigos únicos por número
  const uniqueArticleCount = useMemo(() => {
    const uniqueNumbers = new Set<string>();
    articles.forEach(article => {
      const numero = article["Número do Artigo"];
      if (numero && numero.trim() !== "") {
        uniqueNumbers.add(numero.trim());
      }
    });
    return uniqueNumbers.size;
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
    setCurrentAudio({
      url: audioUrl,
      title,
      isComment: true
    });
    setStickyPlayerOpen(true);
  };

  const handleOpenAula = (article: Article) => {
    if (article.Aula && article["Artigo"] && article["Número do Artigo"]) {
      setVideoModalData({
        videoUrl: article.Aula,
        artigo: article["Artigo"],
        numeroArtigo: article["Número do Artigo"]
      });
      setVideoModalOpen(true);
    }
  };

  const handleOpenExplicacao = (artigo: string, numeroArtigo: string, tipo: "explicacao" | "exemplo", nivel?: "tecnico" | "simples") => {
    setModalData({
      artigo,
      numeroArtigo,
      tipo,
      nivel: nivel || "tecnico"
    });
    setModalOpen(true);
  };
  
  const handleGenerateFlashcards = async (artigo: string, numeroArtigo: string) => {
    setLoadingFlashcards(true);
    try {
      const response = await supabase.functions.invoke('gerar-flashcards', {
        body: { content: `Art. ${numeroArtigo}\n${artigo}` }
      });
      
      if (response.error) throw response.error;
      
      setFlashcardsData(response.data.flashcards || []);
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

      <ExplicacaoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        artigo={modalData.artigo}
        numeroArtigo={modalData.numeroArtigo}
        tipo={modalData.tipo}
        nivel={modalData.nivel}
        codigo={codigoEstatuto}
        codigoTabela={tableName}
      />

      <VideoAulaModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={videoModalData.videoUrl}
        artigo={videoModalData.artigo}
        numeroArtigo={videoModalData.numeroArtigo}
      />

      <TermosModal
        isOpen={termosModalOpen}
        onClose={() => setTermosModalOpen(false)}
        artigo={termosData.artigo}
        numeroArtigo={termosData.numeroArtigo}
        codigoTabela={tableName}
      />

      <QuestoesModal
        isOpen={questoesModalOpen}
        onClose={() => setQuestoesModalOpen(false)}
        artigo={questoesData.artigo}
        numeroArtigo={questoesData.numeroArtigo}
      />

      <PerguntaModal 
        isOpen={perguntaModalOpen} 
        onClose={() => setPerguntaModalOpen(false)} 
        artigo={perguntaData.artigo} 
        numeroArtigo={perguntaData.numeroArtigo} 
      />

      <AulaArtigoSlidesViewer
        isOpen={aulaArtigoModalOpen}
        onClose={() => setAulaArtigoModalOpen(false)}
        codigoTabela={tableName}
        codigoNome={estatutoName}
        numeroArtigo={aulaArtigoData.numeroArtigo}
        conteudoArtigo={aulaArtigoData.artigo}
      />

      {flashcardsModalOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-accent">Flashcards</h2>
              <button
                onClick={() => setFlashcardsModalOpen(false)}
                className="p-2 hover:bg-secondary rounded-lg"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FlashcardViewer flashcards={flashcardsData} />
            </div>
          </div>
        </div>
      )}
    </>
  );

  // LAYOUT DESKTOP - 3 colunas
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {renderModals()}
        
        <VadeMecumDesktopLayout
          tableName={tableName}
          codeName={estatutoName}
          lawNumber={lawNumber}
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
          onOpenAulaArtigo={(artigo, numeroArtigo) => {
            setAulaArtigoData({ artigo, numeroArtigo });
            setAulaArtigoModalOpen(true);
          }}
          onGenerateFlashcards={handleGenerateFlashcards}
          loadingFlashcards={loadingFlashcards}
          targetArticle={null}
          header={
            <LeiHeader 
              titulo={estatutoName.toUpperCase()} 
              subtitulo={lawNumber}
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
          titulo={estatutoName.toUpperCase()}
          subtitulo={lawNumber}
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
        codeName={estatutoName}
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
              codigoNome={estatutoName}
            />
          </div>
        )}

        {/* Ranking Tab */}
        {activeTab === 'ranking' && (
          <div className="px-4 max-w-4xl mx-auto pb-20">
            <VadeMecumRanking 
              tableName={tableName}
              codigoNome={estatutoName}
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
                {searchQuery ? "Nenhum artigo encontrado para sua busca." : "Nenhum artigo disponível."}
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

export default EstatutoView;
