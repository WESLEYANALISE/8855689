import { useNavigate, useSearchParams } from "react-router-dom";
import heroVadeMecumPlanalto from "@/assets/hero-vademecum-planalto.webp";
import { DesktopVadeMecumHome } from "@/components/desktop/DesktopVadeMecumHome";
import themisEstudosDesktop from "@/assets/themis-estudos-desktop.webp";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Crown, Gavel, FileText, Scale, GraduationCap, BookOpen as BookOpenIcon, Library, Hammer, Target, Search, Headphones, Play, Loader2, Newspaper, ArrowRight, Sparkles, Scroll, Brain, Monitor, Video, BookOpen, Calendar, Settings, Flame, MonitorSmartphone, Users, Landmark, Clapperboard, BarChart3, Film, MessageCircle, Clock, Map, MapPin, Award, Wrench, Baby, BookText, FileCheck, ClipboardList, Layers, Route, Footprints, Briefcase } from "lucide-react";
import cardAulasThumb from "@/assets/card-aulas-thumb.jpg";
import bibliotecaThumb from "@/assets/biblioteca-office-sunset.jpg";
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
import { MobileLeisHome } from "@/components/mobile/MobileLeisHome";
import { useRoutePrefetch } from "@/hooks/useRoutePrefetch";
import { WelcomeAudioPlayer } from "@/components/WelcomeAudioPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SearchBarAnimatedText from "@/components/SearchBarAnimatedText";
import { preloadImages } from "@/hooks/useInstantCache";
import IntroCarousel from "@/components/onboarding/IntroCarousel";
import PremiumCelebration from "@/components/onboarding/PremiumCelebration";

// Imagens de carreiras para preload
import carreiraAdvogado from "@/assets/carreira-advogado.webp";
import carreiraJuiz from "@/assets/carreira-juiz.webp";
import carreiraDelegado from "@/assets/carreira-delegado.webp";
import carreiraPromotor from "@/assets/carreira-promotor.webp";
import carreiraPrf from "@/assets/carreira-prf.webp";
import carreiraPf from "@/assets/pf-004-opt.webp";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia,";
  if (hour >= 12 && hour < 18) return "Boa tarde,";
  return "Boa noite,";
};

// Lista de imagens de carreiras para preload
const CARREIRAS_IMAGES = [
  carreiraAdvogado, carreiraJuiz, carreiraDelegado,
  carreiraPromotor, carreiraPrf, carreiraPf
];

const HERO_IMAGES: Record<string, string> = {
  ferramentas: '/hero-banner-themis-advogado-v2.webp',
  leis: '/hero-banner-themis-chorando.webp',
  destaques: '/hero-banner-tribunal.webp',
};

