import { useNavigate, useSearchParams } from "react-router-dom";
import oabAprovacaoHero from "@/assets/oab-aprovacao-hero.webp";
import themisEstudosDesktop from "@/assets/themis-estudos-desktop.webp";
import { useState, useMemo, useEffect } from "react";
import { Crown, Gavel, FileText, Scale, GraduationCap, BookOpen as BookOpenIcon, Library, Hammer, Target, Search, Headphones, Play, Loader2, Newspaper, ArrowRight, Sparkles, Scroll, Brain, Monitor, Video, BookOpen, Calendar, Settings, Flame, MonitorSmartphone, Users, Landmark, Clapperboard, BarChart3, Film, MessageCircle, Clock, Map, MapPin, Award, Wrench, Baby, BookText, FileCheck, ClipboardList, Layers, Route, Footprints, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import useEmblaCarousel from 'embla-carousel-react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AudioAula } from "@/types/database.types";
import BibliotecasCarousel from "@/components/BibliotecasCarousel";
import ProposicoesRecentesCarousel from "@/components/ProposicoesRecentesCarousel";
import { useFeaturedNews } from "@/hooks/useFeaturedNews";
import { Button } from "@/components/ui/button";
import { CursosCarousel } from "@/components/CursosCarousel";
import { VideoaulasOABAreasCarousel } from "@/components/VideoaulasOABAreasCarousel";
import { DocumentariosCarousel } from "@/components/DocumentariosCarousel";
import NoticiaCarouselCard from "@/components/NoticiaCarouselCard";
import { useDeviceType } from "@/hooks/use-device-type";
import { CarreirasJuridicasCarousel } from "@/components/CarreirasJuridicasCarousel";
import ResumosDisponiveisCarousel from "@/components/ResumosDisponiveisCarousel";

import BlogInicianteCarousel from "@/components/BlogInicianteCarousel";
import BussolaCarreiraCarousel from "@/components/BussolaCarreiraCarousel";
import { OabCarreiraBlogList } from "@/components/oab/OabCarreiraBlogList";
import { EmAltaSection } from "@/components/EmAltaSection";
import { CarreirasSection } from "@/components/CarreirasSection";
import { PoliticaHomeSection } from "@/components/home/PoliticaHomeSection";
import { OABHomeSection } from "@/components/home/OABHomeSection";
import { DesktopTrilhasAprender } from "@/components/desktop/DesktopTrilhasAprender";
import { DesktopTrilhasOAB } from "@/components/desktop/DesktopTrilhasOAB";
import { DesktopHomeDestaque } from "@/components/desktop/DesktopHomeDestaque";
import { MobileTrilhasAprender } from "@/components/mobile/MobileTrilhasAprender";
import { MobileVadeMecumHome } from "@/components/mobile/MobileVadeMecumHome";
import { DesktopVadeMecumHome } from "@/components/desktop/DesktopVadeMecumHome";
import { useRoutePrefetch } from "@/hooks/useRoutePrefetch";
import { WelcomeAudioPlayer } from "@/components/WelcomeAudioPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { preloadImages } from "@/hooks/useInstantCache";

// Imagens de carreiras para preload
import carreiraAdvogado from "@/assets/carreira-advogado.webp";
import carreiraJuiz from "@/assets/carreira-juiz.webp";
import carreiraDelegado from "@/assets/carreira-delegado.webp";
import carreiraPromotor from "@/assets/carreira-promotor.webp";
import carreiraPrf from "@/assets/carreira-prf.webp";
import carreiraPf from "@/assets/pf-004-opt.webp";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

// Lista de imagens de carreiras para preload
const CARREIRAS_IMAGES = [
  carreiraAdvogado, carreiraJuiz, carreiraDelegado,
  carreiraPromotor, carreiraPrf, carreiraPf
];

const HERO_IMAGES = [
  '/hero-banner-themis-advogado-v2.webp',
  '/hero-banner-themis-chorando.webp',
  '/hero-banner-tribunal.webp'
];

type MainTab = 'ferramentas' | 'iniciante' | 'leis';
type FaculdadeSubTab = 'estudos' | 'ferramentas';

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDesktop } = useDeviceType();
  const { handleLinkHover } = useRoutePrefetch();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  
  // Ler tab da URL para navegação de volta (default agora é 'ferramentas' / Estudos)
  const tabFromUrl = searchParams.get('tab') as MainTab | null;
  const [mainTab, setMainTab] = useState<MainTab>(tabFromUrl || 'ferramentas');
  const [faculdadeSubTab, setFaculdadeSubTab] = useState<FaculdadeSubTab>('estudos');

  // Função para mudar tab e notificar o header
  const changeMainTab = (tab: MainTab) => {
    setMainTab(tab);
    // Notificar o DesktopTopNav
    window.dispatchEvent(new CustomEvent('desktop-nav-tab-change', { detail: { tab } }));
  };

  // Preload das imagens de carreiras assim que o app monta
  useEffect(() => {
    preloadImages(CARREIRAS_IMAGES);
  }, []);

  // Atualizar tab quando URL mudar
  useEffect(() => {
    if (tabFromUrl && ['ferramentas', 'iniciante', 'leis'].includes(tabFromUrl)) {
      changeMainTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Escutar cliques do header desktop
  useEffect(() => {
    const handleHeaderClick = (e: CustomEvent<{ tab: string }>) => {
      const tab = e.detail.tab as MainTab;
      if (['ferramentas', 'iniciante', 'leis'].includes(tab)) {
        setMainTab(tab);
      }
    };
    
    window.addEventListener('header-nav-tab-click' as any, handleHeaderClick);
    return () => window.removeEventListener('header-nav-tab-click' as any, handleHeaderClick);
  }, []);

  // Esconder menu de rodapé quando não estiver em "Ferramentas"
  useEffect(() => {
    const bottomNav = document.querySelector('[data-bottom-nav]');
    if (bottomNav) {
      (bottomNav as HTMLElement).style.display = mainTab === 'ferramentas' ? '' : 'none';
    }
    return () => {
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = '';
      }
    };
  }, [mainTab]);

  // Controlar visibilidade das sidebars no desktop (ocultar quando em abas expandidas)
  useEffect(() => {
    if (isDesktop && mainTab !== 'ferramentas') {
      window.dispatchEvent(new CustomEvent('hide-desktop-sidebars'));
    } else {
      window.dispatchEvent(new CustomEvent('show-desktop-sidebars'));
    }
    
    return () => {
      // Sempre restaurar sidebars ao sair da página
      window.dispatchEvent(new CustomEvent('show-desktop-sidebars'));
    };
  }, [isDesktop, mainTab]);
  
  // Hero image changes only once per hour
  const heroImage = useMemo(() => {
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const now = Date.now();
    
    const saved = localStorage.getItem('heroImageData');
    let currentIndex = 0;
    let lastChanged = 0;
    
    if (saved) {
      try {
        const data = JSON.parse(saved);
        currentIndex = data.index ?? 0;
        lastChanged = data.changedAt ?? 0;
      } catch {
        // Fallback if corrupted
      }
    }
    
    // Change image only if 1 hour has passed
    if (now - lastChanged >= ONE_HOUR_MS) {
      const nextIndex = saved ? (currentIndex + 1) % HERO_IMAGES.length : 0;
      localStorage.setItem('heroImageData', JSON.stringify({
        index: nextIndex,
        changedAt: now
      }));
      return HERO_IMAGES[nextIndex];
    }
    
    return HERO_IMAGES[currentIndex];
  }, []);

  const {
    featuredNews,
    loading: loadingNews,
  } = useFeaturedNews();

  // Componente de botão de aba principal
  const TabButton = ({ tab, icon: Icon, label }: { tab: MainTab; icon: React.ElementType; label: string }) => {
    const isActive = mainTab === tab;

    return (
      <button
        onClick={() => changeMainTab(tab)}
        className={`flex-1 px-3 md:px-4 py-2.5 md:py-3 rounded-full text-sm md:text-base font-medium transition-all flex items-center justify-center gap-1.5 md:gap-2 ${
          isActive
            ? 'bg-red-600 text-white shadow-lg'
            : 'bg-neutral-800/80 hover:bg-neutral-700/80'
        }`}
      >
        {isActive ? (
          <>
            <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 text-white" />
            <span className="text-white truncate">{label}</span>
          </>
        ) : (
          <>
            <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 animate-icon-shimmer" />
            <span
              className="animate-shimmer bg-clip-text text-transparent truncate"
              style={{
                backgroundImage: 'linear-gradient(90deg, rgb(163 163 163) 40%, rgb(250 250 250) 50%, rgb(163 163 163) 60%)',
                backgroundSize: '200% 100%',
              }}
            >
              {label}
            </span>
          </>
        )}
      </button>
    );
  };


  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0 relative">
      {/* Áudio de boas-vindas para novos usuários */}
      <WelcomeAudioPlayer />
      
      {/* Hero Banner Mobile - Menor e com opacidade reduzida */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-56 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <img 
          src={heroImage}
          alt="Direito X"
          className="absolute inset-0 w-full h-full object-cover object-top opacity-85"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        {/* Gradiente suave para transição */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background" />
      </div>

      {/* Header com gradiente sutil - Desktop */}
      <div className="hidden md:block absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none h-96" />

      <div className="flex-1 md:px-6 md:py-8 space-y-6 md:space-y-8 relative px-[8px] py-[2px]" style={{ zIndex: 2 }}>
        {/* Search Bar - Apenas mobile (desktop usa a barra no header) */}
        <div 
          data-tutorial="busca-principal"
          onClick={() => navigate('/pesquisar')} 
          className="md:hidden group flex items-center gap-3 px-5 py-4 bg-card/90 rounded-2xl cursor-pointer border border-border/50 hover:border-primary/30 hover:bg-card transition-colors duration-150 shadow-lg mt-4"
        >
          <div className="p-2 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors">
            <Search className="w-5 h-5 text-red-400" />
          </div>
          <span className="text-muted-foreground text-sm group-hover:text-foreground/80 transition-colors">
            O que você quer buscar?
          </span>
        </div>

        {/* Menu de Alternância Principal - Apenas mobile (desktop não tem abas) */}
        {/* Ordem: Aulas (esquerda), Estudos (centro), Leis (direita) */}
        <div className={`flex gap-1.5 md:hidden mb-6 relative z-20 ${mainTab !== 'ferramentas' ? 'bg-background/95 backdrop-blur-sm -mx-2 px-2 py-2 rounded-xl' : ''}`}>
          <TabButton tab="iniciante" icon={GraduationCap} label="Aulas" />
          <TabButton tab="ferramentas" icon={Flame} label="Estudos" />
          <TabButton tab="leis" icon={Scale} label="Leis" />
        </div>


        {/* ==================== ABA FERRAMENTAS ==================== */}
        {mainTab === 'ferramentas' && (
          <>
            {/* Desktop: Layout otimizado em colunas */}
            {isDesktop ? (
              <DesktopHomeDestaque />
            ) : (
              <>
                {/* Notícias em Destaque - apenas mobile/tablet */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/20 rounded-xl">
                        <Newspaper className="w-5 h-5 text-amber-100" />
                      </div>
                      <div>
                        <h2 className="font-cinzel text-base md:text-base font-bold text-amber-100">Notícias Jurídicas</h2>
                        <p className="text-xs text-white/70">Fique atualizado</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/noticias-juridicas')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
                    >
                      <span>Ver mais</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <ScrollArea className="w-full">
                    <div className="flex gap-3 pb-4 touch-pan-x">
                      {featuredNews.slice(0, 6).map((noticia, index) => (
                        <NoticiaCarouselCard 
                          key={noticia.id} 
                          noticia={noticia} 
                          priority={index < 3}
                        />
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>

                {/* Em Alta - Design Premium com Abas */}
                <EmAltaSection isDesktop={isDesktop} navigate={navigate} handleLinkHover={handleLinkHover} />

                {/* OAB - Nova seção entre Estudos e Política */}
                <OABHomeSection isDesktop={isDesktop} navigate={navigate} handleLinkHover={handleLinkHover} />

                {/* Política - Livros, Artigos e Documentários */}
                <PoliticaHomeSection isDesktop={isDesktop} navigate={navigate} handleLinkHover={handleLinkHover} />

                {/* Carreiras Jurídicas */}
                <CarreirasSection isDesktop={isDesktop} navigate={navigate} handleLinkHover={handleLinkHover} />
              </>
            )}
          </>
        )}

        {/* ==================== ABA ESTUDOS - LINHA DO TEMPO ==================== */}
        {mainTab === 'iniciante' && (
          <div className={`relative ${isDesktop ? 'min-h-[70vh]' : 'min-h-[500px]'}`}>
            {/* Imagem de fundo Themis - fixa a partir do menu de alternância */}
            <div className="fixed left-0 right-0 bottom-0 z-0 pointer-events-none" style={{ top: '160px' }}>
              <img 
                src={themisEstudosDesktop} 
                alt="Jornada de Estudos"
                className="w-full h-full object-cover object-top opacity-60"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/50 to-background" />
            </div>

            {/* Conteúdo sobre o fundo */}
            <div className="relative z-10">
              {/* Desktop: Layout horizontal das trilhas */}
              {isDesktop ? (
                <DesktopTrilhasAprender />
              ) : (
                <MobileTrilhasAprender />
              )}
            </div>
          </div>
        )}

        {/* ==================== ABA LEIS - VADE MECUM ==================== */}
        {mainTab === 'leis' && (
          <div className={`relative ${isDesktop ? 'min-h-[70vh]' : 'min-h-[500px]'}`}>
            {/* Imagem de fundo fixa (estilo igual à aba Aulas) */}
            <div className="fixed left-0 right-0 bottom-0 z-0 pointer-events-none" style={{ top: '160px' }}>
              <img 
                src={oabAprovacaoHero} 
                alt="Vade Mecum"
                className="w-full h-full object-cover object-top opacity-50"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
            </div>

            {/* Conteúdo do Vade Mecum sobre o fundo */}
            <div className="relative z-10">
              {isDesktop ? (
                <DesktopVadeMecumHome />
              ) : (
                <MobileVadeMecumHome />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;