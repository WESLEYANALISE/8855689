import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { preloadImages, saveToInstantCache, getFromInstantCache } from '@/hooks/useInstantCache';

// SUPER CRÍTICAS - Home, Vade Mecum, Bibliotecas (preload imediato via <link rel="preload">)
import heroBannerThemisAdvogado from '@/assets/hero-banner-themis-advogado-v2.webp';
import heroBannerThemisChorando from '@/assets/hero-banner-themis-chorando.webp';
import heroBannerTribunal from '@/assets/hero-banner-tribunal.webp';
import heroVadeMecumPlanalto from '@/assets/hero-vademecum-planalto.webp';
import themisFull from '@/assets/themis-full.webp';
import heroBibliotecas from '@/assets/hero-bibliotecas-office.webp';

// BIBLIOTECAS - Capas locais (preload imediato para carregamento instantâneo)
import heroBibliotecasSunset from '@/assets/biblioteca-office-sunset.jpg';
import capaLideranca from '@/assets/capa-lideranca.jpg';
import capaForaDaToga from '@/assets/capa-fora-da-toga.jpg';
import capaEstudos from '@/assets/capa-estudos-opt.webp';
import capaClassicos from '@/assets/capa-classicos.jpg';
import capaOratoria from '@/assets/capa-oratoria.jpg';
import capaPesquisaCientifica from '@/assets/capa-pesquisa-cientifica.jpg';
import capaPortugues from '@/assets/capa-portugues.jpg';
import capaOab from '@/assets/capa-biblioteca-oab.jpg';

// Cards políticos - CRÍTICAS para página Política
import politicoEsquerda from '@/assets/politico-esquerda.png';
import politicoCentro from '@/assets/politico-centro.png';
import politicoDireita from '@/assets/politico-direita.png';
import estudosBackground from '@/assets/estudos-background.jpg';

// JORNADAS OAB/ESTUDOS - CRÍTICAS
import themisEstudosBackground from '@/assets/themis-estudos-background.webp';
import oabAprovacaoHero from '@/assets/oab-aprovacao-hero.webp';
import bgAreasOab from '@/assets/bg-areas-oab.webp';
import oabPrimeiraFaseAprovacao from '@/assets/oab-primeira-fase-aprovacao.webp';

// Imagens SUPER críticas - preload via <link rel="preload">
const SUPER_CRITICAL_IMAGES = [
  heroBannerThemisAdvogado,
  heroBannerThemisChorando,
  heroBannerTribunal,
  heroVadeMecumPlanalto,
  themisFull,
  heroBibliotecas,
  // BIBLIOTECAS - Background + 8 capas (preload prioritário)
  heroBibliotecasSunset,
  capaLideranca,
  capaForaDaToga,
  capaEstudos,
  capaClassicos,
  capaOratoria,
  capaPesquisaCientifica,
  capaPortugues,
  capaOab,
  // Cards políticos - preload prioritário
  politicoEsquerda,
  politicoCentro,
  politicoDireita,
  estudosBackground,
  // Jornadas OAB/Estudos - preload prioritário
  themisEstudosBackground,
  oabAprovacaoHero,
  bgAreasOab,
  oabPrimeiraFaseAprovacao,
];

// Imagens das categorias do Localizador Jurídico
import imgTribunais from '@/assets/categoria-tribunais.png';
import imgCartorios from '@/assets/categoria-cartorios.png';
import imgOab from '@/assets/categoria-oab.png';
import imgEscritorios from '@/assets/categoria-escritorios.png';
import imgMuseus from '@/assets/categoria-museus.png';
import imgTodos from '@/assets/categoria-todos.png';

// SECUNDÁRIAS - Outras páginas (preload quando ocioso)
import heroCursos from '@/assets/hero-cursos.webp';
import heroFlashcards from '@/assets/hero-flashcards.webp';
import heroMapaMental from '@/assets/hero-mapamental.webp';
import heroVideoaulas from '@/assets/hero-videoaulas.webp';
import heroNoticias from '@/assets/hero-noticias.webp';
import heroJuriflix from '@/assets/hero-juriflix.webp';
import heroSumulas from '@/assets/hero-sumulas.webp';
import advogadoDiscursando from '@/assets/advogado-discursando-vertical.webp';
import senadoBg from '@/assets/senado-bg.webp';