type MainTab = 'ferramentas' | 'destaques' | 'leis';
type FaculdadeSubTab = 'estudos' | 'ferramentas';

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDesktop } = useDeviceType();
  const { handleLinkHover } = useRoutePrefetch();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Buscar nome do usuário para saudação
  const [userName, setUserName] = useState<string | null>(null);
  useEffect(() => {
    if (!user) { setUserName(null); return; }
    supabase.from('profiles').select('nome').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.nome) setUserName(data.nome.split(' ')[0]);
      });
  }, [user]);

  // Premium celebration for new subscribers
  const [showCelebration, setShowCelebration] = useState(() => {
    if (!user) return false;
    const key = `just_subscribed_${user.id}`;
    if (localStorage.getItem(key) === 'true') {
      localStorage.removeItem(key);
      return true;
    }
    return false;
  });

  // Intro carousel for first-time users
  const [showIntro, setShowIntro] = useState(() => {
    if (!user) return false;
    return !localStorage.getItem(`intro_carousel_seen_${user.id}`);
  });

  const handleIntroComplete = useCallback(() => {
    if (user) {
      localStorage.setItem(`intro_carousel_seen_${user.id}`, 'true');
    }
    setShowIntro(false);
  }, [user]);
  
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
    if (tabFromUrl && ['ferramentas', 'destaques', 'leis'].includes(tabFromUrl)) {
      changeMainTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Escutar cliques do header desktop
  useEffect(() => {
    const handleHeaderClick = (e: CustomEvent<{ tab: string }>) => {
      const tab = e.detail.tab as MainTab;
      if (['ferramentas', 'destaques', 'leis'].includes(tab)) {
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
  
  const heroImage = HERO_IMAGES[mainTab] || HERO_IMAGES.ferramentas;

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
        className={`flex-1 min-w-0 basis-0 px-2 md:px-4 py-2.5 md:py-3 rounded-full text-xs md:text-base font-medium transition-all flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.4)] ${
          isActive
            ? 'bg-red-600 text-white shadow-[0_4px_16px_rgba(220,38,38,0.5)]'
            : 'bg-neutral-800/80 hover:bg-neutral-700/80'
        }`}
      >
        {isActive ? (
          <>
            <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 text-white" />
            <span className="text-white">{label}</span>
          </>
        ) : (
          <>
            <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 animate-icon-shimmer" />
            <span
              className="animate-shimmer bg-clip-text text-transparent"
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
      {/* Animação de celebração Premium */}
      {showCelebration && <PremiumCelebration onComplete={() => setShowCelebration(false)} />}
      {/* Carrossel de introdução para novos usuários */}
      {showIntro && <IntroCarousel onComplete={handleIntroComplete} />}
      {/* Áudio de boas-vindas para novos usuários */}
      <WelcomeAudioPlayer />
      
      {/* Hero Banner Mobile - fixo, cobre do topo até incluir os tabs */}
      <div className="md:hidden fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 1, height: '18rem' }}>
        <div className="w-full h-full overflow-hidden rounded-b-[32px]" style={{ position: 'relative' }}>
          <img 
            src={heroImage}
            alt="Juridiquê"
            className="absolute inset-0 w-full h-full object-cover object-top"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
          {/* Saudação personalizada */}
          {userName && (
            <div className="absolute bottom-24 left-5 pointer-events-auto" style={{ textShadow: '0 4px 16px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5)' }}>
              <p className="text-2xl font-bold text-white/90 leading-tight">{getGreeting()}</p>
              <p className="text-4xl font-bold text-white leading-tight">{userName}</p>
            </div>
          )}
          {/* Ícone de busca no hero */}
          <button
            onClick={() => navigate('/pesquisar')}
            className="absolute top-4 right-5 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 pointer-events-auto hover:bg-white/20 transition-colors"
          >
            <Search className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Header com gradiente sutil - Desktop */}
      <div className="hidden md:block absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none h-96" />

      {/* Spacer para revelar a imagem hero */}
      <div className="md:hidden h-36" style={{ zIndex: 1 }} />

      {/* Tabs dentro da imagem hero, na parte inferior */}
      <div className="md:hidden relative px-4 mb-2" style={{ zIndex: 3 }}>
        <div className="flex gap-1.5 h-[44px]">
          <TabButton tab="ferramentas" icon={Flame} label="Estudos" />
          <TabButton tab="leis" icon={Scale} label="Leis" />
          <TabButton tab="destaques" icon={Sparkles} label="Destaques" />
        </div>

      </div>


      {/* Conteúdo principal - Mobile */}
      <div className="md:hidden bg-muted relative min-h-screen pb-20 rounded-t-[32px]" style={{ zIndex: 2 }}>
        {/* Cards de acesso rápido - Aulas e Notícias */}
        {mainTab === 'ferramentas' && (
          <div className="px-4 pt-6 pb-2 grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/aulas')}
              className="overflow-hidden rounded-2xl text-left border border-border/50 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition-all group bg-card"
            >
              <div className="relative h-[70px] overflow-hidden">
                <img src={cardAulasThumb} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-foreground">Aulas</h3>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Jornada de estudos</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/bibliotecas')}
              className="overflow-hidden rounded-2xl text-left border border-border/50 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition-all group bg-card"
            >
              <div className="relative h-[70px] overflow-hidden">
                <img src={bibliotecaThumb} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <Library className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-foreground">Biblioteca</h3>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Acervo completo</p>
              </div>
            </button>
          </div>
        )}

        <div className="px-4 pt-4 pb-2 space-y-5">
        </div>

        {/* Conteúdo das abas mobile */}
        <div className="px-2 space-y-6">
          {/* ABA FERRAMENTAS - Mobile */}
          {mainTab === 'ferramentas' && (
            <>
              <EmAltaSection isDesktop={false} navigate={navigate} handleLinkHover={handleLinkHover} />
              <OABHomeSection isDesktop={false} navigate={navigate} handleLinkHover={handleLinkHover} />
            </>
          )}

          {/* ABA DESTAQUES - Mobile */}
          {mainTab === 'destaques' && (
            <>
              {/* Notícias em Destaque */}
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                      <Newspaper className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-playfair text-xl font-bold text-foreground tracking-tight">Notícias Jurídicas</h3>
                      <p className="text-xs text-muted-foreground">Fique atualizado</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/noticias-juridicas')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-amber-500/20 text-amber-600 hover:bg-amber-500/30"
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

              {/* Política */}
              <PoliticaHomeSection isDesktop={false} navigate={navigate} handleLinkHover={handleLinkHover} />
            </>
          )}

          {/* ABA LEIS - Mobile */}
          {mainTab === 'leis' && (
            <MobileLeisHome />
          )}
        </div>
      </div>

      {/* ===== Desktop Layout ===== */}
      <div className="hidden md:block flex-1 px-6 py-8 space-y-8 relative" style={{ zIndex: 2 }}>
        {/* Desktop tabs */}
        <div className="flex gap-1.5 mb-2 relative z-20 h-[44px] mt-4">
          <TabButton tab="ferramentas" icon={Flame} label="Estudos" />
          <TabButton tab="leis" icon={Scale} label="Leis" />
          <TabButton tab="destaques" icon={Sparkles} label="Destaques" />
        </div>

        {mainTab === 'ferramentas' && <DesktopHomeDestaque />}

        {mainTab === 'destaques' && <DesktopHomeDestaque />}

        {mainTab === 'leis' && (
          <div className="relative min-h-[70vh]">
            <div className="fixed left-0 right-0 bottom-0 z-0 pointer-events-none" style={{ top: '160px' }}>
              <img 
                src={heroVadeMecumPlanalto} 
                alt="Vade Mecum"
                className="w-full h-full object-cover object-top opacity-60"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/50 to-background" />
            </div>
            <div className="relative z-10">
              <DesktopVadeMecumHome />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;