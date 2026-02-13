import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { preloadImages, saveToInstantCache, getFromInstantCache } from '@/hooks/useInstantCache';

// ===== TIER 1: SUPER CRÍTICAS (max 4) - <link rel="preload"> com fetchPriority="high" =====
import heroBannerThemisAdvogado from '@/assets/hero-banner-themis-advogado-v2.webp';
import heroBannerThemisChorando from '@/assets/hero-banner-themis-chorando.webp';
import heroBannerTribunal from '@/assets/hero-banner-tribunal.webp';
import themisFull from '@/assets/themis-full.webp';

const TIER1_CRITICAL = [
  heroBannerThemisAdvogado,
  heroBannerThemisChorando,
  heroBannerTribunal,
  themisFull,
];

// ===== TIER 2: IMPORTANTES - preload via new Image() em requestIdleCallback =====
import heroVadeMecumPlanalto from '@/assets/hero-vademecum-planalto.webp';
import heroBibliotecas from '@/assets/hero-bibliotecas-office.webp';
import heroBibliotecasSunset from '@/assets/biblioteca-office-sunset.webp';
import capaLideranca from '@/assets/capa-lideranca.webp';
import capaForaDaToga from '@/assets/capa-fora-da-toga.webp';
import capaEstudos from '@/assets/sala-aula-direito.webp';
import capaClassicos from '@/assets/capa-classicos.webp';
import capaOratoria from '@/assets/capa-oratoria.webp';
import capaPesquisaCientifica from '@/assets/capa-pesquisa-cientifica.webp';
import capaPortugues from '@/assets/capa-portugues.webp';
import capaOab from '@/assets/capa-biblioteca-oab.webp';
import politicoEsquerda from '@/assets/politico-esquerda.webp';
import politicoCentro from '@/assets/politico-centro.webp';
import politicoDireita from '@/assets/politico-direita.webp';
import estudosBackground from '@/assets/estudos-background.webp';
import themisEstudosBackground from '@/assets/themis-estudos-background.webp';
import oabAprovacaoHero from '@/assets/oab-aprovacao-hero.webp';
import bgAreasOab from '@/assets/bg-areas-oab.webp';
import oabPrimeiraFaseAprovacao from '@/assets/oab-primeira-fase-aprovacao.webp';

const TIER2_IMPORTANT = [
  heroVadeMecumPlanalto,
  heroBibliotecas,
  heroBibliotecasSunset,
  capaLideranca,
  capaForaDaToga,
  capaEstudos,
  capaClassicos,
  capaOratoria,
  capaPesquisaCientifica,
  capaPortugues,
  capaOab,
  politicoEsquerda,
  politicoCentro,
  politicoDireita,
  estudosBackground,
  themisEstudosBackground,
  oabAprovacaoHero,
  bgAreasOab,
  oabPrimeiraFaseAprovacao,
];

// ===== TIER 3: SECUNDÁRIAS - preload após 3s ou quando ocioso =====
import imgTribunais from '@/assets/categoria-tribunais.png';
import imgCartorios from '@/assets/categoria-cartorios.png';
import imgOab from '@/assets/categoria-oab.png';
import imgEscritorios from '@/assets/categoria-escritorios.png';
import imgMuseus from '@/assets/categoria-museus.png';
import imgTodos from '@/assets/categoria-todos.png';
import heroCursos from '@/assets/hero-cursos.webp';
import heroFlashcards from '@/assets/hero-flashcards.webp';
import heroMapaMental from '@/assets/hero-mapamental.webp';
import heroVideoaulas from '@/assets/hero-videoaulas.webp';
import heroNoticias from '@/assets/hero-noticias.webp';
import heroJuriflix from '@/assets/hero-juriflix.webp';
import heroSumulas from '@/assets/hero-sumulas.webp';
import advogadoDiscursando from '@/assets/advogado-discursando-vertical.webp';
import senadoBg from '@/assets/senado-bg.webp';

const TIER3_SECONDARY = [
  heroCursos, heroFlashcards, heroMapaMental, heroVideoaulas,
  heroNoticias, heroJuriflix, heroSumulas, advogadoDiscursando, senadoBg,
  imgTribunais, imgCartorios, imgOab, imgEscritorios, imgMuseus, imgTodos,
];

