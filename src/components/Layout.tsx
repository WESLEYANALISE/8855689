import { ReactNode, useState, useEffect, useMemo, memo, lazy, Suspense, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { DesktopTopNav } from "./DesktopTopNav";
import { AppSidebar } from "./AppSidebar";
import { DesktopChatPanel } from "./DesktopChatPanel";
import { DesktopNewsSidebar } from "./DesktopNewsSidebar";
import { VideoPlaylistSidebar } from "./VideoPlaylistSidebar";
import { VideoaulasInicianteSidebar } from "./VideoaulasInicianteSidebar";
import { VideoaulasOABSidebar } from "./VideoaulasOABSidebar";
import { ResumosSidebar } from "./ResumosSidebar";
import { PageBreadcrumb } from "./PageBreadcrumb";
import { useDeviceType } from "@/hooks/use-device-type";
import { PageTransition } from "./PageTransition";
import PremiumWelcomeCard from "./PremiumWelcomeCard";
import RateAppFloatingCard from "./RateAppFloatingCard";

// Lazy load AulasPlaylistSidebar since it uses useCursosCache
const AulasPlaylistSidebar = lazy(() => import("./AulasPlaylistSidebar").then(m => ({ default: m.AulasPlaylistSidebar })));

interface LayoutProps {
  children: ReactNode;
}

// Memoizar componentes pesados para evitar re-renders desnecessários
const MemoizedHeader = memo(Header);
const MemoizedBottomNav = memo(BottomNav);
const MemoizedDesktopTopNav = memo(DesktopTopNav);
const MemoizedAppSidebar = memo(AppSidebar);
const MemoizedDesktopChatPanel = memo(DesktopChatPanel);
const MemoizedDesktopNewsSidebar = memo(DesktopNewsSidebar);
const MemoizedPageBreadcrumb = memo(PageBreadcrumb);

// Static route configurations - moved outside component
const HIDE_BOTTOM_NAV_ROUTES = new Set([
  "/em-alta",
  "/vade-mecum",
  "/vade-mecum/sobre",
  "/blogger-juridico",
  "/constituicao",
  "/estatutos",
  "/sumulas",
  "/jurisprudencia-corpus927",
  "/simulados/realizar",
  "/simulados/personalizado",
  "/chat-professora",
  "/aula-interativa",
  "/plano-estudos",
  "/cursos/modulos",
  "/cursos/aulas",
  "/iniciando-direito",
  "/ajuda",
  "/ferramentas/questoes/resolver",
  "/jurisprudencia-webview",
  "/bibliotecas",
  "/biblioteca-estudos",
  "/biblioteca-classicos",
  "/biblioteca-oab",
  "/biblioteca-oratoria",
  "/biblioteca-lideranca",
  "/biblioteca-fora-da-toga",
  "/resumos-juridicos",
  "/resumos-juridicos/prontos",
  "/flashcards",
  "/ferramentas/questoes",
  "/ferramentas/questoes/temas",
  "/ferramentas/tcc",
  "/ranking-faculdades",
]);

const HIDE_BOTTOM_NAV_PREFIXES = [
  "/audioaulas",
  "/codigo/",
  "/blogger-juridico/",
  "/estatuto/",
  "/sumula/",
  "/lei-penal/",
  "/simulacao-juridica/",
  "/meu-brasil/jurista/",
  "/iniciando-direito/",
  "/mapa-mental",
  "/jogos-juridicos",
  "/camara-deputados",
  "/ferramentas/senado",
  "/oab/o-que-estudar",
  "/resumos-juridicos/prontos/",
  "/flashcards/",
  "/resumos-juridicos/artigos-lei",
  "/questoes/artigos-lei/resolver",
  "/admin/",
  "/aprenda-seu-jeito",
  "/ferramentas/tcc/",
];

const HIDE_HEADER_ROUTES = new Set([
  "/professora",
  "/chat-professora",
  "/blogger-juridico",
  "/jurisprudencia-webview",
  "/vade-mecum",
  "/jurisprudencia-corpus-927",
  "/primeiros-passos",
  "/juriflix",
  "/tres-poderes",
  "/tematica-juridica",
  "/videoaulas",
  "/videoaulas-oab",
  "/estudos",
  "/dominando",
]);

const HIDE_HEADER_PREFIXES = [
  "/blogger-juridico/",
  "/resumo-do-dia",
  "/novas-leis",
  "/videoaulas/iniciante",
  "/videoaulas/faculdade",
  "/videoaulas/areas/",
  "/oab/trilhas-aprovacao",
  "/oab/trilhas-etica",
  "/oab/primeira-fase",
  "/oab/segunda-fase",
  "/oab/carreira",
  "/faculdade/disciplina",
  "/faculdade/topico",
  "/conceitos/area",
  "/conceitos/materia",
  "/conceitos/topico",
  "/conceitos/trilhante",
  "/conceitos/livro",
  "/dominando/trilhas",
  "/dominando/area",
  "/dominando/estudo",
  "/resumos-juridicos/personalizado",
];

// Helper function to check if path matches prefixes
const matchesPrefixes = (path: string, prefixes: string[]) => 
  prefixes.some(prefix => path.startsWith(prefix));

// Helper function to check library routes
const isLibraryBookRoute = (path: string) => 
  /\/biblioteca-(estudos|classicos|oab|oratoria|lideranca|fora-da-toga)\/\d+/.test(path);

const isSimuladoResolverRoute = (path: string) =>
  path.includes("/ferramentas/simulados/") && path.includes("/resolver");

const isEscreventeRoute = (path: string) =>
  /\/ferramentas\/simulados\/escrevente\/\d+/.test(path);

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { isMobile, isTablet, isDesktop } = useDeviceType();
  const [professoraModalOpen, setProfessoraModalOpen] = useState(false);

  // Ouvir eventos de abertura/fechamento do modal da professora
  useEffect(() => {
    const handleOpen = () => setProfessoraModalOpen(true);
    const handleClose = () => setProfessoraModalOpen(false);

    window.addEventListener('professora-modal-open', handleOpen);
    window.addEventListener('professora-modal-close', handleClose);

    return () => {
      window.removeEventListener('professora-modal-open', handleOpen);
      window.removeEventListener('professora-modal-close', handleClose);
    };
  }, []);

  // Detectar se está na view de videoaula iniciante
  const videoaulaInicianteMatch = location.pathname.match(/^\/videoaulas\/iniciante\/([^/]+)$/);
  const isVideoaulaInicianteView = !!videoaulaInicianteMatch;
  const videoaulaInicianteId = videoaulaInicianteMatch ? videoaulaInicianteMatch[1] : '';

  // Detectar se está na view de videoaula OAB
  const videoaulaOABMatch = location.pathname.match(/^\/videoaulas\/oab\/([^/]+)\/([^/]+)$/);
  const isVideoaulaOABView = !!videoaulaOABMatch;
  const videoaulaOABArea = videoaulaOABMatch ? decodeURIComponent(videoaulaOABMatch[1]) : '';
  const videoaulaOABId = videoaulaOABMatch ? videoaulaOABMatch[2] : '';

  // Detectar se deve mostrar sidebar de playlists
  const isVideoPlayer = location.pathname === '/videoaulas/player';
  const isResumoView = location.pathname.includes('/resumos-juridicos/prontos/') && 
                       location.pathname.split('/').length > 4;
  
  // Detectar se está na view de aula individual
  const aulaMatch = location.pathname.match(/^\/iniciando-direito\/([^/]+)\/([^/]+)$/);
  const isAulaView = !!aulaMatch;
  const aulaArea = aulaMatch ? decodeURIComponent(aulaMatch[1]) : '';
  const aulaTema = aulaMatch ? decodeURIComponent(aulaMatch[2]) : '';

  // Memoizar cálculo de layout
  const layout = useMemo(() => {
    const path = location.pathname;
    
    // Página inicial - sidebar + notícias (não chat)
    if (path === '/') {
      return { 
        showLeftSidebar: true,
        rightPanelType: 'news' as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Vade Mecum e Códigos - Layout full-width (sem sidebars, sem padding para 3-column layout)
    if (path === '/vade-mecum' || 
        path === '/vade-mecum/sobre' ||
        path.startsWith('/codigo/') || 
        path === '/codigos' || 
        path === '/constituicao' ||
        path === '/estatutos' ||
        path.startsWith('/estatuto/') ||
        path === '/sumulas' ||
        path.startsWith('/sumula/') ||
        path.startsWith('/lei-penal/') ||
        path.startsWith('/lei-')) {
      return {
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'w-full',
        noPadding: true
      };
    }
    
    // Página principal de ferramentas - SEM sidebars
    if (path === '/ferramentas') {
      return { 
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-7xl'
      };
    }
    
    // Subpáginas de ferramentas - Layout focado SEM sidebars
    if (path.startsWith('/ferramentas/')) {
      return {
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Simulados - Layout focado sem chat
    if (path.startsWith('/simulados')) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-4xl'
      };
    }
    
    // Cursos página inicial - com sidebar
    if (path === '/cursos') {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-full px-6'
      };
    }
    
    // Videoaulas lista - Layout centralizado SEM sidebar
    if (path === '/videoaulas/iniciante' || 
        path === '/videoaulas-oab' ||
        path.match(/^\/videoaulas\/oab\/[^/]+$/) ||
        (path.startsWith('/videoaulas') && !path.match(/^\/videoaulas\/iniciante\/[^/]+$/) && !path.match(/^\/videoaulas\/oab\/[^/]+\/[^/]+$/)) ||
        path.startsWith('/cursos/') ||
        path.startsWith('/iniciando-direito')) {
      return {
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-4xl'
      };
    }
    
    // Videoaula iniciante view - COM sidebar de playlist
    if (isVideoaulaInicianteView) {
      return {
        showLeftSidebar: true,
        showVideoaulaInicianteSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-4xl'
      };
    }
    
    // Videoaula OAB view - COM sidebar de playlist
    if (isVideoaulaOABView) {
      return {
        showLeftSidebar: true,
        showVideoaulaOABSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-4xl'
      };
    }
    
    // Audioaulas - Layout focado
    if (path.startsWith('/audioaulas')) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Flashcards - Layout focado
    if (path.startsWith('/flashcards')) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Mapas Mentais - Layout focado
    if (path.startsWith('/mapa-mental')) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Plano de Estudos - Layout focado
    if (path === '/plano-estudos') {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Bibliotecas - Layout focado para leitura
    if (path.startsWith('/biblioteca') || path === '/bibliotecas') {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-6xl'
      };
    }
    
    // OAB - Layout focado
    if (path.startsWith('/oab')) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Resumos Jurídicos - Layout focado
    if (path.startsWith('/resumos-juridicos')) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Novas Leis (lista com sidebar próprio) - sem sidebar do app, sem chat
    if (path === '/novas-leis') {
      return {
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-full px-6'
      };
    }
    
    // Novas Leis (detalhes) - Layout focado sem sidebars
    if (path.match(/^\/novas-leis\/[^/]+$/)) {
      return {
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-4xl'
      };
    }
    
    // Resumo do Dia / Boletim Jurídico - Layout focado centralizado
    if (path.startsWith('/resumo-do-dia')) {
      return {
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-4xl'
      };
    }
    
    // Admin - Layout fullscreen sem sidebars
    if (path.startsWith('/admin')) {
      return {
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-full px-6'
      };
    }
    
    // Notícias - layout mais largo sem painel direito
    if (path === '/noticias-juridicas' || path.startsWith('/noticias-juridicas/')) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-full px-6'
      };
    }

    // Novidades - centralizado
    if (path === '/novidades') {
      return {
        showLeftSidebar: true,
        rightPanelType: 'chat' as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Aula individual - sidebar de aulas, sem chat
    if (isAulaView) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-6xl'
      };
    }
    
    // Default: sidebar + chat
    return { 
      showLeftSidebar: true,
      rightPanelType: 'chat' as const,
      contentMaxWidth: 'max-w-7xl'
    };
  }, [location.pathname, isAulaView, isVideoaulaInicianteView, isVideoaulaOABView]);

  // Memoizar verificação de breadcrumb
  const hideBreadcrumb = useMemo(() => 
    location.pathname === '/' ||
    location.pathname.startsWith('/resumo-do-dia') ||
    location.pathname.startsWith('/videoaulas-player') ||
    location.pathname.startsWith('/novas-leis') ||
    location.pathname.startsWith('/politica/artigo') ||
    location.pathname.startsWith('/politica/estudos') ||
    location.pathname === '/ferramentas/questoes' ||
    location.pathname === '/ferramentas/questoes/temas' ||
    location.pathname.startsWith('/ferramentas/questoes/resolver'),
  [location.pathname]);

  // Estado para ocultar sidebars via eventos (home page tabs expandidas)
  const [forceHideSidebars, setForceHideSidebars] = useState(false);

  // Listener para eventos de controle das sidebars (usado pela página inicial)
  useEffect(() => {
    const handleHide = () => setForceHideSidebars(true);
    const handleShow = () => setForceHideSidebars(false);
    
    window.addEventListener('hide-desktop-sidebars', handleHide);
    window.addEventListener('show-desktop-sidebars', handleShow);
    
    return () => {
      window.removeEventListener('hide-desktop-sidebars', handleHide);
      window.removeEventListener('show-desktop-sidebars', handleShow);
    };
  }, []);
  
  // Esconder BottomNav usando Sets e funções auxiliares
  // Inclui aba "Leis" na home que tem seu próprio menu de rodapé
  const hideBottomNav = useMemo(() => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const isLeisTab = path === '/' && searchParams.get('tab') === 'leis';
    
    return (
      isLeisTab ||
      HIDE_BOTTOM_NAV_ROUTES.has(path) ||
      matchesPrefixes(path, HIDE_BOTTOM_NAV_PREFIXES) ||
      isLibraryBookRoute(path) ||
      isSimuladoResolverRoute(path) ||
      isEscreventeRoute(path)
    );
  }, [location.pathname, location.search]);
  
  // Esconder Header
  const hideHeader = useMemo(() => {
    const path = location.pathname;
    return HIDE_HEADER_ROUTES.has(path) || matchesPrefixes(path, HIDE_HEADER_PREFIXES);
  }, [location.pathname]);

  // Esconder DesktopTopNav
  const hideDesktopTopNav = location.pathname.startsWith('/novas-leis');

  // DESKTOP LAYOUT (>= 1024px)
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {!hideDesktopTopNav && <MemoizedDesktopTopNav />}
        
        {/* Breadcrumb global para páginas que não têm breadcrumb próprio */}
        {!hideBreadcrumb && <MemoizedPageBreadcrumb />}
        
        <div className="flex w-full">
          {/* Sidebar Esquerda */}
          {layout.showLeftSidebar && !forceHideSidebars && (
            <div className={`flex-shrink-0 ${((layout as any).showVideoaulaInicianteSidebar || (layout as any).showVideoaulaOABSidebar) ? 'w-72' : 'w-56'}`}>
              {isVideoPlayer ? (
                <VideoPlaylistSidebar />
              ) : isResumoView ? (
                <ResumosSidebar />
              ) : isAulaView ? (
                <Suspense fallback={<div className="w-64 h-screen bg-background" />}>
                  <AulasPlaylistSidebar 
                    area={aulaArea}
                    aulaAtual={aulaTema}
                  />
                </Suspense>
              ) : (layout as any).showVideoaulaInicianteSidebar ? (
                <VideoaulasInicianteSidebar aulaAtualId={videoaulaInicianteId} />
              ) : (layout as any).showVideoaulaOABSidebar ? (
                <VideoaulasOABSidebar area={videoaulaOABArea} aulaAtualId={videoaulaOABId} />
              ) : (
                <MemoizedAppSidebar />
              )}
            </div>
          )}

          {/* Conteúdo Central */}
          <main className="flex-1 min-h-screen">
            <div className={`${layout.contentMaxWidth} mx-auto ${layout.noPadding ? '' : 'px-8'}`}>
              <AnimatePresence mode="wait" initial={false}>
                <PageTransition key={location.pathname}>
                  {children}
                </PageTransition>
              </AnimatePresence>
            </div>
          </main>

          {/* Painel Direito - FIXO */}
          {layout.rightPanelType === 'news' && !professoraModalOpen && !forceHideSidebars && (
            <div className="sticky top-0 h-screen">
              <MemoizedDesktopNewsSidebar />
            </div>
          )}
          {layout.rightPanelType === 'chat' && !professoraModalOpen && !forceHideSidebars && (
            <div className="sticky top-0 h-screen">
              <MemoizedDesktopChatPanel />
            </div>
          )}
        </div>
      </div>
    );
  }

  // TABLET LAYOUT (640px - 1024px)
  if (isTablet) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
        {!hideHeader && <MemoizedHeader />}
        <main className={`${hideBottomNav ? "flex-1 w-full max-w-5xl mx-auto px-4" : "flex-1 pb-20 w-full max-w-5xl mx-auto px-4"} overflow-x-hidden`}>
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
              {children}
            </PageTransition>
          </AnimatePresence>
        </main>
        {!hideBottomNav && <MemoizedBottomNav />}
      </div>
    );
  }
  
  // MOBILE LAYOUT (< 640px)
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      {!hideHeader && <MemoizedHeader />}
      <main className={`${hideBottomNav ? "flex-1 w-full max-w-7xl mx-auto" : "flex-1 pb-20 w-full max-w-7xl mx-auto"} overflow-x-hidden`}>
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </AnimatePresence>
      </main>
      {!hideBottomNav && <MemoizedBottomNav />}
      
      {/* Card de upgrade Premium para usuários gratuitos */}
      <PremiumWelcomeCard />
      
      {/* Card flutuante de avaliação do app */}
      <RateAppFloatingCard />
    </div>
  );
};