// Imagens secundárias - preload quando browser estiver ocioso
const SECONDARY_IMAGES = [
  heroCursos,
  heroFlashcards,
  heroMapaMental,
  heroVideoaulas,
  heroNoticias,
  heroJuriflix,
  heroSumulas,
  advogadoDiscursando,
  senadoBg,
  // Categorias do Localizador Jurídico
  imgTribunais,
  imgCartorios,
  imgOab,
  imgEscritorios,
  imgMuseus,
  imgTodos,
];

// Função para inserir preload links no head (apenas super críticas)
const insertPreloadLinks = () => {
  SUPER_CRITICAL_IMAGES.forEach(src => {
    const existing = document.querySelector(`link[rel="preload"][href="${src}"]`);
    if (existing) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.fetchPriority = 'high';
    document.head.appendChild(link);
  });
};

// Preload imagens secundárias quando ocioso
const preloadSecondaryImages = () => {
  const idleCallback = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 200));
  
  idleCallback(() => {
    SECONDARY_IMAGES.forEach(src => {
      const img = new Image();
      img.src = src;
    });
    console.log('🖼️ GlobalImagePreloader: Imagens secundárias carregadas');
  });
};

// Executar IMEDIATAMENTE quando o módulo carrega
insertPreloadLinks();
preloadSecondaryImages();

// Configuração de imagens críticas do Supabase para preload
interface CriticalImageConfig {
  key: string;
  table: string;
  imageColumn: string;
  select: string;
  limit: number;
}

// CRÍTICAS: imagens above-the-fold incluindo notícias jurídicas
const CRITICAL_SUPABASE_IMAGES: CriticalImageConfig[] = [
  // PRIORIDADE MÁXIMA: Capas das bibliotecas (página /bibliotecas)
  { key: 'capas_biblioteca', table: 'CAPA-BIBILIOTECA', imageColumn: 'capa', select: 'id,capa', limit: 10 },
  // Notícias jurídicas do carrossel principal - usa imagem como fallback
  { key: 'noticias_juridicas_imgs', table: 'noticias_juridicas_cache', imageColumn: 'imagem', select: 'id,imagem_webp,imagem', limit: 6 },
  { key: 'cursos_capas', table: 'CURSOS-APP', imageColumn: 'capa-aula', select: 'id,"capa-aula"', limit: 8 },
  { key: 'blogger_capas', table: 'BLOGGER_JURIDICO', imageColumn: 'url_capa', select: 'id,url_capa', limit: 6 },
  { key: 'flashcards_capas', table: 'flashcards_areas', imageColumn: 'url_capa', select: 'area,url_capa', limit: 8 },
  // Capas geradas da biblioteca de estudos (aumentado para 50)
  { key: 'biblioteca_estudos_capas', table: 'BIBLIOTECA-ESTUDOS', imageColumn: 'url_capa_gerada', select: 'id,url_capa_gerada', limit: 50 },
  // TRILHAS OAB - Capas das áreas/matérias (preload instantâneo)
  { key: 'oab_trilhas_materias_capas', table: 'oab_trilhas_materias', imageColumn: 'capa_url', select: 'id,capa_url', limit: 25 },
  // TRILHAS OAB - Capas das matérias (tópicos)
  { key: 'oab_trilhas_topicos_capas', table: 'oab_trilhas_topicos', imageColumn: 'capa_url', select: 'id,capa_url', limit: 50 },
  // TRILHAS OAB - Capas dos subtemas (RESUMO)
  { key: 'oab_resumos_capas', table: 'RESUMO', imageColumn: 'url_imagem_resumo', select: 'id,url_imagem_resumo', limit: 100 },
];

let hasStartedAdvanced = false;

async function preloadCriticalSupabaseImages() {
  if (hasStartedAdvanced) return;
  hasStartedAdvanced = true;

  console.log('🖼️ GlobalImagePreloader: Iniciando preload avançado...');
  const startTime = performance.now();

  for (const config of CRITICAL_SUPABASE_IMAGES) {
    try {
      // Verifica se já tem no cache
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
          // Para notícias, usar imagem_webp com fallback para imagem
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

  const elapsed = Math.round(performance.now() - startTime);
  console.log(`✅ GlobalImagePreloader: Preload avançado concluído em ${elapsed}ms`);
}

export const GlobalImagePreloader = () => {
  const preloadedRef = useRef(false);

  useEffect(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;

    // Preload imagens do Supabase IMEDIATAMENTE (não espera idle)
    // Isso garante que as notícias jurídicas estejam prontas quando o usuário ver a página
    preloadCriticalSupabaseImages();
  }, []);

  return null;
};

// Exportar para uso externo (preload mais cedo possível)
export { preloadCriticalSupabaseImages };