// TIER 1: Inserir preload links no head (apenas 4 imagens max)
const insertPreloadLinks = () => {
  TIER1_CRITICAL.forEach(src => {
    const existing = document.querySelector(`link[rel="preload"][href="${src}"]`);
    if (existing) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    (link as any).fetchPriority = 'high';
    document.head.appendChild(link);
  });
};

// TIER 2: Preload quando browser estiver ocioso (requestIdleCallback)
const preloadTier2 = () => {
  const idleCallback = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 100));
  
  idleCallback(() => {
    TIER2_IMPORTANT.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  });
};

// TIER 3: Preload após 3 segundos
const preloadTier3 = () => {
  setTimeout(() => {
    const idleCallback = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 200));
    idleCallback(() => {
      TIER3_SECONDARY.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    });
  }, 3000);
};

// Executar IMEDIATAMENTE quando o módulo carrega
insertPreloadLinks();
preloadTier2();
preloadTier3();

// Configuração de imagens críticas do Supabase para preload
interface CriticalImageConfig {
  key: string;
  table: string;
  imageColumn: string;
  select: string;
  limit: number;
}

const CRITICAL_SUPABASE_IMAGES: CriticalImageConfig[] = [
  { key: 'capas_biblioteca', table: 'CAPA-BIBILIOTECA', imageColumn: 'capa', select: 'id,capa', limit: 10 },
  { key: 'noticias_juridicas_imgs', table: 'noticias_juridicas_cache', imageColumn: 'imagem', select: 'id,imagem_webp,imagem', limit: 6 },
  { key: 'cursos_capas', table: 'CURSOS-APP', imageColumn: 'capa-aula', select: 'id,"capa-aula"', limit: 8 },
  { key: 'blogger_capas', table: 'BLOGGER_JURIDICO', imageColumn: 'url_capa', select: 'id,url_capa', limit: 6 },
  { key: 'flashcards_capas', table: 'flashcards_areas', imageColumn: 'url_capa', select: 'area,url_capa', limit: 8 },
  { key: 'biblioteca_estudos_capas', table: 'BIBLIOTECA-ESTUDOS', imageColumn: 'url_capa_gerada', select: 'id,url_capa_gerada', limit: 50 },
  { key: 'oab_trilhas_materias_capas', table: 'oab_trilhas_materias', imageColumn: 'capa_url', select: 'id,capa_url', limit: 25 },
  { key: 'oab_trilhas_topicos_capas', table: 'oab_trilhas_topicos', imageColumn: 'capa_url', select: 'id,capa_url', limit: 50 },
  { key: 'oab_resumos_capas', table: 'RESUMO', imageColumn: 'url_imagem_resumo', select: 'id,url_imagem_resumo', limit: 100 },
];

let hasStartedAdvanced = false;

async function preloadCriticalSupabaseImages() {
  if (hasStartedAdvanced) return;
  hasStartedAdvanced = true;

  for (const config of CRITICAL_SUPABASE_IMAGES) {
    try {
      const cached = await getFromInstantCache<any[]>(`images_${config.key}`);
      
      let imageUrls: string[] = [];
      
      if (cached && !cached.isStale) {
        imageUrls = cached.data
          .map((item: any) => item[config.imageColumn])
          .filter(Boolean);
      } else {
        const { data } = await supabase
          .from(config.table as any)
          .select(config.select)
          .not(config.imageColumn, 'is', null)
          .order('data_publicacao', { ascending: false, nullsFirst: false })
          .limit(config.limit);

        if (data && data.length > 0) {
          await saveToInstantCache(`images_${config.key}`, data);
          imageUrls = data
            .map((item: any) => item.imagem_webp || item[config.imageColumn])
            .filter(Boolean);
        }
      }

      if (imageUrls.length > 0) {
        await preloadImages(imageUrls);
      }
    } catch (error) {
      // Silent fail
    }
  }
}

export const GlobalImagePreloader = () => {
  const preloadedRef = useRef(false);

  useEffect(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;
    preloadCriticalSupabaseImages();
  }, []);

  return null;
};

export { preloadCriticalSupabaseImages };
